import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// Các variant màu bám theo bảng màu thương hiệu Terra Việt (xem src/styles/variables.css)
// thay cho token xám mặc định của shadcn — giữ đúng 4 kiểu nút đã dùng trong site
// (forest đặc, brick đặc, forest viền, gold viền) nhưng chuyển sang component Tailwind dùng chung.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] text-[.85rem] font-bold tracking-[.02em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: 'bg-[var(--forest)] text-[var(--white)] hover:bg-[var(--forest-2)] hover:-translate-y-0.5',
        brick: 'bg-[var(--brick)] text-[var(--white)] hover:bg-[var(--color-normal-brown-dark)] hover:-translate-y-0.5',
        outline:
          'bg-transparent text-[var(--forest)] border-[1.5px] border-[var(--forest)] hover:bg-[var(--forest)] hover:text-[var(--white)]',
        gold: 'bg-transparent text-[var(--gold)] border-[1.5px] border-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--white)]',
        secondary: 'bg-[var(--canvas)] text-[var(--ink)] hover:bg-[var(--mist)]',
        ghost: 'bg-transparent text-[var(--fg)] hover:bg-black/5',
        link: 'text-[var(--forest)] underline-offset-4 hover:underline',
        destructive: 'bg-[var(--color-red)] text-white hover:bg-[var(--color-red)]/90',
      },
      size: {
        default: 'h-auto px-[22px] py-[12px]',
        sm: 'h-auto px-4 py-2 text-xs',
        lg: 'h-auto px-8 py-[16px] text-base',
        icon: 'size-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
