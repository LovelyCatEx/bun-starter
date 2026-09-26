export class ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;

  constructor(data: T, code = 0, message = 'ok') {
    this.code = code;
    this.message = message;
    this.data = data;
  }

  toResponse() {
    return { code: this.code, message: this.message, data: this.data };
  }
}

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
