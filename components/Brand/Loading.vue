<script setup lang="ts">
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

export interface Props {
  gradientStart?: string;
  gradientStop?: string;
  height?: number,
  title?: string,
}

withDefaults(defineProps<Props>(), {
  gradientStart: '#e32929',
  gradientStop: '#ff8d30',
  height: 64,
  title: 'Loading',
});
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 133.52 76.97"
    :class="`h-[${height}px]`"
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
        <stop offset="0" :stop-color="gradientStart" />
        <stop offset="1" :stop-color="gradientStop" />
      </linearGradient>
    </defs>
    <path
      d="m70,19.24zm57,0l6.54,0l0,38.49l-6.54,0l0,-38.49z"
      fill="url(#unraidLoadingGradient)"
      class="BrandLoading_9"
    />
    <path
      d="m70,19.24zm47.65,11.9l-6.55,0l0,-23.79l6.55,0l0,23.79z"
      fill="url(#unraidLoadingGradient)"
      class="BrandLoading_8"
    />
    <path
      d="m70,19.24zm31.77,-4.54l-6.54,0l0,-14.7l6.54,0l0,14.7z"
      fill="url(#unraidLoadingGradient)"
      class="BrandLoading_7"
    />
    <path
      d="m70,19.24zm15.9,11.9l-6.54,0l0,-23.79l6.54,0l0,23.79z"
      fill="url(#unraidLoadingGradient)"
      class="BrandLoading_6"
    />
    <path
      d="m63.49,19.24l6.51,0l0,38.49l-6.51,0l0,-38.49z"
      fill="url(#unraidLoadingGradient)"
      class="BrandLoading_5"
    />
    <path
      d="m70,19.24zm-22.38,26.6l6.54,0l0,23.78l-6.54,0l0,-23.78z"
      fill="url(#unraidLoadingGradient)"
      class="BrandLoading_4"
    />
    <path
      d="m70,19.24zm-38.26,43.03l6.55,0l0,14.73l-6.55,0l0,-14.73z"
      fill="url(#unraidLoadingGradient)"
      class="BrandLoading_3"
    />
    <path
      d="m70,19.24zm-54.13,26.6l6.54,0l0,23.78l-6.54,0l0,-23.78z"
      fill="url(#unraidLoadingGradient)"
      class="BrandLoading_2"
    />
    <path
      d="m70,19.24zm-63.46,38.49l-6.54,0l0,-38.49l6.54,0l0,38.49z"
      fill="url(#unraidLoadingGradient)"
      class="BrandLoading_1"
    />
  </svg>
</template>
