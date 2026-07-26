import { Controller, Get, Param, Query } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/authenticated-principal';
import { CurrentUser } from '../users/current-user.decorator';
import { GetContentDeckCardsQueryDto } from './dto/get-content-deck-cards-query.dto';
import { GetContentDecksQueryDto } from './dto/get-content-decks-query.dto';
import { LearningContentService } from './learning-content.service';

@Controller('content/decks')
export class LearningContentController {
  constructor(private readonly content: LearningContentService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedPrincipal,
    @Query() query: GetContentDecksQueryDto,
  ) {
    return this.content.findPublishedDecks(user.id, query);
  }

  @Get(':slug/cards')
  findCards(
    @Param('slug') slug: string,
    @Query() query: GetContentDeckCardsQueryDto,
  ) {
    return this.content.findPublishedDeckCards(slug, query);
  }
}
