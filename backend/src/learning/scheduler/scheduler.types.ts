import {
  LearningStage,
  ReviewRating,
} from '../entities/user-card-progress.entity';

export interface SchedulerState {
  stage: LearningStage;
  dueAt: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  repetitions: number;
  lapses: number;
  lastReviewedAt: Date | null;
  lastRating: ReviewRating | null;
  schedulerVersion: string;
}
