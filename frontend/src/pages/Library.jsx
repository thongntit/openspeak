import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, ArrowLeft, Settings, Languages, BookOpen, Lightbulb, ChevronRight, CreditCard } from 'lucide-react';
import { cn } from '@/lib/cn';
import Card from '@/components/ui/Card';
import DeckRow from '@/components/DeckRow';
import TypeChip from '@/components/ui/TypeChip';
import { DECKS, CARDS, CARD_TYPE } from '@/data/srsData';

const TYPE_ICONS_LG = {
  vocab: <Languages size={26} strokeWidth={1.8} />,
  grammar: <BookOpen size={26} strokeWidth={1.8} />,
  tip: <Lightbulb size={26} strokeWidth={1.8} />,
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'vocab', label: 'Vocabulary' },
  { id: 'grammar', label: 'Grammar' },
  { id: 'tip', label: 'Tips' },
];

export default function Library() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [filter, setFilter] = useState('all');
  const [selectedDeck, setSelectedDeck] = useState(null);

  useEffect(() => {
    if (state?.openDeckId) {
      const deck = DECKS.find((d) => d.id === state.openDeckId);
      if (deck) setSelectedDeck(deck);
    }
  }, [state?.openDeckId]);

  if (selectedDeck) {
    return (
      <DeckDetail
        deck={selectedDeck}
        onBack={() => setSelectedDeck(null)}
        onStartReview={(queue) => navigate('/review', { state: { queue } })}
      />
    );
  }

  const filtered = filter === 'all' ? DECKS : DECKS.filter((d) => d.type === filter);

  return (
    <div className="animate-screen-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="text-[22px] font-extrabold tracking-tight text-[var(--text-1)]">Library</div>
        <div className="flex gap-1.5">
          <button
            type="button"
            aria-label="Search"
            className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-1)]"
          >
            <Search size={18} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label="Create deck"
            className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-1)]"
          >
            <Plus size={18} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {/* Segmented filter */}
      <div className="px-4 mb-4 overflow-auto">
        <div className="inline-flex p-1 gap-0 bg-[var(--bg-app)] border border-[var(--border-soft)] rounded-xl">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                'px-3.5 py-[7px] rounded-[9px] text-[13px] font-semibold cursor-pointer transition-all',
                filter === f.id
                  ? 'bg-[var(--bg-card)] text-[var(--text-1)] shadow-sm'
                  : 'text-[var(--text-2)]',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Deck list */}
      <div className="px-4 mb-4">
        <Card className="overflow-hidden">
          {filtered.map((d) => (
            <DeckRow key={d.id} deck={d} onClick={() => setSelectedDeck(d)} />
          ))}
        </Card>
      </div>

      {/* Create deck CTA */}
      <div className="px-4 pb-4">
        <Card
          className="flex items-center gap-3.5 p-[18px] cursor-pointer border-dashed"
        >
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-app)] text-[var(--text-2)]">
            <Plus size={20} strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-bold text-[var(--text-1)]">Create a deck</div>
            <div className="text-[12px] text-[var(--text-2)] mt-0.5">Vocab, grammar, or your own notes</div>
          </div>
          <ChevronRight size={16} className="text-[var(--text-2)]" />
        </Card>
      </div>
    </div>
  );
}

function DeckDetail({ deck, onBack, onStartReview }) {
  const meta = CARD_TYPE[deck.type];
  const cards = CARDS.filter((c) => c.deckId === deck.id);
  const pct = Math.round((deck.mastered / deck.total) * 100);

  const handleStartDeck = () => {
    const deckCards = CARDS.filter((c) => c.deckId === deck.id).slice(0, deck.due);
    if (deckCards.length) onStartReview(deckCards);
    else onStartReview([]);
  };

  return (
    <div className="animate-screen-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-1)]"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label="Deck settings"
          className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--bg-card)] text-[var(--text-1)]"
        >
          <Settings size={18} strokeWidth={1.8} />
        </button>
      </header>

      {/* Deck info */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-3.5 mb-3">
          <div
            className="inline-flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[16px]"
            style={{ background: meta.color + '18', color: meta.color }}
          >
            {TYPE_ICONS_LG[deck.type]}
          </div>
          <div className="flex-1 min-w-0">
            <TypeChip type={deck.type} />
            <div className="text-[22px] font-extrabold tracking-tight text-[var(--text-1)] mt-1.5 leading-[1.15]">
              {deck.name}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-3.5">
          <MiniStat value={deck.due} label="Due" color={deck.due > 0 ? '#be123c' : null} />
          <MiniStat value={deck.learning} label="Learning" color="#b45309" />
          <MiniStat value={deck.mastered} label="Mastered" color="#078838" />
        </div>

        {/* Progress */}
        <div className="mb-3.5">
          <div className="flex justify-between text-[12px] mb-1.5">
            <span className="font-semibold text-[var(--text-1)]">{deck.mastered}/{deck.total} mastered</span>
            <span className="text-[var(--text-2)]">{pct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[var(--border-soft)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: pct + '%', background: deck.accent }}
            />
          </div>
        </div>

        <button
          type="button"
          disabled={deck.due === 0}
          onClick={handleStartDeck}
          className={cn(
            'flex w-full h-12 items-center justify-center gap-2 rounded-xl font-semibold text-[15px] transition-all',
            deck.due > 0
              ? 'bg-[var(--primary-hex)] text-white active:scale-[0.98]'
              : 'bg-[var(--bg-app)] text-[var(--text-2)] cursor-not-allowed',
          )}
        >
          <CreditCard size={18} strokeWidth={1.8} />
          {deck.due > 0 ? `Review ${deck.due} cards` : 'All caught up'}
        </button>
      </div>

      {/* Card list */}
      <div className="flex items-center justify-between px-5 mb-2.5">
        <span className="text-[12px] font-bold uppercase tracking-eyebrow text-[var(--text-2)]">
          Cards in this deck ({cards.length})
        </span>
      </div>
      <div className="px-4 pb-4">
        <Card className="overflow-hidden">
          {cards.length === 0 ? (
            <div className="p-7 text-center text-[13px] text-[var(--text-2)]">
              Cards in this deck aren't loaded in this prototype.
            </div>
          ) : (
            cards.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-soft)] last:border-b-0"
              >
                <div
                  className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
                  style={{ background: meta.color + '12', color: meta.color }}
                >
                  {TYPE_ICONS_LG[c.type] ?? null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold tracking-snug text-[var(--text-1)] truncate">
                    {c.front.split('\n')[0]}
                  </div>
                  {c.ipa && (
                    <div className="font-mono text-[11px] text-[var(--text-2)] mt-0.5">{c.ipa}</div>
                  )}
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-[0.04em]"
                  style={
                    c.stage === 'review'
                      ? { background: 'rgba(7,136,56,.10)', color: '#078838' }
                      : { background: 'rgba(180,83,9,.10)', color: '#b45309' }
                  }
                >
                  {c.stage}
                </span>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ value, label, color }) {
  return (
    <Card className="px-3 py-3.5 text-center">
      <div
        className="text-[22px] font-extrabold tracking-tight"
        style={{ color: color || 'var(--text-1)' }}
      >
        {value}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-eyebrow text-[var(--text-2)] mt-0.5">
        {label}
      </div>
    </Card>
  );
}
