import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  buildPaginated,
  PaginatedResponse,
} from '../common/dto/paginated-response.dto';
import { Card } from '../learning/entities/card.entity';
import { Deck, DeckType } from '../learning/entities/deck.entity';
import { UserDeck } from '../learning/entities/user-deck.entity';
import { GetContentDeckCardsQueryDto } from './dto/get-content-deck-cards-query.dto';
import { GetContentDecksQueryDto } from './dto/get-content-decks-query.dto';

export interface ContentDeck {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: DeckType;
  level: string;
  cardCount: number;
  isLearning: boolean;
}

export interface ContentCard {
  id: string;
  contentKey: string;
  type: DeckType;
  level: string;
  front: string;
  answer: string;
  explanation: string;
  example: string | null;
  options: string[] | null;
}

@Injectable()
export class LearningContentService {
  constructor(
    @InjectRepository(Deck)
    private readonly deckRepository: Repository<Deck>,
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
  ) {}

  async findPublishedDecks(
    userId: string,
    query: GetContentDecksQueryDto,
  ): Promise<PaginatedResponse<ContentDeck>> {
    const { limit, offset } = query;
    const rows = await this.deckRepository
      .createQueryBuilder('deck')
      .select([
        'deck.id AS id',
        'deck.slug AS slug',
        'deck.name AS name',
        'deck.description AS description',
        'deck.type AS type',
        'deck.level AS level',
        'COUNT(card.id)::int AS "cardCount"',
        'COALESCE(enrollment.is_active, false) AS "isLearning"',
      ])
      .leftJoin(
        UserDeck,
        'enrollment',
        'enrollment.deck_id = deck.id AND enrollment.user_id = :userId',
        { userId },
      )
      .leftJoin(
        Card,
        'card',
        'card.deck_id = deck.id AND card.is_active = :isActive',
        { isActive: true },
      )
      .where('deck.is_published = :isPublished', { isPublished: true })
      .groupBy('deck.id')
      .addGroupBy('enrollment.is_active')
      .orderBy('deck.sort_order', 'ASC')
      .addOrderBy('deck.slug', 'ASC')
      .take(limit)
      .skip(offset)
      .getRawMany<ContentDeck>();
    const total = await this.deckRepository.count({
      where: { is_published: true },
    });

    return buildPaginated(rows, total, limit, offset);
  }

  async findPublishedDeckCards(
    slug: string,
    query: GetContentDeckCardsQueryDto,
  ): Promise<PaginatedResponse<ContentCard>> {
    const deck = await this.deckRepository.findOneBy({
      slug,
      is_published: true,
    });
    if (!deck) {
      throw new NotFoundException(`Deck ${slug} not found`);
    }

    const { limit, offset } = query;
    const [cards, total] = await this.cardRepository
      .createQueryBuilder('card')
      .where('card.deck_id = :deckId', { deckId: deck.id })
      .andWhere('card.is_active = :isActive', { isActive: true })
      .orderBy('card.sort_order', 'ASC')
      .addOrderBy('card.content_key', 'ASC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return buildPaginated(
      cards.map((card) => ({
        id: card.id,
        contentKey: card.content_key,
        type: card.type,
        level: card.level,
        front: card.front,
        answer: card.answer,
        explanation: card.explanation,
        example: card.example,
        options: card.options,
      })),
      total,
      limit,
      offset,
    );
  }
}
