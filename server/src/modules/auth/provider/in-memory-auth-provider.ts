import type {
  AuthCredentials,
  AuthProvider,
  AuthUser,
} from './auth-provider';

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin';

/**
 * Fallback provider used when no AuthProvider is injected. It is intentionally
 * a single hard-coded account (admin/admin) and is never used once the
 * developer injects a provider of their own.
 */
export class InMemoryAuthProvider implements AuthProvider {
  async authenticate(credentials: AuthCredentials): Promise<AuthUser | null> {
    if (
      credentials.username !== DEFAULT_USERNAME ||
      credentials.password !== DEFAULT_PASSWORD
    ) {
      return null;
    }

    return { id: '1', username: DEFAULT_USERNAME, name: DEFAULT_USERNAME };
  }
}
