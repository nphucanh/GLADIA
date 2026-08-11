import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full min-w-0 rounded-[var(--radius)] border-[1.5px] border-[var(--mist)] bg-[var(--canvas)] px-4 py-3 text-[.95rem] text-[var(--ink)] outline-none transition-colors font-['Manrope',sans-serif] placeholder:text-[var(--ink)]/40 focus-visible:border-[var(--forest)] focus-visible:bg-[var(--white)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[var(--color-red)]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
