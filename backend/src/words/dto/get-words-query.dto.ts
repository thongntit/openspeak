import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const DIFFICULTY_LEVELS = [
  'beginner',
  'intermediate',
  'advanced',
] as const;
export type Difficulty = (typeof DIFFICULTY_LEVELS)[number];

export class GetWordsQueryDto {
  @IsOptional()
  @IsString()
  phoneme?: string;

  @IsOptional()
  @IsString()
  startsWith?: string;

  @IsOptional()
  @IsString()
  endsWith?: string;

  @IsOptional()
  @IsIn(DIFFICULTY_LEVELS as unknown as string[])
  difficulty?: Difficulty;

  @IsOptional()
  @IsString()
  search?: string;

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
