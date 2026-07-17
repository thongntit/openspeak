import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Card } from '../learning/entities/card.entity';
import { Deck, DeckType } from '../learning/entities/deck.entity';
import { LearningContentService } from './learning-content.service';

type DeckQuery = {
  select: jest.Mock;
  leftJoin: jest.Mock;
  where: jest.Mock;
  groupBy: jest.Mock;
  orderBy: jest.Mock;
  addOrderBy: jest.Mock;
  take: jest.Mock;
  skip: jest.Mock;
  getRawMany: jest.Mock;
};

type CardQuery = {
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  addOrderBy: jest.Mock;
  take: jest.Mock;
  skip: jest.Mock;
  getManyAndCount: jest.Mock;
};

function makeDeckQuery(): DeckQuery {
  return {
    select: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
  };
}

function makeCardQuery(): CardQuery {
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };
}

describe('LearningContentService', () => {
  let service: LearningContentService;
  let deckRepository: {
    createQueryBuilder: jest.Mock;
    count: jest.Mock;
    findOneBy: jest.Mock;
  };
  let cardRepository: { createQueryBuilder: jest.Mock };
  let deckQuery: DeckQuery;
  let cardQuery: CardQuery;

  beforeEach(async () => {
    deckQuery = makeDeckQuery();
    cardQuery = makeCardQuery();
    deckRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(deckQuery),
      count: jest.fn().mockResolvedValue(0),
      findOneBy: jest.fn(),
    };
    cardRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(cardQuery),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningContentService,
        { provide: getRepositoryToken(Deck), useValue: deckRepository },
        { provide: getRepositoryToken(Card), useValue: cardRepository },
      ],
    }).compile();

    service = module.get<LearningContentService>(LearningContentService);
  });

  it('returns only published decks with active-card counts in public shape', async () => {
    deckQuery.getRawMany.mockResolvedValue([
      {
        id: 'deck-1',
        slug: 'articles-a-an-the',
        name: 'Articles: a, an, and the',
        description: 'Choose English articles naturally.',
        type: DeckType.Grammar,
        level: 'beginner',
        cardCount: 20,
      },
    ]);
    deckRepository.count.mockResolvedValue(1);

    await expect(
      service.findPublishedDecks({ limit: 20, offset: 0 }),
    ).resolves.toEqual({
      data: [
        {
          id: 'deck-1',
          slug: 'articles-a-an-the',
          name: 'Articles: a, an, and the',
          description: 'Choose English articles naturally.',
          type: DeckType.Grammar,
          level: 'beginner',
          cardCount: 20,
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
      hasNext: false,
      hasPrev: false,
    });
    expect(deckQuery.leftJoin).toHaveBeenCalledWith(
      Card,
      'card',
      'card.deck_id = deck.id AND card.is_active = :isActive',
      { isActive: true },
    );
    expect(deckQuery.where).toHaveBeenCalledWith(
      'deck.is_published = :isPublished',
      { isPublished: true },
    );
    expect(deckQuery.orderBy).toHaveBeenCalledWith('deck.sort_order', 'ASC');
    expect(deckQuery.addOrderBy).toHaveBeenCalledWith('deck.slug', 'ASC');
  });

  it('reports a next page when more published decks remain', async () => {
    deckRepository.count.mockResolvedValue(101);

    await expect(
      service.findPublishedDecks({ limit: 100, offset: 0 }),
    ).resolves.toMatchObject({
      total: 101,
      limit: 100,
      offset: 0,
      hasNext: true,
      hasPrev: false,
    });
  });

  it('returns active cards in deterministic public shape', async () => {
    deckRepository.findOneBy.mockResolvedValue({
      id: 'deck-1',
      slug: 'articles-a-an-the',
      is_published: true,
    } as Deck);
    cardQuery.getManyAndCount.mockResolvedValue([
      [
        {
          id: 'card-1',
          content_key: 'articles-001',
          type: DeckType.Grammar,
          level: 'beginner',
          front: 'She is ___ honest person.',
          answer: 'an',
          explanation: 'Use an before a vowel sound.',
          example: null,
          options: ['a', 'an', 'the'],
        } as Card,
      ],
      1,
    ]);

    const result = await service.findPublishedDeckCards('articles-a-an-the', {
      limit: 50,
      offset: 0,
    });

    expect(result.data[0]).toEqual({
      id: 'card-1',
      contentKey: 'articles-001',
      type: DeckType.Grammar,
      level: 'beginner',
      front: 'She is ___ honest person.',
      answer: 'an',
      explanation: 'Use an before a vowel sound.',
      example: null,
      options: ['a', 'an', 'the'],
    });
    expect(cardQuery.andWhere).toHaveBeenCalledWith(
      'card.is_active = :isActive',
      { isActive: true },
    );
    expect(cardQuery.orderBy).toHaveBeenCalledWith('card.sort_order', 'ASC');
    expect(cardQuery.addOrderBy).toHaveBeenCalledWith(
      'card.content_key',
      'ASC',
    );
  });

  it('hides unknown and unpublished decks behind the same 404', async () => {
    deckRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.findPublishedDeckCards('hidden-deck', { limit: 50, offset: 0 }),
    ).rejects.toEqual(new NotFoundException('Deck hidden-deck not found'));
  });
});
