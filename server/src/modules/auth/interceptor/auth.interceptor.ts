import { Elysia } from 'elysia';

import { UnauthorizedException } from '../../../common/exception/http-exceptions';
import type { AuthUser } from '../provider/auth-provider';
import { AuthService } from '../service/auth.service';

export const AUTH_COOKIE_NAME = 'auth_token';

/** Reachable without credentials; they either are public or handle auth themselves. */
const PUBLIC_PATHS = new Set(['/health', '/api/auth/login', '/api/auth/logout']);

const authService = new AuthService();

function isPublic(path: string): boolean {
  // Only guard API routes — everything else (errors, future static assets) stays open.
  return !path.startsWith('/api/') || PUBLIC_PATHS.has(path);
}

/** Accept either transport: the httpOnly cookie, or `Authorization: Bearer <token>`. */
function pickToken(
  cookieValue: unknown,
  authorization: string | null,
  queryToken: unknown,
  upgrade: boolean,
): string | undefined {
  if (typeof cookieValue === 'string' && cookieValue) {
    return cookieValue;
  }

  const [scheme, value] = authorization?.split(' ') ?? [];

  if (scheme?.toLowerCase() === 'bearer' && value) {
    return value;
  }

  // 浏览器没法给 WebSocket 带自定义头，所以升级请求额外允许 `?token=`。
  // 只对升级请求开口：普通请求拼 token 到 URL 会漏进访问日志和 Referer。
  if (upgrade && typeof queryToken === 'string' && queryToken) {
    return queryToken;
  }

  return undefined;
}

/**
 * WebSocket 升级请求。它走的是和 HTTP 一样的鉴权，但拿不到自定义头，见 `pickToken`。
 */
function isUpgrade(request: Request): boolean {
  return request.headers.get('upgrade')?.toLowerCase() === 'websocket';
}

export const authInterceptor = new Elysia({ name: 'auth-interceptor' })
  .derive({ as: 'global' }, async ({ request, cookie, path, query }) => {
    if (isPublic(path)) {
      return { auth: null as AuthUser | null };
    }

    const token = pickToken(
      cookie[AUTH_COOKIE_NAME]?.value,
      request.headers.get('authorization'),
      query.token,
      isUpgrade(request),
    );

    return { auth: token ? await authService.verifyToken(token) : null };
  })
  .onBeforeHandle({ as: 'global' }, ({ path, auth }) => {
    if (isPublic(path)) {
      return;
    }

    if (!auth) {
      throw new UnauthorizedException('authentication required');
    }
  });
