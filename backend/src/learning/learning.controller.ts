import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../users/current-user.decorator';
import type { AuthenticatedPrincipal } from '../auth/authenticated-principal';
import { LearningService } from './learning.service';
@Controller('today')
export class LearningController {
  constructor(private readonly learning: LearningService) {}
  @Get() getToday(@CurrentUser() user: AuthenticatedPrincipal) {
    return this.learning.getToday(user.id);
  }
}
