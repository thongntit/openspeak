# IndexedDB Integration

This document describes how to integrate the OpenSpeak word database with IndexedDB for offline storage and fast access.

## Overview

IndexedDB provides a client-side database that persists across browser sessions. It's ideal for storing the word database because:

- **Offline access** - Works without network connection
- **Fast queries** - Indexed lookups for word searches
- **Large storage** - Typically 50-250MB available per origin
- **Structured data** - Perfect for JSON word objects

## Database Schema

### Database Configuration

```javascript
const DB_CONFIG = {
  name: 'OpenSpeakDB',
  version: 1,
  stores: {
    words: {
      keyPath: 'id',
      indexes: [
        { name: 'word', keyPath: 'word', unique: false }
      ]
    }
  }
};
```

### Object Store: words

The `words` store contains all word entries from the database:

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | string | Primary Key | Unique identifier (word-1 to word-3000) |
| `word` | string | Yes | The English word (lowercase) |
| `variants` | array | No | Pronunciation variants or null |

### Index: word

The `word` index enables efficient text-based lookups:

```javascript
// Create index
store.createIndex('word', 'word', { unique: false });

// Query by word
const index = store.index('word');
const request = index.get('hello');
```

## Implementation

### Opening the Database

```javascript
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create words store
      if (!db.objectStoreNames.contains('words')) {
        const store = db.createObjectStore('words', { keyPath: 'id' });
        
        // Create index on word field
        store.createIndex('word', 'word', { unique: false });
      }
    };
  });
}
```

### Storing Words

```javascript
async function saveWords(db, words) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['words'], 'readwrite');
    const store = transaction.objectStore('words');
    
    // Clear existing data
    const clearRequest = store.clear();
    
    clearRequest.onsuccess = () => {
      // Insert all words
      let inserted = 0;
      
      words.forEach((word) => {
        const request = store.add(word);
        
        request.onsuccess = () => {
          inserted++;
          if (inserted === words.length) {
            resolve(inserted);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    };
    
    clearRequest.onerror = () => reject(clearRequest.error);
    transaction.onerror = () => reject(transaction.error);
  });
}
```

### Retrieving Words

#### Get by ID

```javascript
async function getWordById(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['words'], 'readonly');
    const store = transaction.objectStore('words');
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Usage
const word = await getWordById(db, 'word-1');
console.log(word.word); // "the"
```

#### Get by Word Text

```javascript
async function getWordByText(db, text) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['words'], 'readonly');
    const store = transaction.objectStore('words');
    const index = store.index('word');
    
    // Case-insensitive search
    const request = index.get(text.toLowerCase());
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Usage
const word = await getWordByText(db, 'Hello');
console.log(word.word); // "hello"
```

#### Search by Prefix

```javascript
async function searchWords(db, prefix, limit = 20) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['words'], 'readonly');
    const store = transaction.objectStore('words');
    const index = store.index('word');
    
    const results = [];
    const range = IDBKeyRange.bound(
      prefix.toLowerCase(),
      prefix.toLowerCase() + '\uffff',
      false,
      false
    );
    
    const request = index.openCursor(range);
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      
      if (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Usage
const matches = await searchWords(db, 'th', 10);
// Returns: [{word: "the"}, {word: "that"}, {word: "this"}, ...]
```

#### Get All Words

```javascript
async function getAllWords(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['words'], 'readonly');
    const store = transaction.objectStore('words');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
```

### Counting Words

```javascript
async function countWords(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['words'], 'readonly');
    const store = transaction.objectStore('words');
    const request = store.count();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Usage
const count = await countWords(db);
console.log(`Database has ${count} words`); // "Database has 3000 words"
```

## Synchronization

### Full Sync from GitHub

