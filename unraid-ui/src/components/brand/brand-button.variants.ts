import { cva, type VariantProps } from "class-variance-authority";

export const brandButtonVariants = cva(
  "group text-center font-semibold leading-none relative z-0 flex flex-row items-center justify-center border-2 border-solid shadow-none cursor-pointer rounded-md hover:shadow-md focus:shadow-md disabled:opacity-25 disabled:hover:opacity-25 disabled:focus:opacity-25 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        fill: "[&]:text-white bg-transparent border-transparent",
        black: "[&]:text-white bg-black border-black transition hover:text-black focus:text-black hover:bg-grey focus:bg-grey hover:border-grey focus:border-grey",
        gray: "text-black bg-grey transition hover:text-white focus:text-white hover:bg-grey-mid focus:bg-grey-mid hover:border-grey-mid focus:border-grey-mid",
        outline: "[&]:text-orange bg-transparent border-orange hover:text-white focus:text-white",
        "outline-primary": "text-primary [&]:text-primary uppercase tracking-widest bg-transparent border-primary rounded-sm hover:text-white focus:text-white",
        "outline-black": "text-black bg-transparent border-black hover:text-black focus:text-black hover:bg-grey focus:bg-grey hover:border-grey focus:border-grey",
        "outline-white": "text-white bg-transparent border-white hover:text-black focus:text-black hover:bg-white focus:bg-white",
        underline: "opacity-75 underline border-transparent transition hover:text-primary hover:bg-muted hover:border-muted focus:text-primary focus:bg-muted focus:border-muted hover:opacity-100 focus:opacity-100",
        "underline-hover-red": "opacity-75 underline border-transparent transition hover:text-white hover:bg-unraid-red hover:border-unraid-red focus:text-white focus:bg-unraid-red focus:border-unraid-red hover:opacity-100 focus:opacity-100",
        white: "text-black bg-white transition hover:bg-grey focus:bg-grey",
        none: "",
      },
      size: {
        "12px": "text-12px gap-4px",
        "14px": "text-14px gap-8px",
        "16px": "text-16px gap-8px",
        "18px": "text-18px gap-8px",
        "20px": "text-20px gap-8px",
        "24px": "text-24px gap-8px",
      },
      padding: {
        default: "",
        none: "p-0",
        lean: "px-16px py-8px",
      },
    },
    compoundVariants: [
      {
        size: "12px",
        padding: "default",
        class: "p-8px",
      },
      {
        size: "14px",
        padding: "default",
        class: "p-8px",
      },
      {
        size: "16px",
        padding: "default",
        class: "p-12px",
      },
      {
        size: "18px",
        padding: "default",
        class: "p-12px",
      },
      {
        size: "20px",
        padding: "default",
        class: "p-16px",
      },
      {
        size: "24px",
        padding: "default",
        class: "p-16px",
      },
    ],
    defaultVariants: {
      variant: "fill",
      size: "16px",
      padding: "default",
    },
  }
);

export type BrandButtonVariants = VariantProps<typeof brandButtonVariants>;