import { Elysia } from 'elysia';

import { LoginDto } from '@shared/auth/dto/login.dto';
import { AuthUserVo } from '@shared/auth/vo/auth-user.vo';
import { LoginVo } from '@shared/auth/vo/login.vo';

import { config } from '../../../common/config';
import { BadRequestException } from '../../../common/exception/http-exceptions';
import {
  AUTH_COOKIE_NAME,
  authInterceptor,
} from '../interceptor/auth.interceptor';
import type { AuthProvider, AuthUser } from '../provider/auth-provider';
import { AuthService } from '../service/auth.service';

export class AuthController {
  private readonly service: AuthService;

  constructor(provider?: AuthProvider) {
    this.service = new AuthService(provider);
  }

  get routes() {
    // `.use(authInterceptor)` only widens the context type here — the interceptor
    // itself is registered globally in main.ts.
    return new Elysia({ prefix: '/api/auth' })
      .use(authInterceptor)
      .post('/login', async ({ body, cookie }) => {
        const credentials = body as Partial<LoginDto> | undefined;

        if (!credentials?.username || !credentials.password) {
          throw new BadRequestException('username and password are required');
        }

        const result = await this.service.login({
          username: credentials.username,
          password: credentials.password,
        });

        cookie[AUTH_COOKIE_NAME]?.set({
          value: result.token,
          httpOnly: true,
          sameSite: 'lax',
          secure: config.auth.cookieSecure,
          path: '/',
          maxAge: config.auth.tokenTtl,
        });

        return new LoginVo(
          result.token,
          new AuthUserVo(result.user.id, result.user.username, result.user.name),
        );
      })
      .post('/logout', ({ cookie }) => {
        cookie[AUTH_COOKIE_NAME]?.remove();

        return null;
      })
      .get('/me', ({ auth }) => {
        // authInterceptor already rejected the request when this is null.
        const user = auth as AuthUser;

        return new AuthUserVo(user.id, user.username, user.name);
      });
  }
}
