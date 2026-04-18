import 'reflect-metadata';
import dataSource from '../../data-source';
import { Word } from '../../words/word.entity';
import { Collection } from '../../collections/collection.entity';
import { CollectionWord } from '../../collections/collection-word.entity';

interface SeedWord {
  word: string;
  ipa: string;
  phonemes: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  syllables: number;
  example_sentence: string;
}

const SEED_WORDS: SeedWord[] = [
  { word: 'hello', ipa: 'həˈloʊ', phonemes: ['h', 'ə', 'l', 'oʊ'], difficulty: 'beginner', syllables: 2, example_sentence: 'Hello, how are you?' },
  { word: 'hi', ipa: 'haɪ', phonemes: ['h', 'aɪ'], difficulty: 'beginner', syllables: 1, example_sentence: 'Hi there!' },
  { word: 'thanks', ipa: 'θæŋks', phonemes: ['θ', 'æ', 'ŋ', 'k', 's'], difficulty: 'intermediate', syllables: 1, example_sentence: 'Thanks for your help.' },
  { word: 'think', ipa: 'θɪŋk', phonemes: ['θ', 'ɪ', 'ŋ', 'k'], difficulty: 'intermediate', syllables: 1, example_sentence: 'I think so.' },
  { word: 'three', ipa: 'θriː', phonemes: ['θ', 'r', 'iː'], difficulty: 'intermediate', syllables: 1, example_sentence: 'I have three cats.' },
  { word: 'this', ipa: 'ðɪs', phonemes: ['ð', 'ɪ', 's'], difficulty: 'intermediate', syllables: 1, example_sentence: 'This is my book.' },
  { word: 'that', ipa: 'ðæt', phonemes: ['ð', 'æ', 't'], difficulty: 'intermediate', syllables: 1, example_sentence: 'That is mine.' },
  { word: 'the', ipa: 'ðə', phonemes: ['ð', 'ə'], difficulty: 'beginner', syllables: 1, example_sentence: 'The cat is here.' },
  { word: 'bath', ipa: 'bæθ', phonemes: ['b', 'æ', 'θ'], difficulty: 'advanced', syllables: 1, example_sentence: 'I take a bath.' },
  { word: 'both', ipa: 'boʊθ', phonemes: ['b', 'oʊ', 'θ'], difficulty: 'advanced', syllables: 1, example_sentence: 'I like both.' },
  { word: 'ship', ipa: 'ʃɪp', phonemes: ['ʃ', 'ɪ', 'p'], difficulty: 'intermediate', syllables: 1, example_sentence: 'A big ship.' },
  { word: 'sheep', ipa: 'ʃiːp', phonemes: ['ʃ', 'iː', 'p'], difficulty: 'intermediate', syllables: 1, example_sentence: 'White sheep grazing.' },
  { word: 'cheese', ipa: 'tʃiːz', phonemes: ['tʃ', 'iː', 'z'], difficulty: 'intermediate', syllables: 1, example_sentence: 'I love cheese.' },
  { word: 'choose', ipa: 'tʃuːz', phonemes: ['tʃ', 'uː', 'z'], difficulty: 'intermediate', syllables: 1, example_sentence: 'Please choose one.' },
  { word: 'cat', ipa: 'kæt', phonemes: ['k', 'æ', 't'], difficulty: 'beginner', syllables: 1, example_sentence: 'The cat sleeps.' },
  { word: 'bat', ipa: 'bæt', phonemes: ['b', 'æ', 't'], difficulty: 'beginner', syllables: 1, example_sentence: 'A baseball bat.' },
  { word: 'bed', ipa: 'bɛd', phonemes: ['b', 'ɛ', 'd'], difficulty: 'beginner', syllables: 1, example_sentence: 'Go to bed.' },
  { word: 'bad', ipa: 'bæd', phonemes: ['b', 'æ', 'd'], difficulty: 'beginner', syllables: 1, example_sentence: 'Not bad.' },
  { word: 'sit', ipa: 'sɪt', phonemes: ['s', 'ɪ', 't'], difficulty: 'beginner', syllables: 1, example_sentence: 'Please sit.' },
  { word: 'seat', ipa: 'siːt', phonemes: ['s', 'iː', 't'], difficulty: 'intermediate', syllables: 1, example_sentence: 'Take a seat.' },
  { word: 'good', ipa: 'gʊd', phonemes: ['g', 'ʊ', 'd'], difficulty: 'beginner', syllables: 1, example_sentence: 'Good morning.' },
  { word: 'goodbye', ipa: 'gʊdˈbaɪ', phonemes: ['g', 'ʊ', 'd', 'b', 'aɪ'], difficulty: 'beginner', syllables: 2, example_sentence: 'Goodbye for now.' },
  { word: 'please', ipa: 'pliːz', phonemes: ['p', 'l', 'iː', 'z'], difficulty: 'beginner', syllables: 1, example_sentence: 'Please help me.' },
  { word: 'sorry', ipa: 'ˈsɒri', phonemes: ['s', 'ɒ', 'r', 'i'], difficulty: 'beginner', syllables: 2, example_sentence: 'I am sorry.' },
  { word: 'water', ipa: 'ˈwɔːtər', phonemes: ['w', 'ɔː', 't', 'ə', 'r'], difficulty: 'beginner', syllables: 2, example_sentence: 'A glass of water.' },
  { word: 'work', ipa: 'wɜːrk', phonemes: ['w', 'ɜː', 'r', 'k'], difficulty: 'intermediate', syllables: 1, example_sentence: 'Go to work.' },
  { word: 'world', ipa: 'wɜːrld', phonemes: ['w', 'ɜː', 'r', 'l', 'd'], difficulty: 'intermediate', syllables: 1, example_sentence: 'Around the world.' },
  { word: 'red', ipa: 'rɛd', phonemes: ['r', 'ɛ', 'd'], difficulty: 'beginner', syllables: 1, example_sentence: 'A red car.' },
  { word: 'run', ipa: 'rʌn', phonemes: ['r', 'ʌ', 'n'], difficulty: 'beginner', syllables: 1, example_sentence: 'Run fast.' },
  { word: 'very', ipa: 'ˈvɛri', phonemes: ['v', 'ɛ', 'r', 'i'], difficulty: 'beginner', syllables: 2, example_sentence: 'Very good.' },
];

