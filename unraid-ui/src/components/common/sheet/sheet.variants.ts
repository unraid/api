import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

export const sheetVariants = cva(
  // Animate ONLY via the transform/opacity keyframes (animate-in/out). The panel is
  // promoted to its own compositor layer (will-change-transform) so the slide runs
  // off the main thread and is not stalled by the panel's contents mounting. We do
  // NOT add a blanket `transition` here: it would transition every property
  // (box-shadow, filter, …) alongside the keyframe and cause per-frame repaints.
  'fixed z-50 bg-background gap-4 shadow-lg border-border will-change-transform data-[state=open]:animate-in data-[state=open]:duration-300 data-[state=open]:ease-out data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=closed]:ease-in',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        right:
          'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
      },
      padding: {
        none: '',
        sm: 'p-2',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      side: 'right',
      padding: 'md',
    },
  }
);

export type SheetVariants = VariantProps<typeof sheetVariants>;
