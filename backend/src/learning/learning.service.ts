import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCardProgress } from './entities/user-card-progress.entity';

@Injectable()
export class LearningService {
  constructor(
    @InjectRepository(UserCardProgress)
    private readonly progress: Repository<UserCardProgress>,
  ) {}

  async getToday(userId: string, now = new Date()) {
    const queue = await this.progress
      .createQueryBuilder('progress')
      .innerJoinAndSelect('progress.card', 'card')
      .innerJoinAndSelect('card.deck', 'deck')
      .innerJoin(
        'user_decks',
        'enrollment',
        'enrollment.user_id = progress.user_id AND enrollment.deck_id = card.deck_id',
      )
      .where('progress.user_id = :userId', { userId })
      .andWhere('progress.due_at <= :now', { now })
      .andWhere('enrollment.is_active = true')
      .andWhere('deck.is_published = true')
      .andWhere('card.is_active = true')
      .orderBy('progress.due_at', 'ASC')
      .addOrderBy('card.sort_order', 'ASC')
      .addOrderBy('card.id', 'ASC')
      .getMany();
    const countsByType: Record<string, number> = {};
    const countsByDeck: Record<string, number> = {};
    for (const item of queue) {
      countsByType[item.card.type] = (countsByType[item.card.type] ?? 0) + 1;
      countsByDeck[item.card.deck_id] =
        (countsByDeck[item.card.deck_id] ?? 0) + 1;
    }
    return {
      queue: queue.map((p) => ({
        card: p.card,
        // PostgreSQL NUMERIC columns are returned as strings by TypeORM. Keep
        // the Today response stable for API consumers regardless of driver
        // serialization.
        progress: {
          ...p,
          stability: Number(p.stability),
          difficulty: Number(p.difficulty),
        },
      })),
      totalDue: queue.length,
      countsByType,
      countsByDeck,
      caughtUp: !queue.length,
      serverTimestamp: now.toISOString(),
    };
  }
}
