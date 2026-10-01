/**
 * HTTP 响应的信封，两端一字不差的那份契约：服务端用它包装返回值（`responseInterceptor`），
 * 客户端用它解包（`system-requests.ts` 的 `unwrap`）。
 */

/**
 * 成功码：两端唯一的那个 `0`，服务端当默认 `code`、客户端据此判成功，谁都不许再写一遍字面量。
 */
export const CODE_OK = 0;

/**
 * `{ code, message, data }` —— 只描述线上形状；`code` 的语义在服务端 `ApiException` 家族，
 * 客户端只判"是不是 `CODE_OK`"。
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
