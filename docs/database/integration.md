# Frontend Integration

This document describes how to integrate the OpenSpeak word database with the frontend application using a service-based approach.

## Overview

The frontend uses a service layer (`wordService.js`) to abstract all word database operations. This provides:

- **Clean API** - Simple methods for common operations
- **Offline support** - Automatic IndexedDB caching
- **Error handling** - Consistent error messages and recovery
- **Loading states** - Progress indicators for sync operations

## Service Architecture

```
┌─────────────────┐
│   Components    │
│  (PracticePage) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Word Service   │
│ (wordService.js)│
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│IndexedDB│ │ GitHub │
└────────┘ └────────┘
```

## API Reference

### Initialization

#### `initialize(): Promise<void>`

Initializes the word service, checks for cached data, and triggers sync if needed.

```javascript
import wordService from './services/wordService';

// In your app initialization
async function initApp() {
  try {
    await wordService.initialize();
    console.log('Word service ready');
  } catch (error) {
    console.error('Failed to initialize word service:', error);
  }
}
```

**Behavior:**
- If IndexedDB has data: Uses cached data immediately
- If IndexedDB is empty: Fetches from GitHub and caches
- Throws error if both cache and network fail

### Word Retrieval

#### `getWordById(id: string): Promise<Word|null>`

Retrieves a word by its ID.

```javascript
const word = await wordService.getWordById('word-1');
console.log(word);
// { id: "word-1", word: "the", variants: [...] }
```

**Parameters:**
- `id` - Word ID in format "word-{number}"

**Returns:** Word object or null if not found

**Throws:**
- `DatabaseNotReadyError` - If database not initialized
- `InvalidWordIdError` - If ID format is invalid

#### `getWordByText(text: string): Promise<Word|null>`

Retrieves a word by its text (case-insensitive).

```javascript
const word = await wordService.getWordByText('Hello');
console.log(word.word); // "hello"
```

**Parameters:**
- `text` - Word text (any case)

**Returns:** Word object or null if not found

**Example:**
```javascript
// User input handling
async function lookupWord(userInput) {
  const word = await wordService.getWordByText(userInput.trim());
  
  if (!word) {
    return { error: 'Word not found' };
  }
  
  return {
    word: word.word,
    ipa: word.variants?.[0]?.ipa || 'N/A'
  };
}
```

### Search

#### `searchWords(prefix: string, limit?: number): Promise<Word[]>`

Searches for words starting with the given prefix.

```javascript
const results = await wordService.searchWords('th', 10);
// [
//   { word: "the", ... },
//   { word: "that", ... },
//   { word: "this", ... },
//   ...
// ]
```

**Parameters:**
- `prefix` - Search prefix (case-insensitive)
- `limit` - Maximum results (default: 20)

**Returns:** Array of matching words

**Example - Search Input:**
```javascript
function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  useEffect(() => {
    if (query.length >= 2) {
      wordService.searchWords(query, 10).then(setResults);
    } else {
      setResults([]);
    }
  }, [query]);
  
  return (
    <div>
      <input 
        value={query} 
        onChange={e => setQuery(e.target.value)}
        placeholder="Search words..."
      />
      <ul>
        {results.map(word => (
          <li key={word.id}>{word.word}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Random Word Selection

#### `getRandomWord(filter?: FilterOptions): Promise<Word|null>`

Returns a random word for practice. Automatically filters out words without IPA.

```javascript
// Any random word with IPA
const word = await wordService.getRandomWord();

