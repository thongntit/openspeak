import { DataSource, EntityManager, In, UpdateResult } from 'typeorm';
import { LearningContentBundle } from '../content/learning-content.types';
import { Card } from '../../learning/entities/card.entity';
import { Deck } from '../../learning/entities/deck.entity';
import { seedLearningContent } from './learning-content.seeder';

interface QueryBuilderStub {
  update: jest.Mock;
  set: jest.Mock;
  select: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  setParameters: jest.Mock;
  getQuery: jest.Mock;
  getParameters: jest.Mock;
  execute: jest.Mock;
  delete: jest.Mock;
}

function createQueryBuilderStub(affected = 0): QueryBuilderStub {
  const queryBuilder = {
    update: jest.fn(),
    set: jest.fn(),
    select: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    setParameters: jest.fn(),
    getQuery: jest
      .fn()
      .mockReturnValue('SELECT "managedDeck"."id" FROM "decks" "managedDeck"'),
    getParameters: jest.fn().mockReturnValue({ managedVersion: 'starter@%' }),
    execute: jest.fn().mockResolvedValue({ affected } as Partial<UpdateResult>),
    delete: jest.fn(),
  } as QueryBuilderStub;

  for (const method of [
    queryBuilder.update,
    queryBuilder.set,
    queryBuilder.select,
    queryBuilder.where,
    queryBuilder.andWhere,
    queryBuilder.setParameters,
  ]) {
    method.mockReturnValue(queryBuilder);
  }

  return queryBuilder;
}

function createBundle(): LearningContentBundle {
  return {
    schemaVersion: 1,
    namespace: 'starter',
    contentVersion: '2026.07.1',
    databaseContentVersion: 'starter@2026.07.1',
    decks: [
      {
        slug: 'daily-basics',
        name: 'Daily Basics',
        description: 'Everyday vocabulary',
        type: 'vocab',
        level: 'beginner',
        sortOrder: 1,
        isPublished: true,
        cards: [
          {
            contentKey: 'hello',
            type: 'vocab',
            level: 'beginner',
            front: 'Hello',
            answer: 'Xin chao',
            explanation: 'A common greeting',
            example: 'Hello, Sam.',
            options: ['Xin chao', 'Tam biet'],
            sortOrder: 1,
          },
          {
            contentKey: 'goodbye',
            type: 'vocab',
            level: 'beginner',
            front: 'Goodbye',
            answer: 'Tam biet',
            explanation: 'A common farewell',
            example: 'Goodbye, Sam.',
            sortOrder: 2,
          },
        ],
      },
    ],
  };
}

function createPersistenceHarness(options?: {
  bundle?: LearningContentBundle;
  existingDecks?: Deck[];
  existingCards?: Card[];
  presentCardsAffected?: number;
  retiredCardsAffected?: number;
  retiredDecksAffected?: number;
}) {
  const bundle = options?.bundle ?? createBundle();
  const managedDeckQuery = createQueryBuilderStub();
  const retiredDecksUpdate = createQueryBuilderStub(
    options?.retiredDecksAffected ?? 4,
  );
  const presentCardUpdates = bundle.decks.map(() =>
    createQueryBuilderStub(options?.presentCardsAffected ?? 2),
  );
  const retiredCardsUpdate = createQueryBuilderStub(
    options?.retiredCardsAffected ?? 3,
  );

  const persistedDecks = bundle.decks.map(
    (deck, index) =>
      ({
        id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
        slug: deck.slug,
        content_version: bundle.databaseContentVersion,
      }) as Deck,
  );
  const deckUpsert = jest.fn().mockResolvedValue(undefined);
  const deckRepository = {
    upsert: deckUpsert,
    findBy: jest
      .fn()
      .mockImplementation(() =>
        deckUpsert.mock.calls.length === 0
          ? (options?.existingDecks ?? [])
          : persistedDecks,
      ),
    createQueryBuilder: jest
      .fn()
      .mockReturnValueOnce(managedDeckQuery)
      .mockReturnValueOnce(retiredDecksUpdate),
    delete: jest.fn(),
    remove: jest.fn(),
  };

  const cardRepository = {
    upsert: jest.fn().mockResolvedValue(undefined),
    findBy: jest.fn().mockResolvedValue(options?.existingCards ?? []),
    createQueryBuilder: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
  };
  let cardUpdateIndex = 0;
  cardRepository.createQueryBuilder.mockImplementation(
    () => presentCardUpdates[cardUpdateIndex++] ?? retiredCardsUpdate,
  );

  const manager = {
    getRepository: jest.fn((entity: typeof Deck | typeof Card) =>
      entity === Deck ? deckRepository : cardRepository,
    ),
  } as unknown as EntityManager;

  const transaction = jest.fn(
    async (run: (transactionManager: EntityManager) => Promise<unknown>) =>
      run(manager),
  );
  const dataSource = { transaction } as unknown as DataSource;

  return {
    bundle,
    dataSource,
    transaction,
    deckRepository,
    cardRepository,
    managedDeckQuery,
    retiredDecksUpdate,
    retiredCardsUpdate,
    presentCardUpdates,
  };
}

