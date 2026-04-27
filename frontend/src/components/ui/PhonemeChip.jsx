import { cva } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import { bandClass } from '@/lib/score';

const chipVariants = cva(
  'inline-flex flex-col items-center gap-1 px-2.5 py-2 min-w-[44px] rounded-xl font-mono text-sm font-semibold border transition-transform',
  {
    variants: {
      band: {
        good: 'bg-[rgba(7,136,56,0.08)] text-[#078838] border-[rgba(7,136,56,0.2)] dark:bg-[rgba(34,197,94,0.12)] dark:text-[#4ade80] dark:border-[rgba(34,197,94,0.3)]',
        mid: 'bg-[rgba(217,119,6,0.08)] text-[#b45309] border-[rgba(217,119,6,0.25)] dark:bg-[rgba(245,158,11,0.12)] dark:text-[#fbbf24] dark:border-[rgba(245,158,11,0.3)]',
        bad: 'bg-[rgba(190,18,60,0.08)] text-[#be123c] border-[rgba(190,18,60,0.25)] dark:bg-[rgba(244,63,94,0.12)] dark:text-[#fb7185] dark:border-[rgba(244,63,94,0.3)]',
        idle: 'bg-[var(--bg-app)] text-[var(--text-2)] border-[var(--border-soft)]',
      },
    },
    defaultVariants: {
      band: 'idle',
    },
  },
);

export default function PhonemeChip({ phoneme, score, band, className, ...props }) {
  const resolved = band ?? bandClass(score);
  return (
    <div className={cn(chipVariants({ band: resolved }), className)} {...props}>
      {phoneme && <span>{phoneme}</span>}
      {score != null && (
        <span className="text-[10px] font-bold opacity-85">{Math.round(score)}</span>
      )}
    </div>
  );
}
