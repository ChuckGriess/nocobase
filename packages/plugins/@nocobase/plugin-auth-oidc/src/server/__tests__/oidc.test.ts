/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import { OIDC_AUTH_TYPE, OIDC_CACHE_NAME } from '../oidc-auth';

describe('plugin-auth-oidc wiring', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: ['field-sort', 'users', 'auth', 'acl', 'data-source-manager', 'system-settings', 'auth-oidc'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('registers the OIDC auth type with the auth manager', () => {
    // listTypes() returns the registered auth type names
    const types = app.authManager.listTypes().map((t: { name: string }) => t.name);
    expect(types).toContain(OIDC_AUTH_TYPE);
  });

  it('does not clobber the auth resource — signIn/signOut/check still exist', () => {
    // Regression: adding OIDC actions must extend the auth resource, not redefine it.
    const authResource = app.resourceManager.getResource('auth');
    expect(() => authResource.getAction('signIn')).not.toThrow();
    expect(() => authResource.getAction('signOut')).not.toThrow();
    expect(() => authResource.getAction('check')).not.toThrow();
    expect(() => authResource.getAction('getAuthUrl')).not.toThrow();
    expect(() => authResource.getAction('redirect')).not.toThrow();
  });

  it('can store and retrieve transient login state in the OIDC cache', async () => {
    // Mirrors the auth's create-on-miss usage: the round-trip the login flow relies on.
    const cache = await app.cacheManager.createCache({ name: OIDC_CACHE_NAME, store: 'memory' });
    await cache.set('state-key', { nonce: 'n', codeVerifier: 'v' }, 10_000);
    expect(await cache.get('state-key')).toEqual({ nonce: 'n', codeVerifier: 'v' });
  });

  it('rejects getAuthUrl without an authenticator parameter', async () => {
    const res = await app.agent().resource('auth').getAuthUrl();
    expect(res.status).toBe(400);
  });

  it('rejects redirect without a code parameter', async () => {
    const res = await app.agent().resource('auth').redirect({ authenticator: 'azure-ad' });
    expect(res.status).toBe(400);
  });
});
