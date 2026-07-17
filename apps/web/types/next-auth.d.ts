import type { UserProfile } from '@pee/types';

declare module 'next-auth' {
  interface User extends UserProfile {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: string;
  }

  interface Session {
    user: UserProfile;
    /** Server-only: never pass these two fields into a Client Component or JSON response. */
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: string;
    user?: UserProfile;
    error?: string;
  }
}
