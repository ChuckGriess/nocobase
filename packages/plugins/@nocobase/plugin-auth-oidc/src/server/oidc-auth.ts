/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseAuth } from '@nocobase/auth';
import type { AuthConfig } from '@nocobase/auth';
import * as openidClient from 'openid-client';

export const OIDC_AUTH_TYPE = 'OIDC';

/** Cache namespace holding the per-login transient state → {nonce, codeVerifier} map. */
export const OIDC_CACHE_NAME = 'oidc-auth';

/** Transient login values live for 10 minutes — long enough to complete the round-trip. */
const LOGIN_STATE_TTL = 10 * 60 * 1000;

export interface OIDCOptions {
  /** OIDC discovery URL — for Azure AD: https://login.microsoftonline.com/{tenantId}/v2.0 */
  issuerUrl: string;
  /** Azure AD Application (client) ID */
  clientId: string;
  /** Azure AD Client Secret */
  clientSecret: string;
  /**
   * Public URL of this NocoBase instance used to build the redirect URI.
   * Example: https://my-lms.railway.app
   */
  appUrl: string;
  /** Space-separated OIDC scopes. Default: "openid profile email" */
  scope?: string;
  /** Claim to use as the NocoBase username. Default: "preferred_username" */
  usernameClaim?: string;
  /** Claim to use as the NocoBase email. Default: "email" */
  emailClaim?: string;
  /** Claim to use as the nickname. Default: "name" */
  nameClaim?: string;
}

interface LoginCheck {
  nonce: string;
  codeVerifier: string;
}

/**
 * OIDCAuth implements the NocoBase BaseAuth contract for any OIDC provider.
 *
 * Flow (authorization code + PKCE):
 *   1. GET /api/auth:getAuthUrl?authenticator=<name>
 *      → generates state + nonce + PKCE verifier, persists them server-side
 *        keyed by `state`, and returns the provider authorization URL.
 *   2. User authenticates at the provider.
 *   3. GET /api/auth:redirect?authenticator=<name>&code=...&state=...
 *      → looks up the stored nonce/verifier by `state`, exchanges the code,
 *        and validates state, nonce, PKCE, and the id_token (iss/aud/exp/
 *        signature — done automatically by openid-client). Then upserts the
 *        local user and issues a JWT.
 */
export class OIDCAuth extends BaseAuth {
  private clientConfig: OIDCOptions;

  constructor(config: AuthConfig) {
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
    this.clientConfig = (config.authenticator.get('options') ?? {}) as OIDCOptions;
  }

  /** Public base URL of this NocoBase instance (used to build the post-login redirect). */
  get appUrl() {
    return this.clientConfig.appUrl ?? '';
  }

  private get redirectUri() {
    return `${this.clientConfig.appUrl}/api/auth:redirect?authenticator=${this.authenticator.get('name')}`;
  }

  private async getClient() {
    const { issuerUrl, clientId, clientSecret } = this.clientConfig;
    const issuer = await openidClient.Issuer.discover(issuerUrl);
    return new issuer.Client({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris: [this.redirectUri],
      response_types: ['code'],
    });
  }

  private async getCache() {
    const cacheManager = this.ctx.app.cacheManager;
    try {
      return cacheManager.getCache(OIDC_CACHE_NAME);
    } catch {
      // Created in plugin load(), but create-on-miss keeps this resilient.
      return cacheManager.createCache({ name: OIDC_CACHE_NAME, store: 'memory' });
    }
  }

  /**
   * Builds the provider authorization URL and persists the per-login
   * state/nonce/PKCE values so the callback can verify them.
   */
  async getAuthUrl() {
    const { scope = 'openid profile email' } = this.clientConfig;
    const client = await this.getClient();

    const state = openidClient.generators.state();
    const nonce = openidClient.generators.nonce();
    const codeVerifier = openidClient.generators.codeVerifier();
    const codeChallenge = openidClient.generators.codeChallenge(codeVerifier);

    const cache = await this.getCache();
    await cache.set(state, { nonce, codeVerifier } as LoginCheck, LOGIN_STATE_TTL);

    const redirectUrl = client.authorizationUrl({
      scope,
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      response_type: 'code',
    });

    return { redirectUrl, state };
  }

  /**
   * BaseAuth contract — invoked by `signIn()`. For OIDC this is the provider
   * callback handler: it reads `code`/`state` from the request, verifies
   * state/nonce/PKCE + id_token, then upserts and returns the local user.
   *
   * `validate()` is only ever called during sign-in (never on the per-request
   * `check()`/`checkToken()` path), so performing the code exchange here is safe.
   */
  async validate() {
    const { code, state } = this.ctx.action.params as { code?: string; state?: string };
    const { usernameClaim = 'preferred_username', emailClaim = 'email', nameClaim = 'name' } = this.clientConfig;

    if (!code || !state) {
      this.ctx.throw(400, 'Missing code or state parameter');
    }

    // Retrieve and immediately invalidate the one-time login values
    const cache = await this.getCache();
    const check = await cache.get<LoginCheck>(state);
    await cache.del(state);
    if (!check) {
      this.ctx.throw(401, 'Invalid or expired login state');
    }

    const client = await this.getClient();

    // openid-client validates: state match, nonce match (replay protection),
    // PKCE code_verifier, and the id_token signature/iss/aud/exp.
    const tokenSet = await client.callback(
      this.redirectUri,
      { code, state },
      { state, nonce: check.nonce, code_verifier: check.codeVerifier },
    );
    const claims = tokenSet.claims();

    const userEmail = (claims[emailClaim] as string | undefined) ?? null;
    const username = (claims[usernameClaim] as string | undefined) ?? userEmail ?? String(claims.sub);
    const nickname = (claims[nameClaim] as string | undefined) ?? username;
    const externalUuid = String(claims.sub);

    const db = this.ctx.db;
    const usersRepo = db.getRepository('users');
    const authenticatorsUsersRepo = db.getRepository('usersAuthenticators');

    // Match by stable external subject id first
    const existingMapping = await authenticatorsUsersRepo.findOne({
      filter: { uuid: externalUuid, authenticatorId: this.authenticator.get('id') },
    });

    if (existingMapping) {
      return usersRepo.findOne({ filter: { id: existingMapping.get('userId') } });
    }

    // Otherwise match by email, or create a new user (gets the default role).
    let user: { id: number } | null = null;
    if (userEmail) {
      user = await usersRepo.findOne({ filter: { email: userEmail } });
    }
    if (!user) {
      user = await usersRepo.create({ values: { username, email: userEmail, nickname } });
    }

    await authenticatorsUsersRepo.create({
      values: {
        uuid: externalUuid,
        nickname,
        authenticatorId: this.authenticator.get('id'),
        userId: user.id,
        meta: claims,
      },
    });

    return user;
  }
}
