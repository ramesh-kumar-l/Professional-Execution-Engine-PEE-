export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface UserOrganizationSummary {
  id: string;
  name: string;
  isPersonal: boolean;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: 'USER';
  organizations: UserOrganizationSummary[];
}

export interface AuthSession {
  user: UserProfile;
  tokens: AuthTokens;
}
