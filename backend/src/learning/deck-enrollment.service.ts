import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Card } from './entities/card.entity';
import { Deck } from './entities/deck.entity';
import {
  LearningStage,
  UserCardProgress,
} from './entities/user-card-progress.entity';
import { UserDeck } from './entities/user-deck.entity';
import { LearningService } from './learning.service';
import { SCHEDULER_VERSION } from './scheduler/fsrs-scheduler.service';

@Injectable()
export class DeckEnrollmentService {
  constructor(
    private readonly data: DataSource,
    private readonly learning: LearningService,
  ) {}

  async enroll(userId: string, deckId: string, now = new Date()) {
    const enrolledCardCount = await this.data.transaction(async (manager) => {
      const deck = await manager.getRepository(Deck).findOneBy({
        id: deckId,
        is_published: true,
      });
      if (!deck) throw new NotFoundException('Deck not found');

      const cards = await manager.getRepository(Card).find({
        where: { deck_id: deckId, is_active: true },
        order: { sort_order: 'ASC', id: 'ASC' },
      });
      if (!cards.length) {
        throw new BadRequestException('Deck has no active cards');
      }

      await manager.getRepository(UserDeck).upsert(
        { user_id: userId, deck_id: deckId, is_active: true },
        {
          conflictPaths: ['user_id', 'deck_id'],
          skipUpdateIfNoValuesChanged: true,
        },
      );

      await manager
        .getRepository(UserCardProgress)
        .createQueryBuilder()
        .insert()
        .values(
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
        )
        .orIgnore()
        .execute();

      return cards.length;
    });

    return {
      deckId,
      isLearning: true,
      enrolledCardCount,
      today: await this.learning.getToday(userId, now),
    };
  }
}
