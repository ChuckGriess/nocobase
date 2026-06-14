/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useTranslation } from 'react-i18next';
import { namespace } from '../constants';

export function useOIDCTranslation() {
  return useTranslation([namespace, 'client'], { nsMode: 'fallback' });
}

export const enUS = {
  'Sign in with Microsoft': 'Sign in with Microsoft',
  'Could not retrieve the SSO login URL.': 'Could not retrieve the SSO login URL.',
  'SSO login failed. Please try again.': 'SSO login failed. Please try again.',
  'Issuer URL': 'Issuer URL',
  'OIDC discovery URL. For Microsoft Entra ID: https://login.microsoftonline.com/{tenantId}/v2.0':
    'OIDC discovery URL. For Microsoft Entra ID: https://login.microsoftonline.com/{tenantId}/v2.0',
  'Client ID': 'Client ID',
  'Client Secret': 'Client Secret',
  'App URL': 'App URL',
  'Public URL of this app, used to build the redirect URI (e.g. https://my-lms.up.railway.app)':
    'Public URL of this app, used to build the redirect URI (e.g. https://my-lms.up.railway.app)',
  Scope: 'Scope',
  'Space-separated OIDC scopes. Default: openid profile email':
    'Space-separated OIDC scopes. Default: openid profile email',
  'Username claim': 'Username claim',
  'Email claim': 'Email claim',
  'Nickname claim': 'Nickname claim',
  'Sign in button label': 'Sign in button label',
};

export const zhCN = {
  'Sign in with Microsoft': '使用 Microsoft 登录',
  'Could not retrieve the SSO login URL.': '无法获取 SSO 登录地址。',
  'SSO login failed. Please try again.': 'SSO 登录失败，请重试。',
  'Issuer URL': '颁发者 URL',
  'OIDC discovery URL. For Microsoft Entra ID: https://login.microsoftonline.com/{tenantId}/v2.0':
    'OIDC 发现地址。Microsoft Entra ID：https://login.microsoftonline.com/{tenantId}/v2.0',
  'Client ID': '客户端 ID',
  'Client Secret': '客户端密钥',
  'App URL': '应用 URL',
  'Public URL of this app, used to build the redirect URI (e.g. https://my-lms.up.railway.app)':
    '本应用的公开地址，用于构建回调 URI（例如 https://my-lms.up.railway.app）',
  Scope: '范围',
  'Space-separated OIDC scopes. Default: openid profile email': '以空格分隔的 OIDC 范围。默认：openid profile email',
  'Username claim': '用户名声明',
  'Email claim': '邮箱声明',
  'Nickname claim': '昵称声明',
  'Sign in button label': '登录按钮文字',
};
