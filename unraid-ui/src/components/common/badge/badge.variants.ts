import { cva, VariantProps } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full font-semibold leading-none transition-all duration-200 ease-in-out unraid-ui-badge-test',
  {
    variants: {
      variant: {
        red: 'bg-unraid-red text-white hover:bg-orange-dark',
        yellow: 'bg-yellow-100 text-black hover:bg-yellow-200',
        green: 'bg-green-200 text-green-800 hover:bg-green-300',
        orange: 'bg-orange text-white hover:bg-orange-dark',
        transparent: 'bg-transparent text-black hover:bg-gray-100',
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
