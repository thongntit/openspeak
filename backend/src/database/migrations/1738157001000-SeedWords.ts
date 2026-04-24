import * as fs from 'fs';
import * as path from 'path';
import { MigrationInterface, QueryRunner } from 'typeorm';

interface WordEntry {
  word: string;
  variants?: Array<{ ipa: string }>;
}

interface WordsJson {
  words: WordEntry[];
}

function loadWords(): WordEntry[] {
  // __dirname is 3 levels from app root in compiled dist/, 4 levels in source src/
  const candidates = [
    path.join(__dirname, '..', '..', '..', 'database', 'words.json'),
    path.join(__dirname, '..', '..', '..', '..', 'database', 'words.json'),
  ];
  const jsonPath = candidates.find((p) => fs.existsSync(p));
  if (!jsonPath)
    throw new Error(`words.json not found. Tried:\n${candidates.join('\n')}`);
  return (JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as WordsJson).words;
}

export class SeedWords1738157001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const words = loadWords();
    for (const entry of words) {
      if (!entry.variants?.length) continue;
      const ipa = entry.variants[0].ipa.replace(/^\/|\/$/g, '');
      await queryRunner.query(
        `INSERT INTO words (word, ipa, phonemes)
         VALUES ($1, $2, '[]'::jsonb)
         ON CONFLICT (word) DO NOTHING`,
        [entry.word, ipa],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const words = loadWords();
    for (const entry of words) {
      await queryRunner.query(`DELETE FROM words WHERE word = $1`, [
        entry.word,
      ]);
    }
  }
}
