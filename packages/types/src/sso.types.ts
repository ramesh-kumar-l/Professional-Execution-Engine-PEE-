import { AuthTokens, UserProfile } from './auth.types';

export type SsoProvider = 'OIDC' | 'SAML';

export interface SsoStatusResponse {
  oidc: boolean;
  saml: boolean;
}

export interface SsoProvisionRequest {
  provider: SsoProvider;
  providerName: string;
  providerUserId: string;
  email: string;
  displayName: string;
}

/** `user` is the full profile (incl. `organizations`) so Auth.js's `profile()` callback
 * can build a complete session `User` without a second round-trip. */
export interface SsoProvisionResponse {
  user: UserProfile;
  tokens: AuthTokens;
}
