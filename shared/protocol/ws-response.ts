import { CODE_OK } from './api-response';
import type { WsRequest } from './ws-request';

/**
 * 一条发给客户端的 WS 帧，`ApiResponse` 的 WS 版本。
 *
 * 字段与 HTTP 的 `{ code, message, data }` 一一对应，`code` 也是同一套语义（`CODE_OK`
 * 表示成功、其余是服务端异常自己的 `code`），所以同一个 service 抛的异常在两种传输下
 * 说的是同一件事。多出来的两个字段是 WS 才需要的：`id` 把应答对回请求（服务端主动推送
 * 时为 `null`），`event` 让客户端知道这帧是哪个事件的回答或推送。
 *
 * 三种帧，都不要在调用点手拼对象：
 *
 * ```ts
 * ws.send(WsResponse.ok(request, data).toFrame())          // 应答成功
 * ws.send(WsResponse.fail(request, 400, 'bad').toFrame())  // 应答失败
 * ws.send(WsResponse.push('chat.message', data).toFrame()) // 服务端主动推送
 * ```
 *
 * 这里**不认识异常**：只认 `code` / `message` 两个数字与字符串。把 `ApiException` 翻成
 * 这两个值、以及"非业务异常一律折成 500"的判断都在服务端（`common/response/ws-failure.ts`）——
 * 异常是服务端的概念，前端不该为了一个帧把整套异常体系搬进来。
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
