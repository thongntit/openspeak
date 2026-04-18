import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { GetCollectionsQueryDto } from './dto/get-collections-query.dto';
import { GetCollectionWordsQueryDto } from './dto/get-collection-words-query.dto';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  findAll(@Query() query: GetCollectionsQueryDto) {
    return this.collectionsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.collectionsService.findOne(id);
  }

  @Get(':id/words')
  findWords(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetCollectionWordsQueryDto,
  ) {
    return this.collectionsService.findCollectionWords(id, query);
  }
}
