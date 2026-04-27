import { cva } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import { LEVEL_LABEL } from '@/lib/levels';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-[3px] rounded-full tracking-wide',
  {
    variants: {
      level: {
        beg: 'bg-[rgba(7,136,56,0.10)] text-[#078838] dark:bg-[rgba(34,197,94,0.15)] dark:text-[#4ade80]',
        int: 'bg-[rgba(217,119,6,0.10)] text-[#b45309] dark:bg-[rgba(245,158,11,0.15)] dark:text-[#fbbf24]',
        adv: 'bg-[rgba(190,18,60,0.10)] text-[#be123c] dark:bg-[rgba(244,63,94,0.15)] dark:text-[#fb7185]',
        primary: 'bg-[var(--primary-hex)] text-white',
      },
    },
    defaultVariants: {
      level: 'beg',
    },
  },
);

export default function Badge({ className, level, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ level }), className)} {...props}>
      {children ?? LEVEL_LABEL[level]}
    </span>
  );
}