```javascript
async function syncFromGitHub(db, onProgress) {
  const DATABASE_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/openspeak/main/database/words.json';
  
  try {
    // Fetch from GitHub
    const response = await fetch(DATABASE_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate structure
    if (!data.words || !Array.isArray(data.words)) {
      throw new Error('Invalid database format');
    }
    
    // Store in IndexedDB
    const count = await saveWords(db, data.words);
    
    // Store metadata
    localStorage.setItem('dbVersion', data.version);
    localStorage.setItem('dbLastSync', new Date().toISOString());
    localStorage.setItem('dbTotalWords', data.total.toString());
    
    return {
      success: true,
      count: count,
      version: data.version
    };
    
  } catch (error) {
    console.error('Sync failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

### Checking for Updates

```javascript
async function checkForUpdates() {
  const DATABASE_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/openspeak/main/database/words.json';
  const lastETag = localStorage.getItem('dbETag');
  
  try {
    const response = await fetch(DATABASE_URL, { method: 'HEAD' });
    const currentETag = response.headers.get('ETag');
    
    if (lastETag && lastETag !== currentETag) {
      return { hasUpdate: true, etag: currentETag };
    }
    
    return { hasUpdate: false };
    
  } catch (error) {
    console.warn('Update check failed:', error);
    return { hasUpdate: false, error: error.message };
  }
}
```

## Error Handling

### Common Errors

```javascript
async function safeDbOperation(operation) {
  try {
    return await operation();
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded. Please free up space and try again.');
    }
    
    if (error.name === 'VersionError') {
      throw new Error('Database version mismatch. Please refresh the page.');
    }
    
    if (error.name === 'AbortError') {
      throw new Error('Operation was aborted. Please try again.');
    }
    
    throw error;
  }
}
```

### Database Not Ready

```javascript
class DatabaseNotReadyError extends Error {
  constructor() {
    super('Database not initialized. Please wait for sync to complete.');
    this.code = 'DB_NOT_READY';
  }
}

async function requireDatabase(db) {
  const count = await countWords(db);
  if (count === 0) {
    throw new DatabaseNotReadyError();
  }
  return db;
}
```

## Storage Limits

### Browser Quotas

| Browser | Typical Limit |
|---------|---------------|
| Chrome | 60% of available disk space |
| Firefox | 50% of available disk space |
| Safari | 1GB per origin |
| Edge | Same as Chrome |

### Current Usage

The OpenSpeak database uses:
- **Raw JSON:** ~449 KB
- **IndexedDB overhead:** ~50 KB
- **Total:** ~500 KB

This is well within all browser limits.

### Checking Available Space

```javascript
async function checkStorageQuota() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const total = estimate.quota || 0;
    const remaining = total - used;
    
    return {
      used: used,
      total: total,
      remaining: remaining,
      percentUsed: (used / total * 100).toFixed(2)
    };
  }
  
  return null;
}
```

## Performance Tips

### Batch Operations

When inserting many words, use a single transaction:

```javascript
// Good: Single transaction
const transaction = db.transaction(['words'], 'readwrite');
words.forEach(word => transaction.objectStore('words').add(word));

// Bad: Multiple transactions
words.forEach(async word => {
  const transaction = db.transaction(['words'], 'readwrite'); // Don't do this!
  await transaction.objectStore('words').add(word);
});
```

### Index Usage

Always use indexes for queries:

```javascript
// Good: Uses index (fast)
const index = store.index('word');
const result = await index.get('hello');

// Bad: Full scan (slow)
const allWords = await store.getAll();
const result = allWords.find(w => w.word === 'hello');
```

### Connection Pooling

Reuse database connections:

```javascript
let dbPromise = null;

function getDatabase() {
  if (!dbPromise) {
    dbPromise = openDatabase();
  }
  return dbPromise;
}

// Usage
const db = await getDatabase();
```

## Browser Support

IndexedDB is supported in all modern browsers:

- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+
- iOS Safari 10.3+
- Android Chrome 25+

For older browsers, consider using a polyfill or fallback to in-memory storage.

## Complete Service Example

```javascript
class WordDatabase {
  constructor() {
    this.dbPromise = null;
  }
  
  async open() {
    if (!this.dbPromise) {
      this.dbPromise = openDatabase();
    }
    return this.dbPromise;
  }
  
  async sync() {
    const db = await this.open();
    return syncFromGitHub(db);
  }
  
  async getById(id) {
    const db = await this.open();
    return getWordById(db, id);
  }
  
  async getByText(text) {
    const db = await this.open();
    return getWordByText(db, text);
  }
  
  async search(prefix, limit = 20) {
    const db = await this.open();
    return searchWords(db, prefix, limit);
  }
  
  async count() {
    const db = await this.open();
    return countWords(db);
  }
}

// Export singleton
export default new WordDatabase();
```

See [integration.md](./integration.md) for the complete word service implementation.
