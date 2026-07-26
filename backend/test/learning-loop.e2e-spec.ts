import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ClerkAuthGuard } from '../src/auth/clerk-auth.guard';
import { ClerkTokenVerifier } from '../src/auth/clerk-token-verifier.service';
import { LearningController } from '../src/learning/learning.controller';
import { LearningService } from '../src/learning/learning.service';
import { ReviewsController } from '../src/reviews/reviews.controller';
import { ReviewsService } from '../src/reviews/reviews.service';
import { UsersService } from '../src/users/users.service';
import { DeckEnrollmentController } from '../src/learning/deck-enrollment.controller';
import { DeckEnrollmentService } from '../src/learning/deck-enrollment.service';

const USER_ID = '2f35e726-198d-4862-84df-f1c12dbe9347';
const DECK_ID = '9bb9dfab-3572-44c0-a6cf-bd49edc30563';
const CARD_ID = 'be7d7592-2e3d-4a41-8cf5-20f1ea90f4fd';
const REQUEST_ID = 'a9ba9e4d-f965-48f6-8a66-1d6279e038d0';
const REVIEWED_AT = '2026-07-17T06:00:00.000Z';

const today = {
  queue: [
    {
      card: { id: CARD_ID, type: 'grammar', deckId: 'deck-1' },
      progress: { dueAt: '2026-07-17T00:00:00.000Z', stage: 'new' },
    },
  ],
  totalDue: 1,
  countsByType: { grammar: 1 },
  countsByDeck: { 'deck-1': 1 },
  caughtUp: false,
  serverTimestamp: '2026-07-17T06:00:00.000Z',
};

