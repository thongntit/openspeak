import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Word } from './word.entity';
import { GetWordsQueryDto } from './dto/get-words-query.dto';
import {
  PaginatedResponse,
  buildPaginated,
} from '../common/dto/paginated-response.dto';

@Injectable()
export class WordsService {
  constructor(
    @InjectRepository(Word)
    private readonly wordsRepo: Repository<Word>,
  ) {}

  async findAll(query: GetWordsQueryDto): Promise<PaginatedResponse<Word>> {
    const { phoneme, startsWith, endsWith, difficulty, search, limit, offset } =
      query;

    const qb = this.wordsRepo.createQueryBuilder('w');

    if (phoneme) {
      qb.andWhere('w.phonemes @> :phoneme::jsonb', {
        phoneme: JSON.stringify([phoneme]),
      });
    }

    if (startsWith) {
      qb.andWhere('w.phonemes->>0 = :startsWith', { startsWith });
    }

    if (endsWith) {
      qb.andWhere(
        'w.phonemes->>(jsonb_array_length(w.phonemes) - 1) = :endsWith',
        { endsWith },
      );
    }

    if (difficulty) {
      qb.andWhere('w.difficulty = :difficulty', { difficulty });
    }

    if (search) {
      qb.andWhere('w.word ILIKE :search', { search: `%${search}%` });
    }

    qb.orderBy('w.word', 'ASC').take(limit).skip(offset);

    const [data, total] = await qb.getManyAndCount();
    return buildPaginated(data, total, limit, offset);
  }

  async findOne(id: string): Promise<Word> {
    const word = await this.wordsRepo.findOneBy({ id });
    if (!word) {
      throw new NotFoundException(`Word ${id} not found`);
    }
    return word;
  }
}
