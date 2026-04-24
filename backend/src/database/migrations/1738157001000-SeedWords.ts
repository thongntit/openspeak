import { MigrationInterface, QueryRunner } from 'typeorm';

const WORDS = [
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
  { word: 'yes', ipa: 'jɛs', phonemes: ['j', 'ɛ', 's'], difficulty: 'beginner', syllables: 1, example_sentence: 'Yes, please.' },
  { word: 'no', ipa: 'noʊ', phonemes: ['n', 'oʊ'], difficulty: 'beginner', syllables: 1, example_sentence: 'No, thanks.' },
  { word: 'one', ipa: 'wʌn', phonemes: ['w', 'ʌ', 'n'], difficulty: 'beginner', syllables: 1, example_sentence: 'I have one apple.' },
  { word: 'two', ipa: 'tuː', phonemes: ['t', 'uː'], difficulty: 'beginner', syllables: 1, example_sentence: 'There are two books.' },
  { word: 'four', ipa: 'fɔːr', phonemes: ['f', 'ɔː', 'r'], difficulty: 'beginner', syllables: 1, example_sentence: 'Four corners.' },
  { word: 'five', ipa: 'faɪv', phonemes: ['f', 'aɪ', 'v'], difficulty: 'beginner', syllables: 1, example_sentence: 'Give me five.' },
  { word: 'dog', ipa: 'dɒg', phonemes: ['d', 'ɒ', 'g'], difficulty: 'beginner', syllables: 1, example_sentence: 'The dog barks.' },
  { word: 'book', ipa: 'bʊk', phonemes: ['b', 'ʊ', 'k'], difficulty: 'beginner', syllables: 1, example_sentence: 'Read a book.' },
  { word: 'house', ipa: 'haʊs', phonemes: ['h', 'aʊ', 's'], difficulty: 'beginner', syllables: 1, example_sentence: 'My house is blue.' },
  { word: 'car', ipa: 'kɑːr', phonemes: ['k', 'ɑː', 'r'], difficulty: 'beginner', syllables: 1, example_sentence: 'A fast car.' },
  { word: 'tree', ipa: 'triː', phonemes: ['t', 'r', 'iː'], difficulty: 'beginner', syllables: 1, example_sentence: 'Tall tree.' },
  { word: 'food', ipa: 'fuːd', phonemes: ['f', 'uː', 'd'], difficulty: 'beginner', syllables: 1, example_sentence: 'Tasty food.' },
  { word: 'eat', ipa: 'iːt', phonemes: ['iː', 't'], difficulty: 'beginner', syllables: 1, example_sentence: "Let's eat." },
  { word: 'drink', ipa: 'drɪŋk', phonemes: ['d', 'r', 'ɪ', 'ŋ', 'k'], difficulty: 'intermediate', syllables: 1, example_sentence: 'Drink water.' },
  { word: 'sleep', ipa: 'sliːp', phonemes: ['s', 'l', 'iː', 'p'], difficulty: 'intermediate', syllables: 1, example_sentence: 'Time to sleep.' },
  { word: 'walk', ipa: 'wɔːk', phonemes: ['w', 'ɔː', 'k'], difficulty: 'beginner', syllables: 1, example_sentence: 'Walk to school.' },
  { word: 'talk', ipa: 'tɔːk', phonemes: ['t', 'ɔː', 'k'], difficulty: 'beginner', syllables: 1, example_sentence: 'We can talk.' },
  { word: 'read', ipa: 'riːd', phonemes: ['r', 'iː', 'd'], difficulty: 'beginner', syllables: 1, example_sentence: 'Read a story.' },
  { word: 'write', ipa: 'raɪt', phonemes: ['r', 'aɪ', 't'], difficulty: 'intermediate', syllables: 1, example_sentence: 'Write a letter.' },
  { word: 'speak', ipa: 'spiːk', phonemes: ['s', 'p', 'iː', 'k'], difficulty: 'intermediate', syllables: 1, example_sentence: 'Speak clearly.' },
  { word: 'listen', ipa: 'ˈlɪsən', phonemes: ['l', 'ɪ', 's', 'ə', 'n'], difficulty: 'intermediate', syllables: 2, example_sentence: 'Listen carefully.' },
  { word: 'morning', ipa: 'ˈmɔːrnɪŋ', phonemes: ['m', 'ɔː', 'r', 'n', 'ɪ', 'ŋ'], difficulty: 'intermediate', syllables: 2, example_sentence: 'Good morning!' },
  { word: 'night', ipa: 'naɪt', phonemes: ['n', 'aɪ', 't'], difficulty: 'beginner', syllables: 1, example_sentence: 'Good night.' },
  { word: 'day', ipa: 'deɪ', phonemes: ['d', 'eɪ'], difficulty: 'beginner', syllables: 1, example_sentence: 'Nice day.' },
  { word: 'year', ipa: 'jɪər', phonemes: ['j', 'ɪə', 'r'], difficulty: 'intermediate', syllables: 1, example_sentence: 'This year.' },
  { word: 'time', ipa: 'taɪm', phonemes: ['t', 'aɪ', 'm'], difficulty: 'beginner', syllables: 1, example_sentence: 'What time is it?' },
  { word: 'friend', ipa: 'frɛnd', phonemes: ['f', 'r', 'ɛ', 'n', 'd'], difficulty: 'intermediate', syllables: 1, example_sentence: 'My best friend.' },
  { word: 'family', ipa: 'ˈfæmɪli', phonemes: ['f', 'æ', 'm', 'ɪ', 'l', 'i'], difficulty: 'intermediate', syllables: 3, example_sentence: 'My family is here.' },
  { word: 'school', ipa: 'skuːl', phonemes: ['s', 'k', 'uː', 'l'], difficulty: 'intermediate', syllables: 1, example_sentence: 'Go to school.' },
  { word: 'teacher', ipa: 'ˈtiːtʃər', phonemes: ['t', 'iː', 'tʃ', 'ə', 'r'], difficulty: 'intermediate', syllables: 2, example_sentence: 'Kind teacher.' },
  { word: 'student', ipa: 'ˈstuːdənt', phonemes: ['s', 't', 'uː', 'd', 'ə', 'n', 't'], difficulty: 'intermediate', syllables: 2, example_sentence: 'Good student.' },
  { word: 'beautiful', ipa: 'ˈbjuːtɪfəl', phonemes: ['b', 'j', 'uː', 't', 'ɪ', 'f', 'ə', 'l'], difficulty: 'advanced', syllables: 3, example_sentence: 'Beautiful flower.' },
  { word: 'important', ipa: 'ɪmˈpɔːrtənt', phonemes: ['ɪ', 'm', 'p', 'ɔː', 'r', 't', 'ə', 'n', 't'], difficulty: 'advanced', syllables: 3, example_sentence: 'Very important.' },
  { word: 'question', ipa: 'ˈkwɛstʃən', phonemes: ['k', 'w', 'ɛ', 's', 'tʃ', 'ə', 'n'], difficulty: 'advanced', syllables: 2, example_sentence: 'Ask a question.' },
  { word: 'answer', ipa: 'ˈænsər', phonemes: ['æ', 'n', 's', 'ə', 'r'], difficulty: 'intermediate', syllables: 2, example_sentence: 'My answer is yes.' },
  { word: 'pronounce', ipa: 'prəˈnaʊns', phonemes: ['p', 'r', 'ə', 'n', 'aʊ', 'n', 's'], difficulty: 'advanced', syllables: 2, example_sentence: 'Pronounce it slowly.' },
  { word: 'language', ipa: 'ˈlæŋgwɪdʒ', phonemes: ['l', 'æ', 'ŋ', 'g', 'w', 'ɪ', 'dʒ'], difficulty: 'advanced', syllables: 2, example_sentence: 'A new language.' },
  { word: 'English', ipa: 'ˈɪŋglɪʃ', phonemes: ['ɪ', 'ŋ', 'g', 'l', 'ɪ', 'ʃ'], difficulty: 'intermediate', syllables: 2, example_sentence: 'I speak English.' },
  { word: 'learn', ipa: 'lɜːrn', phonemes: ['l', 'ɜː', 'r', 'n'], difficulty: 'intermediate', syllables: 1, example_sentence: 'Learn fast.' },
  { word: 'practice', ipa: 'ˈpræktɪs', phonemes: ['p', 'r', 'æ', 'k', 't', 'ɪ', 's'], difficulty: 'advanced', syllables: 2, example_sentence: 'Daily practice.' },
  { word: 'judge', ipa: 'dʒʌdʒ', phonemes: ['dʒ', 'ʌ', 'dʒ'], difficulty: 'advanced', syllables: 1, example_sentence: 'The judge decided.' },
  { word: 'jump', ipa: 'dʒʌmp', phonemes: ['dʒ', 'ʌ', 'm', 'p'], difficulty: 'intermediate', syllables: 1, example_sentence: 'Jump high.' },
  { word: 'yellow', ipa: 'ˈjɛloʊ', phonemes: ['j', 'ɛ', 'l', 'oʊ'], difficulty: 'intermediate', syllables: 2, example_sentence: 'Yellow sun.' },
  { word: 'young', ipa: 'jʌŋ', phonemes: ['j', 'ʌ', 'ŋ'], difficulty: 'intermediate', syllables: 1, example_sentence: 'Young child.' },
  { word: 'measure', ipa: 'ˈmɛʒər', phonemes: ['m', 'ɛ', 'ʒ', 'ə', 'r'], difficulty: 'advanced', syllables: 2, example_sentence: 'Measure twice.' },
  { word: 'pleasure', ipa: 'ˈplɛʒər', phonemes: ['p', 'l', 'ɛ', 'ʒ', 'ə', 'r'], difficulty: 'advanced', syllables: 2, example_sentence: 'My pleasure.' },
  { word: 'nation', ipa: 'ˈneɪʃən', phonemes: ['n', 'eɪ', 'ʃ', 'ə', 'n'], difficulty: 'advanced', syllables: 2, example_sentence: 'Proud nation.' },
  { word: 'vision', ipa: 'ˈvɪʒən', phonemes: ['v', 'ɪ', 'ʒ', 'ə', 'n'], difficulty: 'advanced', syllables: 2, example_sentence: 'Clear vision.' },
  { word: 'breakfast', ipa: 'ˈbrɛkfəst', phonemes: ['b', 'r', 'ɛ', 'k', 'f', 'ə', 's', 't'], difficulty: 'intermediate', syllables: 2, example_sentence: 'Eat breakfast.' },
  { word: 'computer', ipa: 'kəmˈpjuːtər', phonemes: ['k', 'ə', 'm', 'p', 'j', 'uː', 't', 'ə', 'r'], difficulty: 'advanced', syllables: 3, example_sentence: 'Use the computer.' },
  { word: 'phone', ipa: 'foʊn', phonemes: ['f', 'oʊ', 'n'], difficulty: 'intermediate', syllables: 1, example_sentence: 'Answer the phone.' },
  { word: 'photo', ipa: 'ˈfoʊtoʊ', phonemes: ['f', 'oʊ', 't', 'oʊ'], difficulty: 'intermediate', syllables: 2, example_sentence: 'A nice photo.' },
  { word: 'love', ipa: 'lʌv', phonemes: ['l', 'ʌ', 'v'], difficulty: 'beginner', syllables: 1, example_sentence: 'I love you.' },
  { word: 'life', ipa: 'laɪf', phonemes: ['l', 'aɪ', 'f'], difficulty: 'beginner', syllables: 1, example_sentence: 'Life is good.' },
  { word: 'right', ipa: 'raɪt', phonemes: ['r', 'aɪ', 't'], difficulty: 'beginner', syllables: 1, example_sentence: 'You are right.' },
  { word: 'light', ipa: 'laɪt', phonemes: ['l', 'aɪ', 't'], difficulty: 'beginner', syllables: 1, example_sentence: 'Turn on the light.' },
  { word: 'might', ipa: 'maɪt', phonemes: ['m', 'aɪ', 't'], difficulty: 'intermediate', syllables: 1, example_sentence: 'I might go.' },
  { word: 'rough', ipa: 'rʌf', phonemes: ['r', 'ʌ', 'f'], difficulty: 'intermediate', syllables: 1, example_sentence: 'Rough surface.' },
  { word: 'enough', ipa: 'ɪˈnʌf', phonemes: ['ɪ', 'n', 'ʌ', 'f'], difficulty: 'advanced', syllables: 2, example_sentence: 'That is enough.' },
  { word: 'laugh', ipa: 'læf', phonemes: ['l', 'æ', 'f'], difficulty: 'intermediate', syllables: 1, example_sentence: 'We laugh together.' },
  { word: 'cough', ipa: 'kɒf', phonemes: ['k', 'ɒ', 'f'], difficulty: 'advanced', syllables: 1, example_sentence: 'A bad cough.' },
  { word: 'ring', ipa: 'rɪŋ', phonemes: ['r', 'ɪ', 'ŋ'], difficulty: 'beginner', syllables: 1, example_sentence: 'Gold ring.' },
  { word: 'sing', ipa: 'sɪŋ', phonemes: ['s', 'ɪ', 'ŋ'], difficulty: 'beginner', syllables: 1, example_sentence: 'Sing a song.' },
  { word: 'king', ipa: 'kɪŋ', phonemes: ['k', 'ɪ', 'ŋ'], difficulty: 'beginner', syllables: 1, example_sentence: 'The king.' },
  { word: 'long', ipa: 'lɒŋ', phonemes: ['l', 'ɒ', 'ŋ'], difficulty: 'beginner', syllables: 1, example_sentence: 'A long road.' },
  { word: 'strong', ipa: 'strɒŋ', phonemes: ['s', 't', 'r', 'ɒ', 'ŋ'], difficulty: 'intermediate', syllables: 1, example_sentence: 'Strong hands.' },
  { word: 'street', ipa: 'striːt', phonemes: ['s', 't', 'r', 'iː', 't'], difficulty: 'intermediate', syllables: 1, example_sentence: 'Cross the street.' },
  { word: 'spring', ipa: 'sprɪŋ', phonemes: ['s', 'p', 'r', 'ɪ', 'ŋ'], difficulty: 'intermediate', syllables: 1, example_sentence: 'Warm spring.' },
  { word: 'splash', ipa: 'splæʃ', phonemes: ['s', 'p', 'l', 'æ', 'ʃ'], difficulty: 'advanced', syllables: 1, example_sentence: 'A big splash.' },
  { word: 'squirrel', ipa: 'ˈskwɜːrəl', phonemes: ['s', 'k', 'w', 'ɜː', 'r', 'ə', 'l'], difficulty: 'advanced', syllables: 2, example_sentence: 'A red squirrel.' },
];