function queryParameters(queryBuilder: QueryBuilderStub) {
  return [queryBuilder.where, queryBuilder.andWhere, queryBuilder.setParameters]
    .flatMap((method) => method.mock.calls)
    .map((parameters) =>
      parameters.length === 1 ? parameters[0] : parameters[1],
    )
    .filter(Boolean);
}

function queryConditions(queryBuilder: QueryBuilderStub) {
  return [queryBuilder.where, queryBuilder.andWhere]
    .flatMap((method) => method.mock.calls)
    .map(([condition]) => condition as string);
}

describe('seedLearningContent', () => {
  it('upserts source content and retires only starter-managed records in one transaction', async () => {
    const harness = createPersistenceHarness();

    const summary = await seedLearningContent(
      harness.dataSource,
      harness.bundle,
    );

    expect(harness.transaction).toHaveBeenCalledTimes(1);
    expect(harness.deckRepository.upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          slug: 'daily-basics',
          name: 'Daily Basics',
          description: 'Everyday vocabulary',
          type: 'vocab',
          level: 'beginner',
          content_version: 'starter@2026.07.1',
          sort_order: 1,
          is_published: true,
        }),
      ],
      ['slug'],
    );
    expect(harness.deckRepository.findBy).toHaveBeenCalledWith({
      slug: In(['daily-basics']),
    });
    expect(harness.cardRepository.upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          deck_id: '00000000-0000-4000-8000-000000000001',
          content_key: 'hello',
          content_version: 'starter@2026.07.1',
          is_active: true,
        }),
        expect.objectContaining({
          deck_id: '00000000-0000-4000-8000-000000000001',
          content_key: 'goodbye',
          options: null,
          content_version: 'starter@2026.07.1',
          is_active: true,
        }),
      ],
      ['deck_id', 'content_key'],
    );

    for (const queryBuilder of [
      harness.managedDeckQuery,
      ...harness.presentCardUpdates,
      harness.retiredCardsUpdate,
      harness.retiredDecksUpdate,
    ]) {
      expect(queryConditions(queryBuilder)).toContainEqual(
        expect.stringContaining('content_version LIKE :managedVersion'),
      );
      expect(queryParameters(queryBuilder)).toContainEqual(
        expect.objectContaining({ managedVersion: 'starter@%' }),
      );
      expect(queryBuilder.delete).not.toHaveBeenCalled();
    }
    expect(harness.deckRepository.delete).not.toHaveBeenCalled();
    expect(harness.deckRepository.remove).not.toHaveBeenCalled();
    expect(harness.cardRepository.delete).not.toHaveBeenCalled();
    expect(harness.cardRepository.remove).not.toHaveBeenCalled();
    expect(summary).toEqual({
      contentVersion: 'starter@2026.07.1',
      decksUpserted: 1,
      cardsUpserted: 2,
      decksUnpublished: 4,
      cardsDeactivated: 5,
    });
  });

  it('rejects an incoming deck slug owned by non-starter content before upsert', async () => {
    const foreignDeck = {
      id: '10000000-0000-4000-8000-000000000001',
      slug: 'daily-basics',
      content_version: 'admin@1',
    } as Deck;
    const harness = createPersistenceHarness({
      existingDecks: [foreignDeck],
    });

    await expect(
      seedLearningContent(harness.dataSource, harness.bundle),
    ).rejects.toThrow(
      'Cannot seed starter deck "daily-basics": slug is owned by content version "admin@1"',
    );

    expect(harness.transaction).toHaveBeenCalledTimes(1);
    expect(harness.deckRepository.upsert).not.toHaveBeenCalled();
    expect(harness.cardRepository.upsert).not.toHaveBeenCalled();
    expect(harness.deckRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(harness.cardRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('rejects an incoming card key owned by non-starter content before card upsert', async () => {
    const foreignCard = {
      id: '20000000-0000-4000-8000-000000000001',
      deck_id: '00000000-0000-4000-8000-000000000001',
      content_key: 'hello',
      content_version: 'admin@1',
    } as Card;
    const harness = createPersistenceHarness({
      existingCards: [foreignCard],
    });

    await expect(
      seedLearningContent(harness.dataSource, harness.bundle),
    ).rejects.toThrow(
      'Cannot seed starter card "hello" in deck "daily-basics": key is owned by content version "admin@1"',
    );

    expect(harness.transaction).toHaveBeenCalledTimes(1);
    expect(harness.deckRepository.upsert).toHaveBeenCalledTimes(1);
    expect(harness.cardRepository.upsert).not.toHaveBeenCalled();
    expect(harness.deckRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(harness.cardRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('deactivates every managed card in a present deck when its source card list is empty', async () => {
    const bundle = createBundle();
    bundle.decks[0].cards = [];
    const harness = createPersistenceHarness({ bundle });

    const summary = await seedLearningContent(harness.dataSource, bundle);

    const presentCardUpdate = harness.presentCardUpdates[0];
    expect(queryConditions(presentCardUpdate).join(' ')).not.toContain(
      'NOT IN',
    );
    expect(harness.cardRepository.upsert).not.toHaveBeenCalled();
    expect(summary.cardsUpserted).toBe(0);
  });

  it('retires all managed decks without generating NOT IN () for an empty bundle', async () => {
    const bundle = createBundle();
    bundle.decks = [];
    const harness = createPersistenceHarness({ bundle });

    const summary = await seedLearningContent(harness.dataSource, bundle);

    expect(harness.deckRepository.upsert).not.toHaveBeenCalled();
    expect(harness.deckRepository.findBy).not.toHaveBeenCalled();
    expect(harness.cardRepository.upsert).not.toHaveBeenCalled();
    expect(queryConditions(harness.managedDeckQuery).join(' ')).not.toContain(
      'NOT IN',
    );
    expect(queryConditions(harness.retiredDecksUpdate).join(' ')).not.toContain(
      'NOT IN',
    );
    expect(summary).toEqual({
      contentVersion: 'starter@2026.07.1',
      decksUpserted: 0,
      cardsUpserted: 0,
      decksUnpublished: 4,
      cardsDeactivated: 3,
    });
  });

  it('rethrows transaction failures', async () => {
    const failure = new Error('transaction failed');
    const transaction = jest.fn().mockRejectedValue(failure);
    const dataSource = { transaction } as unknown as DataSource;

    await expect(seedLearningContent(dataSource, createBundle())).rejects.toBe(
      failure,
    );
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});
