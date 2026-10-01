import { CODE_OK } from './api-response';
import type { WsRequest } from './ws-request';

/**
 * 一条发给客户端的 WS 帧，`ApiResponse` 的 WS 版本：`code` / `message` 与 HTTP 同一套语义。
 * `id` 把应答对回请求（推送帧为 `null`），`event` 标明这帧属于哪个事件。
 * 这里不认识异常，把 `ApiException` 翻成 `code` / `message` 是服务端的事（见 `common/response/ws-failure.ts`）。
 */
export class WsResponse<T = unknown> {
  /** 被应答请求的 id；推送帧为 `null`。 */
  id: string | null;

  /** 事件名，与请求同名或推送自己的名字。 */
  event: string;

  /** `CODE_OK` = 成功，其余同 HTTP 侧的异常 `code`。 */
  code: number;

  message: string;

  data: T;

  constructor(
    event: string,
    data: T,
    id: string | null = null,
    code = CODE_OK,
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

  /** 应答失败。`request` 可以是 `null`：连帧都没解析出来时也一样要回一帧错误。 */
  static fail(request: WsRequest | null, code: number, message: string): WsResponse<null> {
    return new WsResponse<null>(request?.event ?? 'error', null, request?.id ?? null, code, message);
  }

  /** 服务端主动推送：没有请求可对应，`id` 就是 `null`。 */
  static push<T>(event: string, data: T): WsResponse<T> {
    return new WsResponse(event, data);
  }

  /** 发出去的那一帧：`ws.send()` 收的就是这个形状。 */
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
