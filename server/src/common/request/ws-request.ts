/**
 * 一条从客户端进来的 WS 帧。
 *
 * WS 是**不可信边界**：`message` 是 Elysia 原样交到 handler 的值，可能是任何东西 ——
 * 不是 JSON 的字符串、数组、`null`、缺 `event` 的对象。所以一律从 `WsRequest.parse()`
 * 进来：它要么给出字段齐全的请求，要么给出 `null`，让调用点自己决定是回一帧错误还是断连。
 * HTTP 侧的对应物是 DTO 加控制器里的手校验（`body as Partial<LoginDto>`）。
 */
export class WsRequest<T = unknown> {
  /**
   * 应答要原样带回来的 id；客户端不关心应答（单向通知）时为 `null`。
   *
   * 有了它，一个连接上可以同时飞着多个请求，回来的帧各自对号入座 —— 没有它就只能
   * 靠"同一个 event 只有一帧在途"这种假设，一旦并发就串了。
   */
  id: string | null;

  /** 事件名：`<feature>.<action>`，如 `chat.send`。`ping` / `pong` 是协议保留的。 */
  event: string;

  /** 业务负载，形状由事件决定（见 `parse` 的泛型说明）。 */
  data: T;

  constructor(event: string, data?: T, id: string | null = null) {
    this.event = event;
    this.data = data as T;
    this.id = id;
  }

  /**
   * 原始帧 → `WsRequest`，认不出来就 `null`。
   *
   * 泛型是**调用点的承诺而不是校验**：`WsRequest.parse<ChatSendDto>(message)` 只保证
   * 外层的 `id` / `event` / `data` 三个字段存在且类型正确，`data` 内部仍然是 `unknown`，
   * 与 HTTP 控制器里 `body as Partial<LoginDto>` 同一套写法 —— 需要严格校验就自己再收一道。
   */
  static parse<T = unknown>(frame: unknown): WsRequest<T> | null {
    const payload = WsRequest.decode(frame);

    if (payload === null) {
      return null;
    }

    const { id, event, data } = payload;

    if (typeof event !== 'string' || event === '') {
      return null;
    }

    if (id !== undefined && id !== null && typeof id !== 'string') {
      return null;
    }

    return new WsRequest<T>(event, data as T, typeof id === 'string' ? id : null);
  }

  /**
   * 原始帧 → 普通对象。文本按 JSON 解，二进制按 UTF-8 解完再 JSON 解；
   * 其余（空帧、数字、数组、坏 JSON）一律 `null`。
   */
  private static decode(frame: unknown): Record<string, unknown> | null {
    let value: unknown = frame;

    if (typeof value === 'string') {
      value = WsRequest.asJson(value);
    } else if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
      value = WsRequest.asJson(new TextDecoder().decode(value));
    }

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private static asJson(text: string): unknown {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      // 坏 JSON 是客户端的问题，不是服务端该抛异常的地方：交给调用点回错误帧或断连。
      return null;
    }
  }
}
