/** 分页查询参数的形状，与 `PaginatedResponseBody` 成对。 */
export class PageQuery {
  page: number;
  pageSize: number;

  constructor(page = 1, pageSize = 10) {
    this.page = page;
    this.pageSize = pageSize;
  }
}
