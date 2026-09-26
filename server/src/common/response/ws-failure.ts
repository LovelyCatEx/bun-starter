import type { WsRequest } from '@shared/protocol/ws-request';
import { WsResponse } from '@shared/protocol/ws-response';

import { ApiException } from '../exception/api-exception';

/**
 * 服务端的异常 → WS 错误帧。HTTP 侧这件事由 `responseInterceptor` 做，WS 侧就在这里。
 *
 * 共享的 `WsResponse` 只认 `code` / `message`（它不该为了一个帧把整套异常体系搬进去），
 * 而"哪种异常对应哪个 code"是服务端语义，所以映射留在这边：
 *
 * - `ApiException` 家族（`BusinessException` / `*HttpException`）：它自己的 `code` / `message`
 *   直接沿用，与 HTTP 拦截器转出来的错误体一致；
 * - 其它异常一律折成 500 —— **不把内部错误的细节发给客户端**。原始异常要自己用
 *   `LogService.error` 记下来（见 `.claude/rules/backend.md` 的「WebSocket」一节）。
 */
export function wsFailure(request: WsRequest | null, error: unknown): WsResponse<null> {
  if (error instanceof ApiException) {
    return WsResponse.fail(request, error.code, error.message);
  }

  return WsResponse.fail(request, 500, 'Internal Server Error');
}