const COLLECTIONS = [
  { name: 'Common Greetings', description: 'Everyday greetings and polite phrases.', difficulty: 'beginner', tags: ['greetings', 'polite'], words: ['hello', 'hi', 'goodbye', 'please', 'sorry', 'thanks'] },
  { name: 'Difficult Consonants (θ/ð)', description: 'Words featuring the voiceless/voiced dental fricatives.', difficulty: 'advanced', tags: ['consonants', 'fricatives'], words: ['thanks', 'think', 'three', 'this', 'that', 'the', 'bath', 'both'] },
  { name: 'Vowel Practice (short vs long)', description: 'Minimal pairs to practice short and long vowels.', difficulty: 'intermediate', tags: ['vowels', 'minimal-pairs'], words: ['ship', 'sheep', 'sit', 'seat', 'bed', 'bad'] },
  { name: 'Consonant Clusters (str, spr, spl)', description: 'Words starting with tricky three-consonant clusters.', difficulty: 'advanced', tags: ['consonants', 'clusters'], words: ['strong', 'street', 'spring', 'splash', 'student', 'squirrel'] },
  { name: 'Silent Letters & "gh"', description: 'Spelling irregularities around the "gh" grapheme.', difficulty: 'advanced', tags: ['spelling', 'silent-letters'], words: ['right', 'light', 'night', 'might', 'rough', 'enough', 'laugh', 'cough'] },
  { name: 'Numbers 1-5', description: 'Basic counting vocabulary.', difficulty: 'beginner', tags: ['numbers', 'basics'], words: ['one', 'two', 'three', 'four', 'five'] },
  { name: 'Nasal Endings (-ing, -ng)', description: 'Words ending in the velar nasal /ŋ/.', difficulty: 'intermediate', tags: ['consonants', 'nasals'], words: ['ring', 'sing', 'king', 'long', 'strong', 'spring'] },
];

