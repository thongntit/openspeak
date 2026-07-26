import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Card } from './entities/card.entity';
import { Deck } from './entities/deck.entity';
import { ReviewEvent } from './entities/review-event.entity';
import { UserCardProgress } from './entities/user-card-progress.entity';
import { UserDeck } from './entities/user-deck.entity';
import { DeckEnrollmentController } from './deck-enrollment.controller';
import { DeckEnrollmentService } from './deck-enrollment.service';
import { LearningController } from './learning.controller';
import { LearningService } from './learning.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Deck,
      Card,
      UserDeck,
      UserCardProgress,
      ReviewEvent,
    ]),
  ],
  controllers: [LearningController, DeckEnrollmentController],
  providers: [LearningService, DeckEnrollmentService],
  exports: [TypeOrmModule, LearningService],
})
export class LearningDataModule {}
