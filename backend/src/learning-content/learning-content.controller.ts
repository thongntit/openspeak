import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetContentDeckCardsQueryDto } from './dto/get-content-deck-cards-query.dto';
import { GetContentDecksQueryDto } from './dto/get-content-decks-query.dto';
import { LearningContentService } from './learning-content.service';

@Controller('content/decks')
export class LearningContentController {
  constructor(private readonly content: LearningContentService) {}

  @Get()
  findAll(@Query() query: GetContentDecksQueryDto) {
    return this.content.findPublishedDecks(query);
  }

  @Get(':slug/cards')
  findCards(
    @Param('slug') slug: string,
    @Query() query: GetContentDeckCardsQueryDto,
  ) {
    return this.content.findPublishedDeckCards(slug, query);
  }
}
