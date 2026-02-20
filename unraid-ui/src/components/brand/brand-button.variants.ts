import { cva, type VariantProps } from 'class-variance-authority';

export const brandButtonVariants = cva(
  'group text-center font-semibold leading-none relative z-0 flex flex-row items-center justify-center border-2 border-solid shadow-none cursor-pointer rounded-md hover:shadow-md focus:shadow-md disabled:opacity-25 disabled:hover:opacity-25 disabled:focus:opacity-25 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        fill: '[&]:text-white bg-transparent border-transparent',
        'pill-orange':
          'text-white bg-orange border-transparent rounded-full hover:bg-orange-dark focus:bg-orange-dark',
        'pill-gray':
          'text-gray-800 bg-gray-200 border-transparent rounded-full hover:bg-gray-300 focus:bg-gray-300',
        black:
          '[&]:text-white bg-black border-black transition hover:text-black focus:text-black hover:bg-grey focus:bg-grey hover:border-grey focus:border-grey',
        gray: 'text-black bg-grey transition hover:text-white focus:text-white hover:bg-grey-mid focus:bg-grey-mid hover:border-grey-mid focus:border-grey-mid',
        outline: '[&]:text-orange bg-transparent border-orange hover:!text-white focus:!text-white',
        'outline-primary':
          'text-orange [&]:text-orange uppercase tracking-widest bg-transparent border-orange rounded-sm hover:!text-white focus:!text-white',
        'outline-black':
          'text-black bg-transparent border-black hover:text-black focus:text-black hover:bg-grey focus:bg-grey hover:border-grey focus:border-grey',
        'outline-white':
          'text-white bg-transparent border-white hover:text-black focus:text-black hover:bg-white focus:bg-white',
        underline:
          'opacity-75 underline border-transparent transition hover:text-primary hover:bg-muted hover:border-muted focus:text-primary focus:bg-muted focus:border-muted hover:opacity-100 focus:opacity-100',
        'underline-hover-red':
          'opacity-75 underline border-transparent transition hover:text-white hover:bg-unraid-red hover:border-unraid-red focus:text-white focus:bg-unraid-red focus:border-unraid-red hover:opacity-100 focus:opacity-100',
        white: 'text-black bg-white transition hover:bg-grey focus:bg-grey',
        muted:
          'bg-muted border-muted text-muted-foreground font-medium transition hover:text-foreground hover:bg-muted/80 focus:text-foreground focus:bg-muted/80',
        none: 'border-transparent hover:shadow-none focus:shadow-none',
      },
      size: {
        '12px': 'text-xs gap-1',
        '14px': 'text-sm gap-2',
        '16px': 'text-base gap-2',
        '18px': 'text-lg gap-2',
        '20px': 'text-xl gap-2',
        '24px': 'text-2xl gap-2',
      },
      padding: {
        default: '',
        none: 'p-0',
        lean: 'px-4 py-2',
      },
    },
    compoundVariants: [
      {
        size: '12px',
        padding: 'default',
        class: 'p-2',
      },
      {
        size: '14px',
        padding: 'default',
        class: 'p-2',
      },
      {
        size: '16px',
        padding: 'default',
        class: 'p-3',
      },
      {
        size: '18px',
        padding: 'default',
        class: 'p-3',
      },
      {
        size: '20px',
        padding: 'default',
        class: 'p-4',
      },
      {
        size: '24px',
        padding: 'default',
        class: 'p-4',
      },
    ],
    defaultVariants: {
      variant: 'fill',
      size: '16px',
      padding: 'default',
    },
  }
);

export type BrandButtonVariants = VariantProps<typeof brandButtonVariants>;
