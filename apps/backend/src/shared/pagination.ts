export interface PaginationQuery {
  page?: string | number;
  pageSize?: string | number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function parsePagination(query: PaginationQuery): { skip: number; take: number; page: number; pageSize: number } {
  const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(query.pageSize) || DEFAULT_PAGE_SIZE));
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}

export function buildPaginatedResponse<T>(data: T[], total: number, page: number, pageSize: number): PaginatedResponse<T> {
  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
