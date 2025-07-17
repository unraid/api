import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full font-semibold leading-none transition-all duration-200 ease-in-out unraid-ui-badge-test',
  {
    variants: {
      variant: {
        red: 'bg-unraid-red text-white hover:bg-orange-dark',
        yellow: 'bg-yellow-100 text-black hover:bg-yellow-200',
        green: 'bg-green-200 text-green-800 hover:bg-green-300',
        blue: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
        indigo: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
        purple: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
        pink: 'bg-pink-100 text-pink-800 hover:bg-pink-200',
        orange: 'bg-orange text-white hover:bg-orange-dark',
        black: 'bg-black text-white hover:bg-gray-800',
        white: 'bg-white text-black hover:bg-gray-100',
        transparent: 'bg-transparent text-black hover:bg-gray-100',
        current: 'bg-current text-current hover:bg-gray-100',
        gray: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        custom: '',
      },
      size: {
        xs: 'text-xs px-2 py-1 gap-1',
        sm: 'text-sm px-2 py-1 gap-2',
        md: 'text-base px-3 py-2 gap-2',
        lg: 'text-lg px-3 py-2 gap-2',
        xl: 'text-xl px-4 py-3 gap-2',
        '2xl': 'text-2xl px-4 py-3 gap-2',
      },
    },
    defaultVariants: {
      variant: 'gray',
      size: 'md',
    },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
