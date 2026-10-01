import type {
  AuthCredentials,
  AuthProvider,
  AuthUser,
} from './auth-provider';

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin';

/**
 * Fallback provider used when no AuthProvider is injected: a single hard-coded
 * admin/admin account, replaced entirely once a provider is injected.
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
