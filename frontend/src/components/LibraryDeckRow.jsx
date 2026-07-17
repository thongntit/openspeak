import { BookOpen, Languages, Lightbulb } from 'lucide-react';

const TYPE_META = {
  vocab: {
    Icon: Languages,
    color: '#137fec',
  },
  grammar: {
    Icon: BookOpen,
    color: '#7c3aed',
  },
  tip: {
    Icon: Lightbulb,
    color: '#ea580c',
  },
};

export default function LibraryDeckRow({ deck, onClick }) {
  const meta = TYPE_META[deck.type] ?? TYPE_META.vocab;
  const Icon = meta.Icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 w-full items-center gap-3 border-b border-[var(--border-soft)] px-4 py-3 text-left transition-colors last:border-b-0 active:bg-black/[0.02] dark:active:bg-white/[0.03]"
    >
      <span
        className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[13px]"
        style={{ background: `${meta.color}18`, color: meta.color }}
      >
        <Icon size={20} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-[var(--text-1)]">
          {deck.name}
        </span>
        <span className="mt-0.5 block text-xs text-[var(--text-2)]">
          {deck.level} · {deck.cardCount} cards
        </span>
      </span>
    </button>
  );
}
