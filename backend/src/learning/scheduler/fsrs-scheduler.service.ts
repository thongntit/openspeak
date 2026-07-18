import { Injectable } from '@nestjs/common';
import {
  LearningStage,
  ReviewRating,
} from '../entities/user-card-progress.entity';
import type { SchedulerState } from './scheduler.types';

export const SCHEDULER_VERSION = 'fsrs-v1';

const MINUTE = 60_000;

@Injectable()
export class FsrsSchedulerService {
  schedule(
    state: SchedulerState,
    rating: ReviewRating,
    now: Date,
  ): SchedulerState {
    const { stage, minutes, lapse } = this.transition(state.stage, rating);
    const scheduledDays = Math.max(0, Math.floor(minutes / 1_440));

    return {
      ...state,
      stage,
      dueAt: new Date(now.getTime() + minutes * MINUTE),
      stability: this.nextStability(state.stability, rating),
      difficulty: this.nextDifficulty(state.difficulty, rating),
      elapsedDays: Math.max(
        0,
        Math.floor(
          (now.getTime() - state.dueAt.getTime()) / (24 * 60 * MINUTE),
        ),
      ),
      scheduledDays,
      repetitions: state.repetitions + 1,
      lapses: state.lapses + lapse,
      lastReviewedAt: new Date(now),
      lastRating: rating,
      schedulerVersion: SCHEDULER_VERSION,
    };
  }

  private transition(stage: LearningStage, rating: ReviewRating) {
    if (rating === ReviewRating.Again) {
      return {
        stage: LearningStage.Learning,
        minutes:
          stage === LearningStage.New || stage === LearningStage.Learning
            ? 1
            : 10,
        lapse: 1,
      };
    }
    if (rating === ReviewRating.Hard) {
      return {
        stage:
          stage === LearningStage.New || stage === LearningStage.Learning
            ? LearningStage.Learning
            : LearningStage.Review,
        minutes:
          stage === LearningStage.New || stage === LearningStage.Learning
            ? 10
            : stage === LearningStage.Review
              ? 2_880
              : 5_760,
        lapse: 0,
      };
    }
    if (rating === ReviewRating.Good) {
      return {
        stage:
          stage === LearningStage.Mastered
            ? LearningStage.Mastered
            : LearningStage.Review,
        minutes:
          stage === LearningStage.Mastered
            ? 11_520
            : stage === LearningStage.Review
              ? 5_760
              : 1_440,
        lapse: 0,
      };
    }
    return {
      stage:
        stage === LearningStage.Review || stage === LearningStage.Mastered
          ? LearningStage.Mastered
          : LearningStage.Review,
      minutes:
        stage === LearningStage.Mastered
          ? 23_040
          : stage === LearningStage.Review
            ? 11_520
            : 5_760,
      lapse: 0,
    };
  }

  private nextStability(stability: number, rating: ReviewRating) {
    const multiplier =
      rating === ReviewRating.Again
        ? 0.5
        : rating === ReviewRating.Hard
          ? 1.2
          : rating === ReviewRating.Good
            ? 2
            : 3;
    return Math.max(
      0.1,
      Number((Math.max(stability, 1) * multiplier).toFixed(6)),
    );
  }

  private nextDifficulty(difficulty: number, rating: ReviewRating) {
    const delta =
      rating === ReviewRating.Again
        ? 0.5
        : rating === ReviewRating.Hard
          ? 0.15
          : rating === ReviewRating.Good
            ? -0.1
            : -0.25;
    return Math.min(10, Math.max(1, Number((difficulty + delta).toFixed(6))));
  }
}
