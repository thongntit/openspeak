import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import {
  LearningStage,
  ReviewRating,
} from '../learning/entities/user-card-progress.entity';
import { FsrsSchedulerService } from '../learning/scheduler/fsrs-scheduler.service';
import { ReviewsService } from './reviews.service';

const USER = '11111111-1111-4111-8111-111111111111';
const CARD = '22222222-2222-4222-8222-222222222222';
const REQUEST = '33333333-3333-4333-8333-333333333333';
const dto = {
  cardId: CARD,
  clientRequestId: REQUEST,
  rating: ReviewRating.Good,
};

function progress() {
  return {
    user_id: USER,
    card_id: CARD,
    stage: LearningStage.New,
    due_at: new Date('2026-07-16T00:00:00Z'),
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    repetitions: 0,
    lapses: 0,
    last_reviewed_at: null,
    last_rating: null,
    scheduler_version: 'fsrs-v1',
  };
}

describe('ReviewsService', () => {
  let eventRows: any[];
  let saveProgress: jest.Mock;
  let events: any;
  let data: any;
  let today: any;
  let service: ReviewsService;
  let queries: any[];
  beforeEach(() => {
    eventRows = [];
    saveProgress = jest.fn();
    today = { getToday: jest.fn().mockResolvedValue({ totalDue: 0 }) };
    queries = [];
    const createQuery = () => {
      const query: any = {
        setLock: jest.fn(),
        innerJoinAndSelect: jest.fn(),
        innerJoin: jest.fn(),
        where: jest.fn(),
        andWhere: jest.fn(),
        getOne: jest.fn().mockResolvedValue(progress()),
      };
      [
        query.setLock,
        query.innerJoinAndSelect,
        query.innerJoin,
        query.where,
        query.andWhere,
      ].forEach((fn: jest.Mock) => fn.mockReturnThis());
      queries.push(query);
      return query;
    };
    events = {
      findOneBy: jest
        .fn()
        .mockImplementation(({ client_request_id }: any) =>
          Promise.resolve(
            eventRows.find((e) => e.client_request_id === client_request_id) ??
              null,
          ),
        ),
      create: jest.fn((value) => ({ ...value, id: 'event-1' })),
      save: jest.fn((event) => {
        eventRows.push(event);
        return Promise.resolve(event);
      }),
    };
    const manager = {
      getRepository: jest.fn((entity) =>
        entity.name === 'ReviewEvent'
          ? events
          : { createQueryBuilder: jest.fn(createQuery) },
      ),
      save: saveProgress,
    };
    data = { transaction: jest.fn((work) => work(manager)) };
    data.getRepository = jest.fn(() => events);
    service = new ReviewsService(data, new FsrsSchedulerService(), today);
  });
  it('writes one event and one progress transition for an accepted review', async () => {
    const result = await service.submit(USER, dto);
    expect(events.save).toHaveBeenCalledTimes(1);
    expect(saveProgress).toHaveBeenCalledTimes(1);
    expect(data.transaction).toHaveBeenCalledTimes(1);
    expect(today.getToday).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject(
      expect.objectContaining({
        reviewEventId: 'event-1',
        duplicate: false,
        cardId: CARD,
        schedulerVersion: 'fsrs-v1',
        progress: expect.objectContaining({
          cardId: CARD,
          stage: LearningStage.Review,
          stability: 2,
          difficulty: 1,
          dueAt: expect.any(String),
          lastReviewedAt: expect.any(String),
          reviewCount: 1,
          lapseCount: 0,
          schedulerVersion: 'fsrs-v1',
          elapsedDays: 1,
          scheduledDays: 1,
          repetitions: 1,
          lapses: 0,
          lastRating: ReviewRating.Good,
        }),
      }),
    );
    expect(events.save.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        state_before: {
          stage: LearningStage.New,
          dueAt: '2026-07-16T00:00:00.000Z',
          stability: 0,
          difficulty: 0,
          elapsedDays: 0,
          scheduledDays: 0,
          repetitions: 0,
          lapses: 0,
          lastReviewedAt: null,
          lastRating: null,
          schedulerVersion: 'fsrs-v1',
        },
        state_after: expect.objectContaining({
          stage: LearningStage.Review,
          dueAt: expect.any(String),
          stability: 2,
          difficulty: 1,
          elapsedDays: 1,
          scheduledDays: 1,
          repetitions: 1,
          lapses: 0,
          lastReviewedAt: expect.any(String),
          lastRating: ReviewRating.Good,
          schedulerVersion: 'fsrs-v1',
        }),
      }),
    );
  });
  it('uses scoped published-deck validation before locking progress', async () => {
    await service.submit(USER, dto);
    expect(queries).toHaveLength(2);
    expect(queries[0].innerJoinAndSelect).toHaveBeenCalledWith(
      'progress.card',
      'card',
    );
    expect(queries[0].innerJoin).toHaveBeenCalledWith('card.deck', 'deck');
    expect(queries[0].andWhere).toHaveBeenCalledWith(
      'enrollment.is_active = true AND card.is_active = true AND deck.is_published = true',
    );
    expect(queries[1].setLock).toHaveBeenCalledWith(
      'pessimistic_write',
      undefined,
      ['progress'],
    );
  });
  it('replays a duplicate request without another insert or progress mutation', async () => {
    await service.submit(USER, dto);
    const result = await service.submit(USER, dto);
    expect(events.save).toHaveBeenCalledTimes(1);
    expect(saveProgress).toHaveBeenCalledTimes(1);
    expect(result.reviewEventId).toBe('event-1');
    expect(result.progress).toEqual(
      expect.objectContaining({ cardId: CARD, reviewCount: 1 }),
    );
  });
  it('returns a pre-lock exact duplicate without locking, scheduling, or writing', async () => {
    const scheduler = jest.spyOn(FsrsSchedulerService.prototype, 'schedule');
    eventRows.push({
      id: 'event-1',
      user_id: USER,
      card_id: CARD,
      client_request_id: REQUEST,
      rating: dto.rating,
      client_reviewed_at: null,
      scheduler_version: 'fsrs-v1',
      state_before: { dueAt: '2026-07-16T00:00:00.000Z' },
      state_after: { dueAt: '2026-07-17T00:00:00.000Z' },
    });
    const result = await service.submit(USER, dto);
    expect(result.duplicate).toBe(true);
    expect(queries).toHaveLength(1);
    expect(queries[0].setLock).not.toHaveBeenCalled();
    expect(scheduler).not.toHaveBeenCalled();
    expect(events.save).not.toHaveBeenCalled();
    expect(saveProgress).not.toHaveBeenCalled();
    scheduler.mockRestore();
  });
  it('rejects a pre-lock replay whose payload differs', async () => {
    eventRows.push({
      user_id: USER,
      card_id: CARD,
      client_request_id: REQUEST,
      rating: ReviewRating.Again,
      client_reviewed_at: null,
    });
    await expect(service.submit(USER, dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(queries).toHaveLength(1);
    expect(events.save).not.toHaveBeenCalled();
  });
  it('rechecks idempotency after the progress lock', async () => {
    const replay = {
      id: 'event-locked',
      user_id: USER,
      card_id: CARD,
      client_request_id: REQUEST,
      rating: dto.rating,
      client_reviewed_at: null,
      scheduler_version: 'fsrs-v1',
      state_before: { dueAt: '2026-07-16T00:00:00.000Z' },
      state_after: { dueAt: '2026-07-17T00:00:00.000Z' },
    };
    events.findOneBy.mockResolvedValueOnce(null).mockResolvedValueOnce(replay);
    const result = await service.submit(USER, dto);
    expect(result).toMatchObject({
      reviewEventId: 'event-locked',
      duplicate: true,
    });
    expect(events.findOneBy).toHaveBeenCalledTimes(2);
    expect(queries).toHaveLength(2);
    expect(events.save).not.toHaveBeenCalled();
    expect(saveProgress).not.toHaveBeenCalled();
  });
  it('replays an exact duplicate after a PostgreSQL unique violation', async () => {
    const replay = {
      id: 'event-reread',
      user_id: USER,
      card_id: CARD,
      client_request_id: REQUEST,
      rating: dto.rating,
      client_reviewed_at: null,
      scheduler_version: 'fsrs-v1',
      state_before: { dueAt: '2026-07-16T00:00:00.000Z' },
      state_after: { dueAt: '2026-07-17T00:00:00.000Z' },
    };
    events.save.mockRejectedValueOnce(
      new QueryFailedError('INSERT INTO review_events', [], { code: '23505' }),
    );
    data.getRepository.mockReturnValue({
      findOneBy: jest.fn().mockResolvedValue(replay),
    });
    const result = await service.submit(USER, dto);
    expect(result).toMatchObject({
      reviewEventId: 'event-reread',
      duplicate: true,
    });
    expect(data.getRepository).toHaveBeenCalled();
    expect(saveProgress).not.toHaveBeenCalled();
  });
  it('rejects a mismatched payload after a PostgreSQL unique violation', async () => {
    events.save.mockRejectedValueOnce(
      new QueryFailedError('INSERT INTO review_events', [], { code: '23505' }),
    );
    data.getRepository.mockReturnValue({
      findOneBy: jest.fn().mockResolvedValue({
        card_id: 'different-card',
        rating: dto.rating,
        client_reviewed_at: null,
      }),
    });
    await expect(service.submit(USER, dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
  it('rejects an inaccessible card without writes', async () => {
    const manager = {
      getRepository: jest.fn((entity) =>
        entity.name === 'ReviewEvent'
          ? events
          : {
              createQueryBuilder: jest.fn(() => ({
                setLock: jest.fn().mockReturnThis(),
                innerJoinAndSelect: jest.fn().mockReturnThis(),
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue(null),
              })),
            },
      ),
    };
    data.transaction.mockImplementation((work: any) => work(manager));
    await expect(service.submit(USER, dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(events.save).not.toHaveBeenCalled();
  });
  it('rejects client timestamps outside seven days before a transaction starts', async () => {
    await expect(
      service.submit(USER, {
        ...dto,
        clientReviewedAt: '2000-01-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(data.transaction).not.toHaveBeenCalled();
  });
  it('logs metadata without card answers or state snapshots', async () => {
    const spy = jest.spyOn(Logger.prototype, 'log');
    await service.submit(USER, dto);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER,
        cardId: CARD,
        requestId: REQUEST,
        outcome: 'accepted',
      }),
    );
    expect(JSON.stringify(spy.mock.calls)).not.toContain('state_before');
    spy.mockRestore();
  });
});