describe('learning loop HTTP contract (e2e)', () => {
  let app: INestApplication;
  const verifier = {
    verify: jest.fn().mockResolvedValue({ clerkUserId: 'user_123' }),
  };
  const users = {
    resolveByClerkUserId: jest.fn().mockResolvedValue({
      id: USER_ID,
      clerk_user_id: 'user_123',
    }),
  };
  const learning = { getToday: jest.fn().mockResolvedValue(today) };
  const enrollment = {
    enroll: jest.fn().mockResolvedValue({
      deckId: DECK_ID,
      isLearning: true,
      enrolledCardCount: 20,
      today,
    }),
  };
  const reviews = {
    submit: jest.fn().mockResolvedValue({
      reviewEventId: 'd8b103d5-c0a1-47a0-a61e-2f5a8a288bf4',
      cardId: CARD_ID,
      duplicate: false,
      previousDueAt: '2026-07-17T00:00:00.000Z',
      nextDueAt: '2026-07-18T06:00:00.000Z',
      schedulerVersion: 'fsrs-v1',
      progress: {
        cardId: CARD_ID,
        stage: 'review',
        stability: 2.5,
        difficulty: 5,
        dueAt: '2026-07-18T06:00:00.000Z',
        lastReviewedAt: REVIEWED_AT,
        reviewCount: 1,
        lapseCount: 0,
        schedulerVersion: 'fsrs-v1',
        elapsedDays: 0,
        scheduledDays: 1,
        repetitions: 1,
        lapses: 0,
        lastRating: 'good',
      },
      today,
    }),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        LearningController,
        ReviewsController,
        DeckEnrollmentController,
      ],
      providers: [
        ClerkAuthGuard,
        { provide: ClerkTokenVerifier, useValue: verifier },
        { provide: UsersService, useValue: users },
        { provide: LearningService, useValue: learning },
        { provide: DeckEnrollmentService, useValue: enrollment },
        { provide: ReviewsService, useValue: reviews },
        { provide: APP_GUARD, useExisting: ClerkAuthGuard },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    verifier.verify.mockResolvedValue({ clerkUserId: 'user_123' });
    users.resolveByClerkUserId.mockResolvedValue({
      id: USER_ID,
      clerk_user_id: 'user_123',
    });
    learning.getToday.mockResolvedValue(today);
    enrollment.enroll.mockResolvedValue({
      deckId: DECK_ID,
      isLearning: true,
      enrolledCardCount: 20,
      today,
    });
    reviews.submit.mockResolvedValue({
      reviewEventId: 'd8b103d5-c0a1-47a0-a61e-2f5a8a288bf4',
      cardId: CARD_ID,
      duplicate: false,
      previousDueAt: '2026-07-17T00:00:00.000Z',
      nextDueAt: '2026-07-18T06:00:00.000Z',
      schedulerVersion: 'fsrs-v1',
      progress: {
        cardId: CARD_ID,
        stage: 'review',
        stability: 2.5,
        difficulty: 5,
        dueAt: '2026-07-18T06:00:00.000Z',
        lastReviewedAt: REVIEWED_AT,
        reviewCount: 1,
        lapseCount: 0,
        schedulerVersion: 'fsrs-v1',
        elapsedDays: 0,
        scheduledDays: 1,
        repetitions: 1,
        lapses: 0,
        lastRating: 'good',
      },
      today,
    });
  });

  afterAll(async () => app.close());

  const authenticated = () => ({ Authorization: 'Bearer valid-token' });

  it.each([
    ['get', '/api/today'],
    ['post', '/api/reviews'],
    ['post', `/api/decks/${DECK_ID}/enroll`],
  ])('returns 401 for unauthenticated %s %s', async (method, path) => {
    const response = await request(app.getHttpServer())[method](path);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
  });

  it('passes the authenticated identity to Today and returns its API contract', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/today')
      .set(authenticated());

    expect(response.status).toBe(200);
    expect(learning.getToday).toHaveBeenCalledWith(USER_ID);
    expect(response.body).toEqual(today);
    expect(response.body).toMatchObject({
      totalDue: expect.any(Number),
      countsByType: expect.any(Object),
      countsByDeck: expect.any(Object),
      caughtUp: expect.any(Boolean),
      serverTimestamp: expect.any(String),
      queue: expect.any(Array),
    });
  });

  it.each([
    ['cardId', 'not-a-uuid'],
    ['clientRequestId', 'not-a-uuid'],
    ['rating', 'excellent'],
    ['clientReviewedAt', 'not-a-date'],
  ])('rejects invalid review %s with ValidationPipe', async (field, value) => {
    const response = await request(app.getHttpServer())
      .post('/api/reviews')
      .set(authenticated())
      .send({
        cardId: CARD_ID,
        clientRequestId: REQUEST_ID,
        rating: 'good',
        clientReviewedAt: REVIEWED_AT,
        [field]: value,
      });

    expect(response.status).toBe(400);
    expect(reviews.submit).not.toHaveBeenCalled();
  });

  it('passes an authenticated valid review to the service and returns its contract', async () => {
    const payload = {
      cardId: CARD_ID,
      clientRequestId: REQUEST_ID,
      rating: 'good',
      clientReviewedAt: REVIEWED_AT,
    };
    const response = await request(app.getHttpServer())
      .post('/api/reviews')
      .set(authenticated())
      .send(payload);

    expect(response.status).toBe(201);
    expect(reviews.submit).toHaveBeenCalledWith(USER_ID, payload);
    expect(response.body).toMatchObject({
      reviewEventId: expect.any(String),
      cardId: CARD_ID,
      duplicate: false,
      previousDueAt: expect.any(String),
      nextDueAt: expect.any(String),
      schedulerVersion: expect.any(String),
      progress: {
        cardId: CARD_ID,
        stage: 'review',
        dueAt: expect.any(String),
        reviewCount: 1,
        lapseCount: 0,
      },
      today: {
        totalDue: expect.any(Number),
        caughtUp: expect.any(Boolean),
      },
    });
  });

  it('validates and enrolls a deck for the authenticated user', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/decks/${DECK_ID}/enroll`)
      .set(authenticated());

    expect(response.status).toBe(200);
    expect(enrollment.enroll).toHaveBeenCalledWith(USER_ID, DECK_ID);
    expect(response.body).toMatchObject({
      deckId: DECK_ID,
      isLearning: true,
      enrolledCardCount: 20,
      today: {
        totalDue: expect.any(Number),
        caughtUp: expect.any(Boolean),
      },
    });
  });

  it('rejects a malformed deck id before enrollment', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/decks/not-a-uuid/enroll')
      .set(authenticated());

    expect(response.status).toBe(400);
    expect(enrollment.enroll).not.toHaveBeenCalled();
  });

  it('preserves a duplicate replay response from the review boundary', async () => {
    reviews.submit.mockResolvedValueOnce({
      reviewEventId: 'd8b103d5-c0a1-47a0-a61e-2f5a8a288bf4',
      cardId: CARD_ID,
      duplicate: true,
      previousDueAt: '2026-07-17T00:00:00.000Z',
      nextDueAt: '2026-07-18T06:00:00.000Z',
      schedulerVersion: 'fsrs-v1',
      progress: { cardId: CARD_ID, stage: 'review' },
      today,
    });

    const response = await request(app.getHttpServer())
      .post('/api/reviews')
      .set(authenticated())
      .send({
        cardId: CARD_ID,
        clientRequestId: REQUEST_ID,
        rating: 'good',
      });

    expect(response.status).toBe(201);
    expect(response.body.duplicate).toBe(true);
  });
});
