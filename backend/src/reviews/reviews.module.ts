import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningDataModule } from '../learning/learning-data.module';
import { FsrsSchedulerService } from '../learning/scheduler/fsrs-scheduler.service';
import { ReviewEvent } from '../learning/entities/review-event.entity';
import { UserCardProgress } from '../learning/entities/user-card-progress.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewEvent, UserCardProgress]),
    LearningDataModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, FsrsSchedulerService],
})
export class ReviewsModule {}
