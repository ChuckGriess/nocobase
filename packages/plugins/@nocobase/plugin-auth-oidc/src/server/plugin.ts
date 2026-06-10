/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import type { Context, Next } from '@nocobase/actions';
import { OIDCAuth, OIDC_AUTH_TYPE, OIDC_CACHE_NAME } from './oidc-auth';

export class PluginAuthOIDCServer extends Plugin {
  async load() {
    // Short-lived store for per-login state/nonce/PKCE values
    await this.app.cacheManager.createCache({ name: OIDC_CACHE_NAME, store: 'memory' });

    // Register the OIDC auth type with the auth manager
    this.app.authManager.registerTypes(OIDC_AUTH_TYPE, {
      auth: OIDCAuth,
    });

    // Add actions to the EXISTING `auth` resource (defined by plugin-auth, which
    // loads first). We must NOT call app.resource({ name: 'auth' }) — that would
    // redefine the resource and clobber signIn/signOut/check.
    const authResource = this.app.resourceManager.getResource('auth');
    if (!authResource) {
      throw new Error('[plugin-auth-oidc] `auth` resource not found — is @nocobase/plugin-auth enabled?');
    }

    // ── GET /api/auth:getAuthUrl?authenticator=<name> ─────────────────────
    // Returns { redirectUrl, state } so the client can redirect the browser.
    authResource.addAction('getAuthUrl', async (ctx: Context, next: Next) => {
      const { authenticator: authenticatorName } = ctx.action.params;
      if (!authenticatorName) {
        ctx.throw(400, 'authenticator parameter is required');
      }

      const auth = await ctx.app.authManager.get(authenticatorName, ctx);
      if (!(auth instanceof OIDCAuth)) {
        ctx.throw(400, 'Specified authenticator is not an OIDC authenticator');
      }

      ctx.body = await auth.getAuthUrl();
      return next();
    });

    // ── GET /api/auth:redirect?authenticator=<name>&code=...&state=... ──
    // Handles the OIDC provider callback. signIn() invokes OIDCAuth.validate()
    // (the code exchange) and issues a JWT, then we redirect the browser back
    // to the SPA with ?token=&authenticator= which the client's AuthProvider
    // reads to establish the session.
    authResource.addAction('redirect', async (ctx: Context, next: Next) => {
      const { authenticator: authenticatorName, code } = ctx.action.params;

      if (!authenticatorName || !code) {
        ctx.throw(400, 'authenticator and code parameters are required');
      }

      const auth = await ctx.app.authManager.get(authenticatorName, ctx);
      if (!(auth instanceof OIDCAuth)) {
        ctx.throw(400, 'Specified authenticator is not an OIDC authenticator');
      }

      const { token } = await auth.signIn();
      const target = `${auth.appUrl}/?authenticator=${encodeURIComponent(authenticatorName)}&token=${encodeURIComponent(
        token,
      )}`;
      ctx.redirect(target);

      return next();
    });

    // Allow unauthenticated access to the OIDC endpoints
    this.app.acl.allow('auth', 'getAuthUrl', 'public');
    this.app.acl.allow('auth', 'redirect', 'public');
  }
}
