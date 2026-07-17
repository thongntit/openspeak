import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import LibraryDeckDetail from '@/components/LibraryDeckDetail';
import LibraryDeckRow from '@/components/LibraryDeckRow';
import { filterLibraryDecks, loadAllContentDecks } from '@/lib/libraryContent';
import { ApiError, getContentDecks } from '@/services/openspeakApi';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'vocab', label: 'Vocabulary' },
  { id: 'grammar', label: 'Grammar' },
  { id: 'tip', label: 'Tips' },
];

export default function Library() {
  const { getToken } = useAuth();
  const [decks, setDecks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDecks() {
      setStatus('loading');
      setError(null);
      try {
        const token = await getToken();
        if (!token) {
          throw new ApiError(401, { message: 'Authentication required' }, '/content/decks');
        }
        const nextDecks = await loadAllContentDecks((params) => (
          getContentDecks(params, { token, signal: controller.signal })
        ));
        if (!controller.signal.aborted) {
          setDecks(nextDecks);
          setStatus('success');
        }
      } catch (requestError) {
        if (requestError.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setError(requestError.status === 401
            ? 'Your session expired. Please sign in again.'
            : 'Library is unavailable right now.');
          setStatus('error');
        }
      }
    }

    loadDecks();
    return () => controller.abort();
  }, [getToken, retryKey]);

  if (selectedDeck) {
    return (
      <LibraryDeckDetail
        deck={selectedDeck}
        getToken={getToken}
        onBack={() => setSelectedDeck(null)}
      />
    );
  }

  const filteredDecks = filterLibraryDecks(decks, filter);

  return (
    <div className="animate-screen-fade-in">
      <header className="px-5 pb-3 pt-4">
        <h1 className="text-[22px] font-extrabold tracking-tight text-[var(--text-1)]">Library</h1>
      </header>

      <div className="mb-4 overflow-auto px-4">
        <div className="inline-flex gap-0 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-app)] p-1">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                'min-h-11 rounded-[9px] px-3.5 py-[7px] text-[13px] font-semibold transition-all',
                filter === item.id
                  ? 'bg-[var(--bg-card)] text-[var(--text-1)] shadow-sm'
                  : 'text-[var(--text-2)]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4">
        <Card className="overflow-hidden">
          {status === 'loading' && (
            <div className="p-7 text-center text-[13px] text-[var(--text-2)]">Loading learning decks…</div>
          )}
          {status === 'error' && (
            <LibraryMessage message={error} onRetry={() => setRetryKey((value) => value + 1)} />
          )}
          {status === 'success' && filteredDecks.length === 0 && (
            <LibraryMessage
              message="No published learning decks are available."
              onRetry={() => setRetryKey((value) => value + 1)}
            />
          )}
          {status === 'success' && filteredDecks.map((deck) => (
            <LibraryDeckRow key={deck.id} deck={deck} onClick={() => setSelectedDeck(deck)} />
          ))}
        </Card>
      </div>
    </div>
  );
}

function LibraryMessage({ message, onRetry }) {
  return (
    <div className="p-7 text-center text-[13px] text-[var(--text-2)]">
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 min-h-11 rounded-xl bg-[var(--primary-hex)] px-4 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