// Random word with difficulty filter
const easyWord = await wordService.getRandomWord({ difficulty: 'easy' });
const hardWord = await wordService.getRandomWord({ difficulty: 'hard' });
```

**Parameters:**
- `filter` (optional):
  - `difficulty`: 'easy' | 'medium' | 'hard'

**Returns:** Random word object or null if no matches

**Example - Practice Mode:**
```javascript
function PracticePage() {
  const [currentWord, setCurrentWord] = useState(null);
  
  async function nextWord() {
    const word = await wordService.getRandomWord();
    setCurrentWord(word);
  }
  
  return (
    <div>
      {currentWord && (
        <>
          <h1>{currentWord.word}</h1>
          <p>IPA: {currentWord.variants[0].ipa}</p>
          <button onClick={nextWord}>Next Word</button>
        </>
      )}
    </div>
  );
}
```

### IPA Access

#### `getWordIpa(wordId: string, options?: { all?: boolean }): Promise<string|string[]|null>`

Gets the IPA pronunciation for a word.

```javascript
// Primary pronunciation only
const ipa = await wordService.getWordIpa('word-1');
console.log(ipa); // "/ˈðə/"

// All pronunciations
const allIpa = await wordService.getWordIpa('word-1', { all: true });
console.log(allIpa); // ["/ˈðə/", "/ðə/", "/ði/"]
```

**Parameters:**
- `wordId` - Word ID
- `options.all` - If true, returns all variants

**Returns:**
- Single IPA string (default)
- Array of IPA strings (if `all: true`)
- null (if word not found or no IPA)

## Data Types

### Word Object

```typescript
interface Word {
  id: string;           // "word-1"
  word: string;         // "hello"
  variants: Variant[] | null;
}

interface Variant {
  ipa: string;          // "/həˈloʊ/"
}
```

### Error Types

```typescript
class DatabaseNotReadyError extends Error {
  code: 'DB_NOT_READY';
  message: 'Database not initialized. Please wait for sync to complete.';
}

class InvalidWordIdError extends Error {
  code: 'INVALID_WORD_ID';
  message: 'Invalid word ID format';
}
```

## Usage Examples

### Basic Word Display

```javascript
import wordService from './services/wordService';

function WordCard({ wordId }) {
  const [word, setWord] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    wordService.getWordById(wordId)
      .then(setWord)
      .finally(() => setLoading(false));
  }, [wordId]);
  
  if (loading) return <div>Loading...</div>;
  if (!word) return <div>Word not found</div>;
  
  return (
    <div className="word-card">
      <h2>{word.word}</h2>
      <p className="ipa">{word.variants?.[0]?.ipa}</p>
    </div>
  );
}
```

### Practice Session

```javascript
function PracticeSession() {
  const [currentWord, setCurrentWord] = useState(null);
  const [score, setScore] = useState(0);
  
  async function loadNextWord() {
    const word = await wordService.getRandomWord();
    setCurrentWord(word);
  }
  
  function handlePronunciation(result) {
    if (result.accuracy > 0.7) {
      setScore(s => s + 1);
    }
    loadNextWord();
  }
  
  useEffect(() => {
    loadNextWord();
  }, []);
  
  if (!currentWord) return <div>Loading...</div>;
  
  return (
    <div>
      <div>Score: {score}</div>
      <WordDisplay word={currentWord} />
      <PronunciationRecorder 
        targetWord={currentWord.word}
        targetIpa={currentWord.variants[0].ipa}
        onResult={handlePronunciation}
      />
    </div>
  );
}
```

### Word Search with Autocomplete

```javascript
function WordSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        const results = await wordService.searchWords(query, 5);
        setSuggestions(results);
      } else {
        setSuggestions([]);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query]);
  
  async function selectWord(word) {
    const fullWord = await wordService.getWordById(word.id);
    setSelected(fullWord);
    setQuery(word.word);
    setSuggestions([]);
  }
  
  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search for a word..."
      />
      
      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map(word => (
            <li key={word.id} onClick={() => selectWord(word)}>
              {word.word}
            </li>
          ))}
        </ul>
      )}
      
      {selected && (
        <div className="word-details">
          <h3>{selected.word}</h3>
          <p>IPA: {selected.variants?.map(v => v.ipa).join(', ')}</p>
        </div>
      )}
    </div>
  );
}
```

## Error Handling

### Service-Level Error Handling

```javascript
// wordService.js handles common errors
class WordService {
  async getWordById(id) {
    if (!this.db) {
      throw new DatabaseNotReadyError();
    }
    
    if (!/^word-\d+$/.test(id)) {
      throw new InvalidWordIdError();
    }
    
    // ... implementation
  }
}
```

### Component-Level Error Handling

```javascript
function SafeWordDisplay({ wordId }) {
  const [word, setWord] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    wordService.getWordById(wordId)
      .then(setWord)
      .catch(err => {
        if (err.code === 'DB_NOT_READY') {
          setError('Database is loading. Please wait...');
        } else if (err.code === 'INVALID_WORD_ID') {
          setError('Invalid word ID');
        } else {
          setError('Failed to load word');
        }
      });
  }, [wordId]);
  
  if (error) return <div className="error">{error}</div>;
  if (!word) return <div>Loading...</div>;
  
  return <WordCard word={word} />;
}
```

## Initialization Flow

### App Startup

```javascript
// main.jsx or App.jsx
import wordService from './services/wordService';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    wordService.initialize()
      .then(() => setIsReady(true))
      .catch(err => setError(err.message));
  }, []);
  
  if (error) {
    return <ErrorScreen message={error} />;
  }
  
  if (!isReady) {
    return <LoadingScreen message="Loading word database..." />;
  }
  
  return <Router />;
}
```

### Loading States

```javascript
function LoadingScreen({ message }) {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>{message}</p>
      <p className="hint">This may take a moment on first load</p>
    </div>
  );
}
```

## Migration from Hardcoded Array

If you're migrating from a hardcoded word array:

### Before (Hardcoded)

```javascript
// wordService.js (old)
const words = ['the', 'of', 'and', 'to', 'a', ...]; // 3000 words

