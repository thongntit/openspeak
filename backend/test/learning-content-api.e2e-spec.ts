import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ClerkAuthGuard } from '../src/auth/clerk-auth.guard';
import { ClerkTokenVerifier } from '../src/auth/clerk-token-verifier.service';
import { LearningContentController } from '../src/learning-content/learning-content.controller';
import { LearningContentService } from '../src/learning-content/learning-content.service';
import { UsersService } from '../src/users/users.service';

describe('learning content API (e2e)', () => {
  let app: INestApplication;
  const service = {
    findPublishedDecks: jest.fn().mockResolvedValue({ data: [] }),
    findPublishedDeckCards: jest.fn().mockResolvedValue({ data: [] }),
  };
  const verifier = {
    verify: jest.fn().mockResolvedValue({ clerkUserId: 'user_123' }),
  };
  const users = {
    resolveByClerkUserId: jest.fn().mockResolvedValue({
      id: '2f35e726-198d-4862-84df-f1c12dbe9347',
      clerk_user_id: 'user_123',
    }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [LearningContentController],
      providers: [
        { provide: LearningContentService, useValue: service },
        ClerkAuthGuard,
        { provide: ClerkTokenVerifier, useValue: verifier },
        { provide: UsersService, useValue: users },
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
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  beforeEach(() => jest.clearAllMocks());

  afterAll(async () => app.close());

  it('requires authentication for the content catalog', async () => {
    await request(app.getHttpServer())
      .get('/api/content/decks')
      .expect(401)
      .expect(({ body }) => {
        expect(body.message).toBe('Authentication required');
      });
  });

  it('passes the authenticated user and validated pagination to the deck service', async () => {
    await request(app.getHttpServer())
      .get('/api/content/decks?limit=100&offset=0')
      .set('Authorization', 'Bearer valid')
      .expect(200);
    expect(service.findPublishedDecks).toHaveBeenCalledWith(
      '2f35e726-198d-4862-84df-f1c12dbe9347',
      {
        limit: 100,
        offset: 0,
      },
    );
  });

  it('encodes a slug route and passes card pagination', async () => {
    await request(app.getHttpServer())
      .get('/api/content/decks/articles-a-an-the/cards?limit=50&offset=0')
      .set('Authorization', 'Bearer valid')
      .expect(200);
    expect(service.findPublishedDeckCards).toHaveBeenCalledWith(
      'articles-a-an-the',
      { limit: 50, offset: 0 },
    );
  });

  it('rejects invalid and unknown pagination', async () => {
    await request(app.getHttpServer())
      .get('/api/content/decks?limit=101')
      .set('Authorization', 'Bearer valid')
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/content/decks?foo=bar')
      .set('Authorization', 'Bearer valid')
      .expect(400);
  });
});
