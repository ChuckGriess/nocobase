/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import React from 'react';
import { OIDCButton } from './OIDCButton';

export class PluginAuthOIDCClient extends Plugin {
  async load() {
    // Register the OIDC login component so the auth plugin can render it
    // on the sign-in page when an OIDC authenticator is configured.
    this.app.addComponents({ OIDCLoginButton: OIDCButton });
  }
}
