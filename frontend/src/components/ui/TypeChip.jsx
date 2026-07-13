import { BookOpen, Languages, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/cn';
import { CARD_TYPE } from '@/data/srsData';

const ICON_MAP = {
  vocab: Languages,
  grammar: BookOpen,
  tip: Lightbulb,
};

const COLOR_CLASS = {
  vocab: 'bg-[rgba(19,127,236,.10)] text-[#137fec] dark:bg-[rgba(96,165,250,.15)] dark:text-[#60a5fa]',
  grammar: 'bg-[rgba(124,58,237,.10)] text-[#7c3aed] dark:bg-[rgba(167,139,250,.15)] dark:text-[#a78bfa]',
  tip: 'bg-[rgba(234,88,12,.10)] text-[#ea580c] dark:bg-[rgba(251,146,60,.15)] dark:text-[#fb923c]',
};

export default function TypeChip({ type, size = 'sm', className }) {
  const meta = CARD_TYPE[type];
  if (!meta) return null;
  const Icon = ICON_MAP[type];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
        'text-[11px] font-bold tracking-[0.02em]',
        COLOR_CLASS[type],
        className,
      )}
    >
      {Icon && <Icon size={size === 'sm' ? 12 : 14} strokeWidth={2} />}
      {meta.label}
    </span>
  );
}
