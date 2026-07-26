import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Card } from './entities/card.entity';
import { Deck } from './entities/deck.entity';
import {
  LearningStage,
  UserCardProgress,
} from './entities/user-card-progress.entity';
import { UserDeck } from './entities/user-deck.entity';
import { DeckEnrollmentService } from './deck-enrollment.service';
import { SCHEDULER_VERSION } from './scheduler/fsrs-scheduler.service';

describe('DeckEnrollmentService', () => {
  const now = new Date('2026-07-27T00:00:00.000Z');
  const deckId = '22222222-2222-4222-8222-222222222222';
  const userId = '11111111-1111-4111-8111-111111111111';
  const cards = [
    { id: 'card-1', deck_id: deckId, sort_order: 1 },
    { id: 'card-2', deck_id: deckId, sort_order: 2 },
  ] as Card[];

  function createHarness({
    deck = { id: deckId, is_published: true } as Deck | null,
    activeCards = cards,
  }: {
    deck?: Deck | null;
    activeCards?: Card[];
  } = {}) {
    const insert = jest.fn().mockReturnThis();
    const values = jest.fn().mockReturnThis();
    const orIgnore = jest.fn().mockReturnThis();
    const execute = jest.fn().mockResolvedValue({});
    const progressQuery = { insert, values, orIgnore, execute };
    const deckRepository = {
      findOneBy: jest.fn().mockResolvedValue(deck),
    };
    const cardRepository = {
      find: jest.fn().mockResolvedValue(activeCards),
    };
    const enrollmentRepository = {
      upsert: jest.fn().mockResolvedValue({}),
    };
    const progressRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(progressQuery),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Deck) return deckRepository;
        if (entity === Card) return cardRepository;
        if (entity === UserDeck) return enrollmentRepository;
        if (entity === UserCardProgress) return progressRepository;
        throw new Error('Unexpected repository');
      }),
    };
    const data = {
      transaction: jest.fn((callback) => callback(manager)),
    } as any;
    const today = {
      queue: [],
      totalDue: activeCards.length,
      countsByType: { grammar: activeCards.length },
      countsByDeck: { [deckId]: activeCards.length },
      caughtUp: activeCards.length === 0,
      serverTimestamp: now.toISOString(),
    };
    const learning = {
      getToday: jest.fn().mockResolvedValue(today),
    } as any;
    const service = new DeckEnrollmentService(data, learning);

    return {
      service,
      data,
      learning,
      today,
      deckRepository,
      cardRepository,
      enrollmentRepository,
      progressRepository,
      progressQuery,
    };
  }

  it('enrolls every active card as due now and returns canonical Today', async () => {
    const harness = createHarness();

    await expect(harness.service.enroll(userId, deckId, now)).resolves.toEqual({
      deckId,
      isLearning: true,
      enrolledCardCount: 2,
      today: harness.today,
    });

    expect(harness.deckRepository.findOneBy).toHaveBeenCalledWith({
      id: deckId,
      is_published: true,
    });
    expect(harness.cardRepository.find).toHaveBeenCalledWith({
      where: { deck_id: deckId, is_active: true },
      order: { sort_order: 'ASC', id: 'ASC' },
    });
    expect(harness.enrollmentRepository.upsert).toHaveBeenCalledWith(
      { user_id: userId, deck_id: deckId, is_active: true },
      {
        conflictPaths: ['user_id', 'deck_id'],
        skipUpdateIfNoValuesChanged: true,
      },
    );
    expect(harness.progressQuery.values).toHaveBeenCalledWith(
      cards.map((card) => ({
        user_id: userId,
        card_id: card.id,
        stage: LearningStage.New,
        due_at: now,
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        repetitions: 0,
        lapses: 0,
        last_reviewed_at: null,
        last_rating: null,
        scheduler_version: SCHEDULER_VERSION,
      })),
    );
    expect(harness.progressQuery.orIgnore).toHaveBeenCalledTimes(1);
    expect(harness.learning.getToday).toHaveBeenCalledWith(userId, now);
  });

  it('hides unknown and unpublished decks behind the same 404', async () => {
    const harness = createHarness({ deck: null });

    await expect(harness.service.enroll(userId, deckId, now)).rejects.toEqual(
      new NotFoundException('Deck not found'),
    );

    expect(harness.cardRepository.find).not.toHaveBeenCalled();
    expect(harness.enrollmentRepository.upsert).not.toHaveBeenCalled();
  });

  it('rejects a published deck without active cards before enrollment', async () => {
    const harness = createHarness({ activeCards: [] });

    await expect(harness.service.enroll(userId, deckId, now)).rejects.toEqual(
      new BadRequestException('Deck has no active cards'),
    );

    expect(harness.enrollmentRepository.upsert).not.toHaveBeenCalled();
    expect(
      harness.progressRepository.createQueryBuilder,
    ).not.toHaveBeenCalled();
    expect(harness.learning.getToday).not.toHaveBeenCalled();
  });
});
