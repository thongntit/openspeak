import { Languages, BookOpen, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/cn';
import { CARD_TYPE } from '@/data/srsData';

const TYPE_ICONS = {
  vocab: <Languages size={20} strokeWidth={1.8} />,
  grammar: <BookOpen size={20} strokeWidth={1.8} />,
  tip: <Lightbulb size={20} strokeWidth={1.8} />,
};

export default function DeckRow({ deck, onClick }) {
  const meta = CARD_TYPE[deck.type];
  const pct = Math.round((deck.mastered / deck.total) * 100);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-3.5 text-left',
        'border-b border-[var(--border-soft)] last:border-b-0',
        'active:bg-black/[0.02] dark:active:bg-white/[0.03] transition-colors',
      )}
    >
      <span
        className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[13px]"
        style={{ background: meta.color + '18', color: meta.color }}
      >
        {TYPE_ICONS[deck.type]}
      </span>

      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-bold tracking-snug text-[var(--text-1)] truncate">
          {deck.name}
        </span>
        <span className="block text-xs text-[var(--text-2)] mt-0.5">
          {deck.mastered}/{deck.total} mastered · {deck.learning} learning
        </span>
        <span className="block w-full h-1 rounded-full bg-[var(--border-soft)] overflow-hidden mt-1.5">
          <span
            className="block h-full rounded-full transition-all duration-500"
            style={{ width: pct + '%', background: deck.accent }}
          />
        </span>
      </span>

      <span
        className={cn(
          'inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0',
          deck.due > 0
            ? 'bg-[rgba(190,18,60,.10)] text-[#be123c] dark:bg-[rgba(244,63,94,.18)] dark:text-[#fb7185]'
            : 'bg-[var(--bg-app)] text-[var(--text-2)]',
        )}
      >
        {deck.due > 0 ? `${deck.due} due` : 'done'}
      </span>
    </button>
  );
}