export class SeedWords1738157001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const w of WORDS) {
      await queryRunner.query(
        `INSERT INTO words (word, ipa, phonemes, difficulty, syllables, example_sentence)
         VALUES ($1, $2, $3::jsonb, $4, $5, $6)
         ON CONFLICT (word) DO NOTHING`,
        [w.word, w.ipa, JSON.stringify(w.phonemes), w.difficulty, w.syllables, w.example_sentence],
      );
    }

    for (const c of COLLECTIONS) {
      const [col] = await queryRunner.query(
        `INSERT INTO collections (name, description, difficulty, tags)
         VALUES ($1, $2, $3, $4::jsonb)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [c.name, c.description, c.difficulty, JSON.stringify(c.tags)],
      );
      if (!col) continue;

      for (let i = 0; i < c.words.length; i++) {
        const [word] = await queryRunner.query(
          `SELECT id FROM words WHERE word = $1`,
          [c.words[i]],
        );
        if (!word) continue;
        await queryRunner.query(
          `INSERT INTO collection_words (collection_id, word_id, position)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [col.id, word.id, i],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const words = WORDS.map((w) => `'${w.word.replace("'", "''")}'`).join(', ');
    await queryRunner.query(`DELETE FROM words WHERE word IN (${words})`);
  }
}
