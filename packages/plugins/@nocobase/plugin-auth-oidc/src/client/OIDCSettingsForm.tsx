/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponent } from '@nocobase/client';
import React from 'react';
import { useOIDCTranslation } from './locale';

/**
 * Admin settings form for an OIDC authenticator (Settings → Authentication →
 * add/edit). Field names are top-level option keys because the auth settings
 * form binds its values to the authenticator's `options` object, which the
 * server reads via `config.authenticator.get('options')` (see OIDCAuth).
 */
export const OIDCSettingsForm = () => {
  const { t } = useOIDCTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      schema={{
        type: 'object',
        properties: {
          issuerUrl: {
            type: 'string',
            title: '{{t("Issuer URL")}}',
            description:
              '{{t("OIDC discovery URL. For Microsoft Entra ID: https://login.microsoftonline.com/{tenantId}/v2.0")}}',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
          clientId: {
            type: 'string',
            title: '{{t("Client ID")}}',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
          clientSecret: {
            type: 'string',
            title: '{{t("Client Secret")}}',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Password',
          },
          appUrl: {
            type: 'string',
            title: '{{t("App URL")}}',
            description:
              '{{t("Public URL of this app, used to build the redirect URI (e.g. https://my-lms.up.railway.app)")}}',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
          scope: {
            type: 'string',
            title: '{{t("Scope")}}',
            description: '{{t("Space-separated OIDC scopes. Default: openid profile email")}}',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            'x-component-props': { placeholder: 'openid profile email' },
          },
          usernameClaim: {
            type: 'string',
            title: '{{t("Username claim")}}',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            'x-component-props': { placeholder: 'preferred_username' },
          },
          emailClaim: {
            type: 'string',
            title: '{{t("Email claim")}}',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            'x-component-props': { placeholder: 'email' },
          },
          nameClaim: {
            type: 'string',
            title: '{{t("Nickname claim")}}',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            'x-component-props': { placeholder: 'name' },
          },
        },
      }}
    />
  );
};
