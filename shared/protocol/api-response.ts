/**
 * HTTP 响应的信封，两端一字不差的那份契约。
 *
 * 服务端用它包装返回值（`responseInterceptor`），客户端用它解包（`system-requests.ts` 的
 * `unwrap`）—— 以前这是两份手抄的形状，现在只有这一份。
 */

/**
 * 成功码。两端唯一的那个"0"：服务端拿它当默认 `code`，客户端拿它判成功，
 * 谁都不许再写一遍字面量 —— 写错一边就是一个"永远解不开包"的响应。
 */
export const CODE_OK = 0;

/**
 * 契约里最终的响应体形状：`{ code, message, data }`。
 *
 * 这里只描述**线上形状**，`code` 的语义由服务端的 `ApiException` 家族负责
 * （`0` 成功、`1` 业务错、`4xx/5xx` 对应 HTTP 状态），客户端只做"是不是 0"的判断。
 */
export class ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;

  constructor(data: T, code = CODE_OK, message = 'ok') {
    this.code = code;
    this.message = message;
    this.data = data;
  }

  /** 发出去的那一份（服务端 `responseInterceptor` 用） */
  toResponse() {
    return { code: this.code, message: this.message, data: this.data };
  }
}

/** 分页结果的形状，与 `PageQuery` 成对。 */
export class PaginatedResponseBody<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;

  constructor(items: T[], total: number, page = 1, pageSize = 10) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
  }

  get totalPages() {
    return this.pageSize > 0 ? Math.ceil(this.total / this.pageSize) : 0;
  }
}
