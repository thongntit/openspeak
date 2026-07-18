import {
  LearningStage,
  ReviewRating,
} from '../entities/user-card-progress.entity';
import { FsrsSchedulerService } from './fsrs-scheduler.service';
import type { SchedulerState } from './scheduler.types';

const NOW = new Date('2026-07-17T00:00:00.000Z');

function state(stage: LearningStage): SchedulerState {
  return {
    stage,
    dueAt: new Date('2026-07-16T00:00:00.000Z'),
    stability: 2,
    difficulty: 5,
    elapsedDays: 2,
    scheduledDays: 2,
    repetitions: 3,
    lapses: 0,
    lastReviewedAt: new Date('2026-07-15T00:00:00.000Z'),
    lastRating: ReviewRating.Good,
    schedulerVersion: 'fsrs-v1',
  };
}

describe('FsrsSchedulerService', () => {
  const scheduler = new FsrsSchedulerService();

  it.each([
    [LearningStage.New, ReviewRating.Again, LearningStage.Learning, 1, 1],
    [LearningStage.New, ReviewRating.Hard, LearningStage.Learning, 10, 0],
    [LearningStage.New, ReviewRating.Good, LearningStage.Review, 1_440, 0],
    [LearningStage.New, ReviewRating.Easy, LearningStage.Review, 5_760, 0],
    [LearningStage.Learning, ReviewRating.Again, LearningStage.Learning, 1, 1],
    [LearningStage.Learning, ReviewRating.Hard, LearningStage.Learning, 10, 0],
    [LearningStage.Learning, ReviewRating.Good, LearningStage.Review, 1_440, 0],
    [LearningStage.Learning, ReviewRating.Easy, LearningStage.Review, 5_760, 0],
    [LearningStage.Review, ReviewRating.Again, LearningStage.Learning, 10, 1],
    [LearningStage.Review, ReviewRating.Hard, LearningStage.Review, 2_880, 0],
    [LearningStage.Review, ReviewRating.Good, LearningStage.Review, 5_760, 0],
    [
      LearningStage.Review,
      ReviewRating.Easy,
      LearningStage.Mastered,
      11_520,
      0,
    ],
    [LearningStage.Mastered, ReviewRating.Again, LearningStage.Learning, 10, 1],
    [LearningStage.Mastered, ReviewRating.Hard, LearningStage.Review, 5_760, 0],
    [
      LearningStage.Mastered,
      ReviewRating.Good,
      LearningStage.Mastered,
      11_520,
      0,
    ],
    [
      LearningStage.Mastered,
      ReviewRating.Easy,
      LearningStage.Mastered,
      23_040,
      0,
    ],
  ])(
    'transitions %s with %s deterministically',
    (stageValue, rating, expectedStage, minutes, lapseIncrease) => {
      const before = state(stageValue);
      const result = scheduler.schedule(before, rating, NOW);

      expect(result).toMatchObject({
        stage: expectedStage,
        dueAt: new Date(NOW.getTime() + minutes * 60_000),
        repetitions: before.repetitions + 1,
        lapses: before.lapses + lapseIncrease,
        lastReviewedAt: NOW,
        lastRating: rating,
        schedulerVersion: 'fsrs-v1',
      });
      expect(before).toEqual(state(stageValue));
    },
  );
});
