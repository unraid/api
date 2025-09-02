import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-base font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        header:
          'group relative flex flex-row items-center text-base border-0 text-header-text-primary bg-transparent hover:bg-accent/20 focus-visible:bg-accent/20 focus-visible:ring-1 focus-visible:ring-accent/20 focus-visible:ring-offset-0 rounded-lg min-h-[36px]',
        'pill-orange': 'bg-orange text-white hover:bg-orange-dark rounded-full text-xs px-2 py-1 gap-1',
        'pill-gray': 'bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-full text-xs px-2 py-1 gap-1',
      },
      size: {
        sm: 'rounded-md px-3 py-1',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
        header: 'h-10 px-2 py-6',
        'header-icon': 'h-9 w-9 p-2',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
