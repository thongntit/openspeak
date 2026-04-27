import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold cursor-pointer select-none border border-transparent transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--primary-hex)] text-white hover:bg-[#1175d8]',
        outline: 'bg-[var(--bg-card)] text-[var(--text-1)] border-[var(--border-soft)]',
        ghost: 'bg-transparent text-[var(--text-1)] hover:bg-black/5 dark:hover:bg-white/5',
        icon: 'bg-[var(--bg-card)] border border-[var(--border-soft)] text-[var(--text-1)] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]',
      },
      size: {
        sm: 'h-9 px-3 text-[13px] rounded-xl',
        md: 'h-11 px-4 text-[15px] rounded-xl',
        lg: 'h-16 px-[22px] text-base rounded-[18px]',
        icon: 'w-[38px] h-[38px] rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

const Button = forwardRef(function Button(
  { className, variant, size, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
});

export default Button;
