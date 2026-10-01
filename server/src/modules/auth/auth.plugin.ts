import { config } from '../../common/config';
import { LogService } from '../../common/service/log-service';
import { AuthController } from './controller/auth.controller';
import type { AuthProvider } from './provider/auth-provider';

/** The `AuthProvider` injection point — with none injected the built-in dev account takes over. */
export function createAuthPlugin(provider?: AuthProvider) {
  if (!provider) {
    LogService.warn(
      'auth',
      'No AuthProvider injected — the built-in admin/admin account is active. ' +
        'Pass your own provider to createAuthPlugin() before using this in production.',
    );
  }

  if (config.auth.usingDevSecret) {
    LogService.warn(
      'auth',
      'AUTH_JWT_SECRET is not set — tokens are signed with an insecure development secret.',
    );
  }

  return new AuthController(provider).routes;
}
