import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';
import { Word } from '../src/words/word.entity';
import { Collection } from '../src/collections/collection.entity';
import { CollectionWord } from '../src/collections/collection-word.entity';

describe('API (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let thetaCollectionId: string;

  const seedWords = [
    {
      word: 'thanks',
      ipa: 'θæŋks',
      phonemes: ['θ', 'æ', 'ŋ', 'k', 's'],
      difficulty: 'intermediate',
      syllables: 1,
      example_sentence: 'Thanks for your help.',
    },
    {
      word: 'this',
      ipa: 'ðɪs',
      phonemes: ['ð', 'ɪ', 's'],
      difficulty: 'intermediate',
      syllables: 1,
      example_sentence: 'This is my book.',
    },
    {
      word: 'sit',
      ipa: 'sɪt',
      phonemes: ['s', 'ɪ', 't'],
      difficulty: 'beginner',
      syllables: 1,
      example_sentence: 'Please sit.',
    },
    {
      word: 'seat',
      ipa: 'siːt',
      phonemes: ['s', 'iː', 't'],
      difficulty: 'intermediate',
      syllables: 1,
      example_sentence: 'Take a seat.',
    },
    {
      word: 'cat',
      ipa: 'kæt',
      phonemes: ['k', 'æ', 't'],
      difficulty: 'beginner',
      syllables: 1,
      example_sentence: 'The cat sleeps.',
    },
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new LoggingInterceptor());
    await app.init();

    dataSource = app.get(DataSource);

    const wordRepo = dataSource.getRepository(Word);
    const colRepo = dataSource.getRepository(Collection);
    const cwRepo = dataSource.getRepository(CollectionWord);

    await cwRepo.query('TRUNCATE collection_words, collections, words CASCADE');

    const savedWords = await wordRepo.save(seedWords);
    const byWord = new Map(savedWords.map((w) => [w.word, w]));

    const theta = await colRepo.save({
      name: 'θ Test Collection',
      description: 'Test fixture',
      difficulty: 'advanced',
      tags: ['test', 'theta'],
    });
    thetaCollectionId = theta.id;
    await cwRepo.save([
      {
        collection_id: theta.id,
        word_id: byWord.get('thanks')!.id,
        position: 0,
      },
      { collection_id: theta.id, word_id: byWord.get('this')!.id, position: 1 },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/health', () => {
    it('returns ok with db up', async () => {
      const res = await request(app.getHttpServer()).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.db).toBe('up');
      expect(typeof res.body.uptime).toBe('number');
    });
  });

  describe('GET /api/words', () => {
    it('returns paginated words without filters', async () => {
      const res = await request(app.getHttpServer()).get('/api/words');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(5);
      expect(res.body.limit).toBe(20);
      expect(res.body.hasPrev).toBe(false);
      expect(res.body.hasNext).toBe(false);
      expect(res.body.data.length).toBe(5);
    });

    it('filters by phoneme contains (θ)', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/words?phoneme=θ',
      );
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.data.map((w: { word: string }) => w.word)).toEqual([
        'thanks',
      ]);
    });

    it('filters by startsWith', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/words?startsWith=s',
      );
      expect(res.status).toBe(200);
      expect(res.body.data.map((w: { word: string }) => w.word).sort()).toEqual(
        ['seat', 'sit'],
      );
    });

    it('filters by endsWith', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/words?endsWith=t',
      );
      expect(res.status).toBe(200);
      expect(res.body.data.map((w: { word: string }) => w.word).sort()).toEqual(
        ['cat', 'seat', 'sit'],
      );
    });

    it('filters by difficulty', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/words?difficulty=beginner',
      );
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
    });

    it('applies ILIKE search', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/words?search=ca',
      );
      expect(res.status).toBe(200);
      expect(res.body.data.map((w: { word: string }) => w.word)).toEqual([
        'cat',
      ]);
    });

    it('paginates with limit and offset', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/words?limit=2&offset=2',
      );
      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(2);
      expect(res.body.offset).toBe(2);
      expect(res.body.data.length).toBe(2);
      expect(res.body.hasNext).toBe(true);
      expect(res.body.hasPrev).toBe(true);
    });

    it('rejects invalid difficulty with 400', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/words?difficulty=bogus',
      );
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        statusCode: 400,
        path: '/api/words?difficulty=bogus',
      });
      expect(res.body.timestamp).toBeDefined();
    });

    it('rejects unknown query params with 400', async () => {
      const res = await request(app.getHttpServer()).get('/api/words?foo=bar');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/words/:id', () => {
    it('returns a word by valid id', async () => {
      const list = await request(app.getHttpServer()).get(
        '/api/words?search=cat',
      );
      const id = list.body.data[0].id;
      const res = await request(app.getHttpServer()).get(`/api/words/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.word).toBe('cat');
    });

    it('returns 400 on invalid uuid', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/words/not-a-uuid',
      );
      expect(res.status).toBe(400);
    });

    it('returns 404 on missing uuid', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/words/00000000-0000-0000-0000-000000000000',
      );
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/collections', () => {
    it('returns collections with word_count', async () => {
      const res = await request(app.getHttpServer()).get('/api/collections');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.data[0].word_count).toBe(2);
    });

    it('filters by tag', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/collections?tag=theta',
      );
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
    });

    it('filters by difficulty (none match returns empty)', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/collections?difficulty=beginner',
      );
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
    });
  });

  describe('GET /api/collections/:id', () => {
    it('returns collection with word_count', async () => {
      const res = await request(app.getHttpServer()).get(
        `/api/collections/${thetaCollectionId}`,
      );
      expect(res.status).toBe(200);
      expect(res.body.word_count).toBe(2);
      expect(res.body.name).toBe('θ Test Collection');
    });

    it('returns 404 on missing id', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/collections/00000000-0000-0000-0000-000000000000',
      );
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/collections/:id/words', () => {
    it('returns words ordered by position', async () => {
      const res = await request(app.getHttpServer()).get(
        `/api/collections/${thetaCollectionId}/words`,
      );
      expect(res.status).toBe(200);
      expect(res.body.data.map((w: { word: string }) => w.word)).toEqual([
        'thanks',
        'this',
      ]);
    });

    it('returns 404 on missing collection', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/collections/00000000-0000-0000-0000-000000000000/words',
      );
      expect(res.status).toBe(404);
    });
  });

  describe('Error response format', () => {
    it('includes statusCode, message, timestamp, path', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/words/00000000-0000-0000-0000-000000000000',
      );
      expect(res.body.statusCode).toBe(404);
      expect(typeof res.body.message).toBe('string');
      expect(typeof res.body.timestamp).toBe('string');
      expect(typeof res.body.path).toBe('string');
    });
  });
});
