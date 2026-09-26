import { ApiException } from '../exception/api-exception';
import type { WsRequest } from '../request/ws-request';

/**
 * 一条发给客户端的 WS 帧，`ApiResponse` 的 WS 版本。
 *
 * 字段与 HTTP 的 `{ code, message, data }` 一一对应，`code === 0` 表示成功、其余是
 * `ApiException` 家族的 `code`，所以同一个 service 抛的异常在两种传输下说的是同一件事。
 * 多出来的两个字段是 WS 才需要的：`id` 把应答对回请求（本来就是服务端主动推送时为 `null`），
 * `event` 让客户端知道这帧是哪个事件的回答或推送。
 *
 * 三种构造方式对应三种帧，不要在调用点手拼对象：
 *
 * ```ts
 * ws.send(WsResponse.ok(request, data).toFrame())      // 应答成功
 * ws.send(WsResponse.fail(request, error).toFrame())   // 应答失败
 * ws.send(WsResponse.push('chat.message', data).toFrame()) // 服务端主动推送
 * ```
 */
export class WsResponse<T = unknown> {
  /** 被应答请求的 id；推送帧为 `null`。 */
  id: string | null;

  /** 事件名，与请求同名或推送自己的名字。 */
  event: string;

  /** `0` = 成功，其余同 HTTP 侧的 `ApiException.code`。 */
  code: number;

  message: string;

  data: T;

  constructor(
    event: string,
    data: T,
    id: string | null = null,
    code = 0,
    message = 'ok',
  ) {
    this.event = event;
    this.data = data;
    this.id = id;
    this.code = code;
    this.message = message;
  }

  /** 应答成功：`event` 与 `id` 原样带回，客户端按 `id` 就能对上。 */
  static ok<T>(request: WsRequest, data: T): WsResponse<T> {
    return new WsResponse(request.event, data, request.id);
  }

  /**
   * 应答失败。`ApiException` 家族（`BusinessException` / `*HttpException`）的
   * `code` / `message` 直接沿用，与 HTTP 拦截器转出来的错误体一致；其它异常一律
   * 折成 500，**不把内部错误的细节发给客户端** —— 原始的异常由调用点用
   * `LogService.error` 记下，这才是唯一需要看到它的人。
   *
   * `request` 可以是 `null`：连帧都没解析出来时也一样要回一帧错误。
   */
  static fail(request: WsRequest | null, error: unknown): WsResponse<null> {
    const event = request?.event ?? 'error';
    const id = request?.id ?? null;

    if (error instanceof ApiException) {
      return new WsResponse<null>(event, null, id, error.code, error.message);
    }

    return new WsResponse<null>(event, null, id, 500, 'Internal Server Error');
  }

  /** 服务端主动推送：没有请求可对应，`id` 就是 `null`。 */
  static push<T>(event: string, data: T): WsResponse<T> {
    return new WsResponse(event, data);
  }

  /** 发出去的那一帧：`ws.send()` 前必调，别让 handler 手拼对象。 */
  toFrame() {
    return {
      id: this.id,
      event: this.event,
      code: this.code,
      message: this.message,
      data: this.data,
    };
  }
}
