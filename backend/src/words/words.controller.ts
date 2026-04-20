import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { WordsService } from './words.service';
import { GetWordsQueryDto } from './dto/get-words-query.dto';

@Controller('words')
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  @Get()
  findAll(@Query() query: GetWordsQueryDto) {
    return this.wordsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.wordsService.findOne(id);
  }
}
