// IndexedDB service for word database storage
// Provides low-level database operations for the word service

const DB_NAME = 'OpenSpeakDB';
const DB_VERSION = 1;
const STORE_NAME = 'words';

/**
 * Open the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('Failed to open database:', request.error);
      reject(new Error('Failed to open database: ' + request.error?.message));
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create words object store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        
        // Create index on word field for text-based lookups
        store.createIndex('word', 'word', { unique: false });
        
        console.log('Created words store with word index');
      }
    };
  });
}

/**
 * Clear all words from the database
 * @param {IDBDatabase} db 
 * @returns {Promise<void>}
 */
export function clearWords(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Save words to the database
 * @param {IDBDatabase} db 
 * @param {Array} words 
 * @returns {Promise<number>} Number of words saved
 */
export function saveWords(db, words) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    let saved = 0;
    let errors = [];
    
    // Use a single transaction for all inserts
    words.forEach((word) => {
      const request = store.put(word);
      
      request.onsuccess = () => {
        saved++;
      };
      
      request.onerror = () => {
        errors.push({ word: word.id, error: request.error });
      };
    });
    
    transaction.oncomplete = () => {
      if (errors.length > 0) {
        console.warn(`Saved ${saved} words, ${errors.length} errors:`, errors);
      }
      resolve(saved);
    };
    
    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

/**
 * Get a word by ID
 * @param {IDBDatabase} db 
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
export function getWordById(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a word by text (case-insensitive)
 * @param {IDBDatabase} db 
 * @param {string} text 
 * @returns {Promise<Object|null>}
 */
export function getWordByText(db, text) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('word');
    
    // Case-insensitive search by converting to lowercase
    const request = index.get(text.toLowerCase().trim());
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Search words by prefix
 * @param {IDBDatabase} db 
 * @param {string} prefix 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
export function searchWords(db, prefix, limit = 20) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('word');
    
    const results = [];
    const searchTerm = prefix.toLowerCase().trim();
    
    // Create range for prefix search
    const range = IDBKeyRange.bound(
      searchTerm,
      searchTerm + '\uffff',
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

/**
 * Get all words from the database
 * @param {IDBDatabase} db 
 * @returns {Promise<Array>}
 */
export function getAllWords(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Count total words in the database
 * @param {IDBDatabase} db 
 * @returns {Promise<number>}
 */
export function countWords(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a random word from the database
 * @param {IDBDatabase} db 
 * @param {Function} filter - Optional filter function
 * @returns {Promise<Object|null>}
 */
export async function getRandomWord(db, filter = null) {
  const count = await countWords(db);
  
  if (count === 0) {
    return null;
  }
  
  // Get all words and filter
  const allWords = await getAllWords(db);
  let candidates = allWords;
  
  // Apply filter if provided
  if (filter) {
    candidates = allWords.filter(filter);
  }
  
  // Filter out words without IPA by default
  candidates = candidates.filter(word => word.variants && word.variants.length > 0);
  
  if (candidates.length === 0) {
    return null;
  }
  
  // Return random word
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

/**
 * Check if the database has any words
 * @param {IDBDatabase} db 
 * @returns {Promise<boolean>}
 */
export async function hasWords(db) {
  const count = await countWords(db);
  return count > 0;
}

// Export database configuration
export { DB_NAME, DB_VERSION, STORE_NAME };
