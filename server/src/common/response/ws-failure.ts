import type { WsRequest } from '@shared/protocol/ws-request';
import { WsResponse } from '@shared/protocol/ws-response';

import { ApiException } from '../exception/api-exception';

/**
 * 服务端的异常 → WS 错误帧（HTTP 侧由 `responseInterceptor` 做）。
 * `ApiException` 的 `code` / `message` 直接沿用；其它异常一律折成 500，原始异常由调用方
 * `LogService.error` 记录（见 `.claude/rules/backend.md`「WebSocket」）。
 */
export function wsFailure(request: WsRequest | null, error: unknown): WsResponse<null> {
  if (error instanceof ApiException) {
    return WsResponse.fail(request, error.code, error.message);
  }

  return WsResponse.fail(request, 500, 'Internal Server Error');
}
