import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-unraid-red to-orange text-white opacity-100 transition-all hover:opacity-60 focus:opacity-60',
        secondary:
          'text-orange bg-transparent border-orange border-2 hover:text-white focus:text-white hover:bg-gradient-to-r hover:from-unraid-red hover:to-orange hover:text-white hover:bg-gradient-to-r hover:from-unraid-red hover:to-orange transition-[background,color,opacity] duration-300 ease-in-out rounded-md hover:opacity-100 focus:opacity-100',
        link: 'text-black underline-offset-4 hover:underline',
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
