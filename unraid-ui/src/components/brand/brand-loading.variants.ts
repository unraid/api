import { cva } from 'class-variance-authority';

export const brandLoadingVariants = cva('inline-flex items-center justify-center w-full h-full aspect-[7/4]', {
  variants: {
    variant: {
      default: '',
      black: 'text-black fill-black',
      white: 'text-white fill-white',
    },
    size: {
      sm: 'w-12',
      md: 'w-16',
      lg: 'w-20',
      full: 'w-full',
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
