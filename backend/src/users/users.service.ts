import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewEvent } from '../learning/entities/review-event.entity';
import { UserCardProgress } from '../learning/entities/user-card-progress.entity';
import { UserDeck } from '../learning/entities/user-deck.entity';
import { LEARNING_VISIBILITY_CONDITION } from '../learning/learning-visibility';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(ReviewEvent)
    private readonly reviewEvents: Repository<ReviewEvent>,
    @InjectRepository(UserDeck)
    private readonly userDecks: Repository<UserDeck>,
    @InjectRepository(UserCardProgress)
    private readonly progress: Repository<UserCardProgress>,
  ) {}

  async resolveByClerkUserId(clerkUserId: string): Promise<User> {
    await this.users.upsert(
      { clerk_user_id: clerkUserId },
      {
        conflictPaths: ['clerk_user_id'],
        skipUpdateIfNoValuesChanged: true,
      },
    );
    return this.users.findOneByOrFail({ clerk_user_id: clerkUserId });
  }

  async getProfileSummary(userId: string, now = new Date()) {
    const dueNow = this.progress
      .createQueryBuilder('progress')
      .innerJoin('progress.card', 'card')
      .innerJoin('card.deck', 'deck')
      .innerJoin(
        'user_decks',
        'enrollment',
        'enrollment.user_id = progress.user_id AND enrollment.deck_id = card.deck_id',
      )
      .where('progress.user_id = :userId', { userId })
      .andWhere('progress.due_at <= :now', { now })
      .andWhere(LEARNING_VISIBILITY_CONDITION)
      .getCount();
    const [reviewsCompleted, learningDecks, dueCount] = await Promise.all([
      this.reviewEvents.countBy({ user_id: userId }),
      this.userDecks.countBy({ user_id: userId, is_active: true }),
      dueNow,
    ]);

    return { reviewsCompleted, learningDecks, dueNow: dueCount };
  }
}
