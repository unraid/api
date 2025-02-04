import { cva } from 'class-variance-authority';

export const brandLoadingVariants = cva('inline-flex items-center justify-center w-full h-full', {
  variants: {
    variant: {
      default: '',
      black: 'text-black fill-black',
      white: 'text-white fill-white',
    },
    size: {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export const markAnimations = {
  mark_2_4: 'animate-mark-2',
  mark_3: 'animate-mark-3',
  mark_6_8: 'animate-mark-6',
  mark_7: 'animate-mark-7',
};
