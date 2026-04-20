import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Word } from './word.entity';
import { WordsService } from './words.service';
import { GetWordsQueryDto } from './dto/get-words-query.dto';

type MockQB = {
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  take: jest.Mock;
  skip: jest.Mock;
  getManyAndCount: jest.Mock;
};

function makeQb(result: [Word[], number]): MockQB {
  const qb: MockQB = {
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue(result),
  };
  return qb;
}

describe('WordsService', () => {
  let service: WordsService;
  let repo: { createQueryBuilder: jest.Mock; findOneBy: jest.Mock };
  let qb: MockQB;

  beforeEach(async () => {
    qb = makeQb([[], 0]);
    repo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      findOneBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WordsService,
        { provide: getRepositoryToken(Word), useValue: repo },
      ],
    }).compile();

    service = module.get<WordsService>(WordsService);
  });

  describe('findAll', () => {
    const baseQuery = (): GetWordsQueryDto => ({ limit: 20, offset: 0 });

    it('builds no filters when query is empty', async () => {
      await service.findAll(baseQuery());
      expect(qb.andWhere).not.toHaveBeenCalled();
      expect(qb.take).toHaveBeenCalledWith(20);
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.orderBy).toHaveBeenCalledWith('w.word', 'ASC');
    });

    it('adds JSONB contains filter for phoneme', async () => {
      await service.findAll({ ...baseQuery(), phoneme: 'θ' });
      expect(qb.andWhere).toHaveBeenCalledWith(
        'w.phonemes @> :phoneme::jsonb',
        { phoneme: JSON.stringify(['θ']) },
      );
    });

    it('adds first-element filter for startsWith', async () => {
      await service.findAll({ ...baseQuery(), startsWith: 's' });
      expect(qb.andWhere).toHaveBeenCalledWith('w.phonemes->>0 = :startsWith', {
        startsWith: 's',
      });
    });

    it('adds last-element filter for endsWith', async () => {
      await service.findAll({ ...baseQuery(), endsWith: 't' });
      expect(qb.andWhere).toHaveBeenCalledWith(
        'w.phonemes->>(jsonb_array_length(w.phonemes) - 1) = :endsWith',
        { endsWith: 't' },
      );
    });

    it('adds ILIKE filter with wildcards for search', async () => {
      await service.findAll({ ...baseQuery(), search: 'cat' });
      expect(qb.andWhere).toHaveBeenCalledWith('w.word ILIKE :search', {
        search: '%cat%',
      });
    });

    it('returns paginated shape with hasNext/hasPrev', async () => {
      const rows = [{ id: '1', word: 'a' } as Word];
      qb.getManyAndCount.mockResolvedValueOnce([rows, 100]);
      const res = await service.findAll({ limit: 1, offset: 50 });
      expect(res).toEqual({
        data: rows,
        total: 100,
        limit: 1,
        offset: 50,
        hasNext: true,
        hasPrev: true,
      });
    });
  });

  describe('findOne', () => {
    it('returns the word when found', async () => {
      const word = { id: 'abc', word: 'cat' } as Word;
      repo.findOneBy.mockResolvedValueOnce(word);
      await expect(service.findOne('abc')).resolves.toBe(word);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 'abc' });
    });

    it('throws NotFoundException when missing', async () => {
      repo.findOneBy.mockResolvedValueOnce(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
