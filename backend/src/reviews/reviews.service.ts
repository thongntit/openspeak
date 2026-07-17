import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { LearningService } from '../learning/learning.service';
import { FsrsSchedulerService } from '../learning/scheduler/fsrs-scheduler.service';
import { ReviewEvent } from '../learning/entities/review-event.entity';
import { UserCardProgress } from '../learning/entities/user-card-progress.entity';
import { SubmitReviewDto } from './dto/submit-review.dto';
@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);
  constructor(
    private readonly data: DataSource,
    private readonly scheduler: FsrsSchedulerService,
    private readonly learning: LearningService,
  ) {}
  async submit(userId: string, dto: SubmitReviewDto) {
    const now = new Date();
    if (
      dto.clientReviewedAt &&
      Math.abs(now.getTime() - new Date(dto.clientReviewedAt).getTime()) >
        7 * 864e5
    )
      throw new BadRequestException(
        'clientReviewedAt is outside the allowed clock skew',
      );
    let accepted = false;
    let duplicate = false;
    let acceptedMeta: { schedulerVersion: string } | undefined;
    let event: ReviewEvent;
    try {
      event = await this.data.transaction(async (manager) => {
        const events = manager.getRepository(ReviewEvent);
        const scoped = () =>
          manager
            .getRepository(UserCardProgress)
            .createQueryBuilder('progress')
            .innerJoinAndSelect('progress.card', 'card')
            .innerJoin('card.deck', 'deck')
            .innerJoin(
              'user_decks',
              'enrollment',
              'enrollment.user_id = progress.user_id AND enrollment.deck_id = card.deck_id',
            )
            .where(
              'progress.user_id = :userId AND progress.card_id = :cardId',
              {
                userId,
                cardId: dto.cardId,
              },
            )
            .andWhere(
              'enrollment.is_active = true AND card.is_active = true AND deck.is_published = true',
            );
        const visible = await scoped().getOne();
        if (!visible) throw new NotFoundException('Card not found');
        const existingEvent = await events.findOneBy({
          user_id: userId,
          client_request_id: dto.clientRequestId,
        });
        if (existingEvent) {
          duplicate = true;
          return this.matchReplay(existingEvent, dto);
        }
        const progress = await scoped()
          .setLock('pessimistic_write', undefined, ['progress'])
          .getOne();
        if (!progress) throw new NotFoundException('Card not found');
        const postLockEvent = await events.findOneBy({
          user_id: userId,
          client_request_id: dto.clientRequestId,
        });
        if (postLockEvent) {
          duplicate = true;
          return this.matchReplay(postLockEvent, dto);
        }
        const reviewedAt = new Date();
        const next = this.scheduler.schedule(
          {
            stage: progress.stage,
            dueAt: progress.due_at,
            stability: Number(progress.stability),
            difficulty: Number(progress.difficulty),
            elapsedDays: progress.elapsed_days,
            scheduledDays: progress.scheduled_days,
            repetitions: progress.repetitions,
            lapses: progress.lapses,
            lastReviewedAt: progress.last_reviewed_at,
            lastRating: progress.last_rating,
            schedulerVersion: progress.scheduler_version,
          },
          dto.rating,
          reviewedAt,
        );
        const created = events.create({
          user_id: userId,
          card_id: dto.cardId,
          client_request_id: dto.clientRequestId,
          rating: dto.rating,
          reviewed_at: reviewedAt,
          client_reviewed_at: dto.clientReviewedAt
            ? new Date(dto.clientReviewedAt)
            : null,
          scheduler_version: next.schedulerVersion,
          state_before: this.auditState({
            stage: progress.stage,
            dueAt: progress.due_at,
            stability: Number(progress.stability),
            difficulty: Number(progress.difficulty),
            elapsedDays: progress.elapsed_days,
            scheduledDays: progress.scheduled_days,
            repetitions: progress.repetitions,
            lapses: progress.lapses,
            lastReviewedAt: progress.last_reviewed_at,
            lastRating: progress.last_rating,
            schedulerVersion: progress.scheduler_version,
          }),
          state_after: this.auditState(next),
        });
        const saved = await events.save(created);
        Object.assign(progress, {
          stage: next.stage,
          due_at: next.dueAt,
          stability: next.stability,
          difficulty: next.difficulty,
          elapsed_days: next.elapsedDays,
          scheduled_days: next.scheduledDays,
          repetitions: next.repetitions,
          lapses: next.lapses,
          last_reviewed_at: next.lastReviewedAt,
          last_rating: next.lastRating,
          scheduler_version: next.schedulerVersion,
        });
        await manager.save(progress);
        accepted = true;
        acceptedMeta = { schedulerVersion: next.schedulerVersion };
        return saved;
      });
    } catch (error) {
      if (error instanceof QueryFailedError && this.isUniqueViolation(error)) {
        const replay = await this.data.getRepository(ReviewEvent).findOneBy({
          user_id: userId,
          client_request_id: dto.clientRequestId,
        });
        if (!replay) throw error;
        event = this.matchReplay(replay, dto);
        duplicate = true;
      } else throw error;
    }
    if (accepted && acceptedMeta)
      this.logger.log({
        userId,
        cardId: dto.cardId,
        requestId: dto.clientRequestId,
        schedulerVersion: acceptedMeta.schedulerVersion,
        outcome: 'accepted',
      });
    return this.response(
      event,
      await this.learning.getToday(userId, new Date()),
      duplicate,
    );
  }
  private response(event: ReviewEvent, today: unknown, duplicate: boolean) {
    const before = event.state_before;
    const after = event.state_after;
    return {
      reviewEventId: event.id,
      duplicate,
      cardId: event.card_id,
      previousDueAt: before.dueAt,
      nextDueAt: after.dueAt,
      schedulerVersion: event.scheduler_version,
      progress: {
        cardId: event.card_id,
        stage: after.stage,
        stability: after.stability,
        difficulty: after.difficulty,
        dueAt: after.dueAt,
        lastReviewedAt: after.lastReviewedAt,
        reviewCount: after.repetitions,
        lapseCount: after.lapses,
        schedulerVersion: after.schedulerVersion,
        elapsedDays: after.elapsedDays,
        scheduledDays: after.scheduledDays,
        repetitions: after.repetitions,
        lapses: after.lapses,
        lastRating: after.lastRating,
      },
      today,
    };
  }
  private matchReplay(event: ReviewEvent, dto: SubmitReviewDto) {
    if (
      event.card_id !== dto.cardId ||
      event.rating !== dto.rating ||
      (event.client_reviewed_at?.toISOString() ?? null) !==
        (dto.clientReviewedAt
          ? new Date(dto.clientReviewedAt).toISOString()
          : null)
    )
      throw new ConflictException(
        'Client request ID was already used for a different review',
      );
    return event;
  }
  private isUniqueViolation(error: unknown) {
    if (!(error instanceof QueryFailedError)) return false;
    const driver = (error as unknown as { driverError: unknown }).driverError;
    return (
      typeof driver === 'object' &&
      driver !== null &&
      'code' in driver &&
      (driver as { code?: unknown }).code === '23505'
    );
  }
  private auditState(state: {
    stage: unknown;
    dueAt: Date;
    stability: number;
    difficulty: number;
    elapsedDays: number;
    scheduledDays: number;
    repetitions: number;
    lapses: number;
    lastReviewedAt: Date | null;
    lastRating: unknown;
    schedulerVersion: string;
  }) {
    return {
      ...state,
      dueAt: state.dueAt.toISOString(),
      lastReviewedAt: state.lastReviewedAt?.toISOString() ?? null,
    };
  }
}
