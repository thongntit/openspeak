import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/authenticated-principal';
import { CurrentUser } from '../users/current-user.decorator';
import { DeckEnrollmentService } from './deck-enrollment.service';

@Controller('decks')
export class DeckEnrollmentController {
  constructor(private readonly enrollment: DeckEnrollmentService) {}

  @Post(':deckId/enroll')
  @HttpCode(HttpStatus.OK)
  enroll(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('deckId', new ParseUUIDPipe({ version: '4' })) deckId: string,
  ) {
    return this.enrollment.enroll(user.id, deckId);
  }

  @Delete(':deckId/enrollment')
  @HttpCode(HttpStatus.OK)
  stopLearning(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Param('deckId', new ParseUUIDPipe({ version: '4' })) deckId: string,
  ) {
    return this.enrollment.stopLearning(user.id, deckId);
  }
}
