import { LearningService } from './learning.service';

describe('LearningService', () => {
  const createQuery = (rows: unknown[] = []) => {
    const query: any = {
      innerJoinAndSelect: jest.fn(),
      innerJoin: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      addOrderBy: jest.fn(),
      getMany: jest.fn().mockResolvedValue(rows),
    };
    [
      query.innerJoinAndSelect,
      query.innerJoin,
      query.where,
      query.andWhere,
      query.orderBy,
      query.addOrderBy,
    ].forEach((value: any) => value.mockReturnThis());
    return query;
  };

  it('returns a deterministic caught-up Today response from due rows', async () => {
    const query = createQuery();
    const progress = { createQueryBuilder: jest.fn(() => query) } as any;
    const service = new LearningService(progress);
    await expect(
      service.getToday('user', new Date('2026-07-17T00:00:00Z')),
    ).resolves.toMatchObject({
      totalDue: 0,
      caughtUp: true,
      queue: [],
      countsByType: {},
      countsByDeck: {},
    });
  });

  it('serializes numeric progress fields and count values when TypeORM returns NUMERIC strings', async () => {
    const query = createQuery([
      {
        id: 'progress-1',
        stability: '2.500000',
        difficulty: '6.125000',
        card: { id: 'card-1', deck_id: 'deck-1', type: 'grammar' },
      },
      {
        id: 'progress-2',
        stability: '3.000000',
        difficulty: '5.000000',
        card: { id: 'card-2', deck_id: 'deck-1', type: 'grammar' },
      },
    ]);
    const progress = { createQueryBuilder: jest.fn(() => query) } as any;
    const service = new LearningService(progress);

    const today = await service.getToday(
      'user',
      new Date('2026-07-17T00:00:00Z'),
    );

    expect(today).toMatchObject({
      totalDue: 2,
      caughtUp: false,
      countsByType: { grammar: 2 },
      countsByDeck: { 'deck-1': 2 },
    });
    expect(typeof today.totalDue).toBe('number');
    expect(typeof today.countsByType.grammar).toBe('number');
    expect(typeof today.countsByDeck['deck-1']).toBe('number');
    expect(today.queue.map(({ progress: item }) => item)).toEqual([
      expect.objectContaining({ stability: 2.5, difficulty: 6.125 }),
      expect.objectContaining({ stability: 3, difficulty: 5 }),
    ]);
  });
});