interface SeedCollection {
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  words: string[];
}

const SEED_COLLECTIONS: SeedCollection[] = [
  {
    name: 'Common Greetings',
    description: 'Everyday greetings and polite phrases.',
    difficulty: 'beginner',
    tags: ['greetings', 'polite'],
    words: ['hello', 'hi', 'goodbye', 'please', 'sorry', 'thanks'],
  },
  {
    name: 'Difficult Consonants (θ/ð)',
    description: 'Words featuring the voiceless/voiced dental fricatives.',
    difficulty: 'advanced',
    tags: ['consonants', 'fricatives'],
    words: ['thanks', 'think', 'three', 'this', 'that', 'the', 'bath', 'both'],
  },
  {
    name: 'Vowel Practice (short vs long)',
    description: 'Minimal pairs to practice short and long vowels.',
    difficulty: 'intermediate',
    tags: ['vowels', 'minimal-pairs'],
    words: ['ship', 'sheep', 'sit', 'seat', 'bed', 'bad'],
  },
];

async function run() {
  await dataSource.initialize();
  const wordRepo = dataSource.getRepository(Word);
  const collectionRepo = dataSource.getRepository(Collection);
  const collectionWordRepo = dataSource.getRepository(CollectionWord);

  console.log(`Seeding ${SEED_WORDS.length} words...`);
  const wordIdByText = new Map<string, string>();
  for (const w of SEED_WORDS) {
    let existing = await wordRepo.findOneBy({ word: w.word });
    if (existing) {
      existing.ipa = w.ipa;
      existing.phonemes = w.phonemes;
      existing.difficulty = w.difficulty;
      existing.syllables = w.syllables;
      existing.example_sentence = w.example_sentence;
      existing = await wordRepo.save(existing);
    } else {
      existing = await wordRepo.save(wordRepo.create(w));
    }
    wordIdByText.set(w.word, existing.id);
  }

  console.log(`Seeding ${SEED_COLLECTIONS.length} collections...`);
  for (const c of SEED_COLLECTIONS) {
    let col = await collectionRepo.findOneBy({ name: c.name });
    if (col) {
      col.description = c.description;
      col.difficulty = c.difficulty;
      col.tags = c.tags;
      col = await collectionRepo.save(col);
    } else {
      col = await collectionRepo.save(
        collectionRepo.create({
          name: c.name,
          description: c.description,
          difficulty: c.difficulty,
          tags: c.tags,
        }),
      );
    }

    await collectionWordRepo.delete({ collection_id: col.id });
    for (let i = 0; i < c.words.length; i++) {
      const wordId = wordIdByText.get(c.words[i]);
      if (!wordId) {
        console.warn(`  skip missing word "${c.words[i]}"`);
        continue;
      }
      await collectionWordRepo.save(
        collectionWordRepo.create({
          collection_id: col.id,
          word_id: wordId,
          position: i,
        }),
      );
    }
  }

  await dataSource.destroy();
  console.log('Seed complete.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
