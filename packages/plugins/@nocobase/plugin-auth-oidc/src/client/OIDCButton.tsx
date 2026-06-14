/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback } from 'react';
import { Button, message } from 'antd';
import { useAPIClient } from '@nocobase/client';
import type { Authenticator } from '@nocobase/plugin-auth/client';
import { useOIDCTranslation } from './locale';

interface OIDCButtonProps {
  /** The authenticator record, injected by the auth plugin's sign-in page. */
  authenticator: Authenticator;
}

/**
 * Sign-in button rendered on the NocoBase login page for an OIDC authenticator.
 *
 * Clicking it:
 *   1. Calls GET /api/auth:getAuthUrl?authenticator=<name>
 *   2. Redirects the browser to the returned OIDC authorization URL
 *
 * The OIDC provider then redirects back to /api/auth:redirect which issues
 * the JWT and redirects the browser to the app home page.
 */
export const OIDCButton: React.FC<OIDCButtonProps> = ({ authenticator }) => {
  const api = useAPIClient();
  const { t } = useOIDCTranslation();
  const label = authenticator.title || t('Sign in with Microsoft');

  const handleClick = useCallback(async () => {
    try {
      const response = await api.request({
        url: 'auth:getAuthUrl',
        method: 'GET',
        params: { authenticator: authenticator.name },
      });
      const { redirectUrl } = response.data?.data ?? {};
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        message.error(t('Could not retrieve the SSO login URL.'));
      }
    } catch {
      message.error(t('SSO login failed. Please try again.'));
    }
  }, [api, authenticator.name, t]);

  return (
    <Button block size="large" icon={<MicrosoftIcon />} onClick={handleClick} aria-label={label}>
      {label}
    </Button>
  );
};

// Simple Microsoft logo SVG (monochrome, scales with button)
const MicrosoftIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 21 21"
    aria-hidden="true"
    focusable="false"
    style={{ marginRight: 8, verticalAlign: 'middle' }}
  >
    <rect x="0" y="0" width="10" height="10" fill="#f25022" />
    <rect x="11" y="0" width="10" height="10" fill="#7fba00" />
    <rect x="0" y="11" width="10" height="10" fill="#00a4ef" />
    <rect x="11" y="11" width="10" height="10" fill="#ffb900" />
  </svg>
);
