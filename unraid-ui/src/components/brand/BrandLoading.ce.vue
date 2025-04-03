<script setup lang="ts">
import {
  brandLoadingVariants,
  markAnimations,
  type BrandLoadingVariants,
} from '@/components/brand/brand-loading.variants';
import { cn } from '@/lib/utils';
import { computed } from 'vue';

export interface Props {
  variant?: BrandLoadingVariants['variant'];
  size?: BrandLoadingVariants['size'];
  class?: string;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'full',
  title: 'Loading',
});

const GRADIENT_COLORS = {
  black: { start: '#000000', stop: '#000000' },
  white: { start: '#FFFFFF', stop: '#FFFFFF' },
  default: { start: '#e32929', stop: '#ff8d30' },
} as const;

const gradientColors = computed(() => GRADIENT_COLORS[props.variant as keyof typeof GRADIENT_COLORS]);

const classes = computed(() => {
  return cn(brandLoadingVariants({ variant: props.variant, size: props.size }), props.class);
});
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 133.52 76.97"
    :class="classes"
    role="img"
  >
    <title>{{ title }}</title>
    <desc>Unraid logo animating with a wave like effect</desc>
    <defs>
      <linearGradient
        id="unraidLoadingGradient"
        x1="23.76"
        y1="81.49"
        x2="109.76"
        y2="-4.51"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" :stop-color="gradientColors.start" />
        <stop offset="1" :stop-color="gradientColors.stop" />
      </linearGradient>
    </defs>
    <path
      d="m70,19.24zm57,0l6.54,0l0,38.49l-6.54,0l0,-38.49z"
      fill="url(#unraidLoadingGradient)"
      class="unraid_mark_9"
    />
    <path
      d="m70,19.24zm47.65,11.9l-6.55,0l0,-23.79l6.55,0l0,23.79z"
      fill="url(#unraidLoadingGradient)"
      :class="['unraid_mark_8', markAnimations.mark_6_8]"
    />
    <path
      d="m70,19.24zm31.77,-4.54l-6.54,0l0,-14.7l6.54,0l0,14.7z"
      fill="url(#unraidLoadingGradient)"
      :class="['unraid_mark_7', markAnimations.mark_7]"
    />
    <path
      d="m70,19.24zm15.9,11.9l-6.54,0l0,-23.79l6.54,0l0,23.79z"
      fill="url(#unraidLoadingGradient)"
      :class="['unraid_mark_6', markAnimations.mark_6_8]"
    />
    <path
      d="m63.49,19.24l6.51,0l0,38.49l-6.51,0l0,-38.49z"
      fill="url(#unraidLoadingGradient)"
      class="unraid_mark_5"
    />
    <path
      d="m70,19.24zm-22.38,26.6l6.54,0l0,23.78l-6.54,0l0,-23.78z"
      fill="url(#unraidLoadingGradient)"
      :class="['unraid_mark_4', markAnimations.mark_2_4]"
    />
    <path
      d="m70,19.24zm-38.26,43.03l6.55,0l0,14.73l-6.55,0l0,-14.73z"
      fill="url(#unraidLoadingGradient)"
      :class="['unraid_mark_3', markAnimations.mark_3]"
    />
    <path
      d="m70,19.24zm-54.13,26.6l6.54,0l0,23.78l-6.54,0l0,-23.78z"
      fill="url(#unraidLoadingGradient)"
      :class="['unraid_mark_2', markAnimations.mark_2_4]"
    />
    <path
      d="m70,19.24zm-63.46,38.49l-6.54,0l0,-38.49l6.54,0l0,38.49z"
      fill="url(#unraidLoadingGradient)"
      class="unraid_mark_1"
    />
  </svg>
</template>