export function getRandomWord() {
  return words[Math.floor(Math.random() * words.length)];
}
```

### After (IndexedDB)

```javascript
// wordService.js (new)
class WordService {
  async getRandomWord() {
    const word = await this.db.getRandomWord();
    return word?.word || null;
  }
}

export default new WordService();
```

### Migration Checklist

1. ✅ Replace hardcoded array with service calls
2. ✅ Add `await` to all service methods (they're now async)
3. ✅ Add loading states for async operations
4. ✅ Handle null returns (word not found)
5. ✅ Update tests to mock service instead of array
6. ✅ Add error boundaries for database failures

## Best Practices

1. **Always await** - All service methods are async
2. **Handle nulls** - Words may not be found
3. **Show loading states** - Database operations take time
4. **Cache results** - Don't fetch the same word repeatedly
5. **Use error boundaries** - Wrap components that use the service
6. **Debounce searches** - Don't search on every keystroke
7. **Filter by IPA** - Use `getRandomWord()` which filters automatically

## Testing

### Mocking the Service

```javascript
// __mocks__/wordService.js
export default {
  initialize: jest.fn().mockResolvedValue(),
  getWordById: jest.fn().mockResolvedValue({
    id: 'word-1',
    word: 'hello',
    variants: [{ ipa: '/həˈloʊ/' }]
  }),
  getRandomWord: jest.fn().mockResolvedValue({
    id: 'word-1',
    word: 'hello',
    variants: [{ ipa: '/həˈloʊ/' }]
  })
};
```

### Testing Components

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import wordService from './services/wordService';

jest.mock('./services/wordService');

test('displays word', async () => {
  wordService.getWordById.mockResolvedValue({
    id: 'word-1',
    word: 'hello',
    variants: [{ ipa: '/həˈloʊ/' }]
  });
  
  render(<WordCard wordId="word-1" />);
  
  await waitFor(() => {
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
```

See the [structure.md](./structure.md) for database format details and [indexeddb.md](./indexeddb.md) for IndexedDB implementation.
