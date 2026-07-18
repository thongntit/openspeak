import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from '../users/current-user.decorator';
import type { AuthenticatedPrincipal } from '../auth/authenticated-principal';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { ReviewsService } from './reviews.service';
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}
  @Post() submit(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Body() dto: SubmitReviewDto,
  ) {
    return this.reviews.submit(user.id, dto);
  }
}
