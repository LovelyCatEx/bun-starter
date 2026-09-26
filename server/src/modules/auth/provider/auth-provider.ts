export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
}

/**
 * The single seam for plugging in your own account storage (database, LDAP,
 * third-party API, ...). Implement it and pass it to `createAuthPlugin`.
 */
export interface AuthProvider {
  authenticate(credentials: AuthCredentials): Promise<AuthUser | null>;
}
