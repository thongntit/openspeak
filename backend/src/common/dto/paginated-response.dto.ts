export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function buildPaginated<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number,
): PaginatedResponse<T> {
  return {
    data,
    total,
    limit,
    offset,
    hasNext: offset + data.length < total,
    hasPrev: offset > 0,
  };
}
