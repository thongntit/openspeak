import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { DIFFICULTY_LEVELS } from '../../words/dto/get-words-query.dto';
import type { Difficulty } from '../../words/dto/get-words-query.dto';

export class GetCollectionsQueryDto {
  @IsOptional()
  @IsIn(DIFFICULTY_LEVELS as unknown as string[])
  difficulty?: Difficulty;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset: number = 0;
}
