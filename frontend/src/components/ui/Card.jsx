import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

const Card = forwardRef(function Card({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-card',
        className,
      )}
      {...props}
    />
  );
});

export default Card;
