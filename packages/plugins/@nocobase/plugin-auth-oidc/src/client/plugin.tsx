/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import AuthPlugin from '@nocobase/plugin-auth/client';
import { OIDCButton } from './OIDCButton';
import { OIDCSettingsForm } from './OIDCSettingsForm';
import { authType, namespace } from '../constants';
import { enUS, zhCN } from './locale';

export class PluginAuthOIDCClient extends Plugin {
  async load() {
    await this.app.i18n.loadResourceBundle('en-US', namespace, enUS);
    await this.app.i18n.loadResourceBundle('zh-CN', namespace, zhCN);

    // Register the OIDC auth type so it appears in Settings → Authentication
    // (type dropdown + admin settings form) and renders a sign-in button on
    // the login page. The authType string must match the server's registerTypes.
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType(authType, {
      components: {
        SignInButton: OIDCButton,
        AdminSettingsForm: OIDCSettingsForm,
      },
    });
  }
}
