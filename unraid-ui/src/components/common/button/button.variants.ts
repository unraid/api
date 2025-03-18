import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        brand:
          'bg-gradient-to-r from-unraid-red to-orange text-white opacity-100 transition-all hover:opacity-60 focus:opacity-60',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input border-2 bg-transparent hover:bg-accent hover:text-accent-foreground',
        'outline-brand':
          'text-orange bg-transparent border-orange border-2 hover:text-white focus:text-white hover:bg-gradient-to-r hover:from-unraid-red hover:to-orange hover:text-white hover:bg-gradient-to-r hover:from-unraid-red hover:to-orange transition-[background,color,opacity] duration-300 ease-in-out rounded-md hover:opacity-100 focus:opacity-100',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 rounded-md px-3',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
