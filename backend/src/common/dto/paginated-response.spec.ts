import { buildPaginated } from './paginated-response.dto';

describe('buildPaginated', () => {
  it('sets hasPrev=false and hasNext=true when there are more after', () => {
    const res = buildPaginated([1, 2, 3], 10, 3, 0);
    expect(res).toEqual({
      data: [1, 2, 3],
      total: 10,
      limit: 3,
      offset: 0,
      hasNext: true,
      hasPrev: false,
    });
  });

  it('sets hasPrev=true and hasNext=false on the last page', () => {
    const res = buildPaginated([9, 10], 10, 3, 8);
    expect(res.hasNext).toBe(false);
    expect(res.hasPrev).toBe(true);
  });

  it('flags hasNext=false when result fills up to the total exactly', () => {
    const res = buildPaginated([1, 2, 3], 3, 3, 0);
    expect(res.hasNext).toBe(false);
    expect(res.hasPrev).toBe(false);
  });

  it('returns empty data with zero total', () => {
    const res = buildPaginated([], 0, 20, 0);
    expect(res.total).toBe(0);
    expect(res.hasNext).toBe(false);
    expect(res.hasPrev).toBe(false);
  });
});
