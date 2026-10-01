export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
}

/** 账号存储的唯一扩展点：实现它并传给 `createAuthPlugin`（见 auth.md）。 */
export interface AuthProvider {
  authenticate(credentials: AuthCredentials): Promise<AuthUser | null>;
}
