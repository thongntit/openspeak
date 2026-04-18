import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from './collection.entity';
import { CollectionWord } from './collection-word.entity';
import { Word } from '../words/word.entity';
import { GetCollectionsQueryDto } from './dto/get-collections-query.dto';
import { GetCollectionWordsQueryDto } from './dto/get-collection-words-query.dto';
import {
  PaginatedResponse,
  buildPaginated,
} from '../common/dto/paginated-response.dto';

export interface CollectionWithCount extends Collection {
  word_count: number;
}

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection)
    private readonly collectionsRepo: Repository<Collection>,
    @InjectRepository(CollectionWord)
    private readonly collectionWordsRepo: Repository<CollectionWord>,
  ) {}

  async findAll(
    query: GetCollectionsQueryDto,
  ): Promise<PaginatedResponse<CollectionWithCount>> {
    const { difficulty, tag, limit, offset } = query;

    const qb = this.collectionsRepo
      .createQueryBuilder('c')
      .leftJoin('collection_words', 'cw', 'cw.collection_id = c.id')
      .select([
        'c.id AS id',
        'c.name AS name',
        'c.description AS description',
        'c.difficulty AS difficulty',
        'c.tags AS tags',
        'c.created_at AS created_at',
        'c.updated_at AS updated_at',
      ])
      .addSelect('COUNT(cw.word_id)::int', 'word_count')
      .groupBy('c.id')
      .orderBy('c.name', 'ASC')
      .limit(limit)
      .offset(offset);

    if (difficulty) {
      qb.andWhere('c.difficulty = :difficulty', { difficulty });
    }
    if (tag) {
      qb.andWhere('c.tags @> :tag::jsonb', { tag: JSON.stringify([tag]) });
    }

    const rows = await qb.getRawMany<CollectionWithCount>();

    const countQb = this.collectionsRepo.createQueryBuilder('c');
    if (difficulty) {
      countQb.andWhere('c.difficulty = :difficulty', { difficulty });
    }
    if (tag) {
      countQb.andWhere('c.tags @> :tag::jsonb', { tag: JSON.stringify([tag]) });
    }
    const total = await countQb.getCount();

    return buildPaginated(rows, total, limit, offset);
  }

  async findOne(id: string): Promise<CollectionWithCount> {
    const collection = await this.collectionsRepo.findOneBy({ id });
    if (!collection) {
      throw new NotFoundException(`Collection ${id} not found`);
    }
    const word_count = await this.collectionWordsRepo.count({
      where: { collection_id: id },
    });
    return { ...collection, word_count };
  }

  async findCollectionWords(
    id: string,
    query: GetCollectionWordsQueryDto,
  ): Promise<PaginatedResponse<Word>> {
    const exists = await this.collectionsRepo.existsBy({ id });
    if (!exists) {
      throw new NotFoundException(`Collection ${id} not found`);
    }

    const { limit, offset } = query;

    const qb = this.collectionWordsRepo
      .createQueryBuilder('cw')
      .innerJoinAndSelect('cw.word', 'w')
      .where('cw.collection_id = :id', { id })
      .orderBy('cw.position', 'ASC')
      .take(limit)
      .skip(offset);

    const [rows, total] = await qb.getManyAndCount();
    const words = rows.map((cw) => cw.word);
    return buildPaginated(words, total, limit, offset);
  }
}
