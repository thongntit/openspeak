import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ReviewRating } from '../../learning/entities/user-card-progress.entity';
export class SubmitReviewDto {
  @IsUUID() cardId!: string;
  @IsEnum(ReviewRating) rating!: ReviewRating;
  @IsUUID() clientRequestId!: string;
  @IsOptional() @IsDateString() clientReviewedAt?: string;
}
