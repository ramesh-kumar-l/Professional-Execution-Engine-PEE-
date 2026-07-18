import NextAuth from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';
import type { SsoProvisionResponse } from '@pee/types';
import { loginRequest, provisionOidcUser, refreshRequest } from './lib/api-client';

const backendBaseUrl = process.env.INTERNAL_API_URL ?? 'http://localhost:3001';

async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return { ...token, error: 'RefreshError' };
  }

  const refreshed = await refreshRequest(token.refreshToken);
  if (!refreshed) {
    return { ...token, error: 'RefreshError' };
  }

  return {
    ...token,
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    accessTokenExpiresAt: refreshed.accessTokenExpiresAt,
    error: undefined,
  };
}

/** Shared by every login path (password, OIDC, SAML) — the session `User` shape is identical either way. */
function toSessionUser(provisioned: SsoProvisionResponse) {
  return {
    id: provisioned.user.id,
    email: provisioned.user.email,
    displayName: provisioned.user.displayName,
    role: provisioned.user.role,
    organizations: provisioned.user.organizations,
    accessToken: provisioned.tokens.accessToken,
    refreshToken: provisioned.tokens.refreshToken,
    accessTokenExpiresAt: provisioned.tokens.accessTokenExpiresAt,
  };
}

/**
 * SSO (Phase 10) is additive: both providers below only register when their env is
 * configured, matching services/auth's fail-closed posture. OIDC is Auth.js's native
 * `type: 'oidc'` — it runs the whole exchange itself; we only provision our own
 * user/tokens in `profile()`. SAML has no native Auth.js provider type, so it's a
 * generic `type: 'oauth'` provider pointed at our own SP bridge
 * (services/auth/src/sso/saml) — see adr/0009.
 */
const ssoProviders = [
  ...(process.env.SSO_OIDC_ISSUER_URL
    ? [
        {
          id: 'sso-oidc',
          name: 'Enterprise SSO',
          type: 'oidc' as const,
          issuer: process.env.SSO_OIDC_ISSUER_URL,
          clientId: process.env.SSO_OIDC_CLIENT_ID,
          clientSecret: process.env.SSO_OIDC_CLIENT_SECRET,
          profile: async (profile: Record<string, unknown>) => {
            const provisioned = await provisionOidcUser({
              providerName: 'oidc',
              providerUserId: String(profile.sub),
              email: String(profile.email),
              displayName: String(profile.name ?? profile.email),
            });
            if (!provisioned) {
              throw new Error('OIDC provisioning failed');
            }
            return toSessionUser(provisioned);
          },
        },
      ]
    : []),
  ...(process.env.SSO_SAML_ENTRY_POINT
    ? [
        {
          id: 'sso-saml',
          name: 'Enterprise SSO (SAML)',
          type: 'oauth' as const,
          clientId: process.env.SSO_SAML_CLIENT_ID ?? 'pee-web',
          clientSecret: process.env.SSO_SAML_BRIDGE_SECRET ?? '',
          authorization: { url: `${backendBaseUrl}/auth/sso/saml/authorize` },
          token: `${backendBaseUrl}/auth/sso/saml/token`,
          userinfo: `${backendBaseUrl}/auth/sso/saml/userinfo`,
          idToken: false,
          checks: ['state'] as ('state' | 'pkce' | 'none')[],
          profile: async (provisioned: SsoProvisionResponse) => toSessionUser(provisioned),
        },
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const result = await loginRequest(email, password);
        if (!result) return null;

        return toSessionUser(result);
      },
    }),
    ...ssoProviders,
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpiresAt: user.accessTokenExpiresAt,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            organizations: user.organizations,
          },
        } as JWT;
      }

      const expiresAt = token.accessTokenExpiresAt ? Date.parse(token.accessTokenExpiresAt) : 0;
      if (Date.now() < expiresAt - 60_000) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token.user) session.user = token.user as typeof session.user;
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.error = token.error;
      return session;
    },
  },
});
