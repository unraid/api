<script setup lang="ts">
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

export interface Props {
  gradientStart?: string;
  gradientStop?: string;
  title?: string,
}

withDefaults(defineProps<Props>(), {
  gradientStart: '#e32929',
  gradientStop: '#ff8d30',
  title: 'Loading',
});
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 133.52 76.97"
    :class="`unraid_mark`"
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
      class="unraid_mark_9"
    />
    <path
      d="m70,19.24zm47.65,11.9l-6.55,0l0,-23.79l6.55,0l0,23.79z"
      fill="url(#unraidLoadingGradient)"
      class="unraid_mark_8"
    />
    <path
      d="m70,19.24zm31.77,-4.54l-6.54,0l0,-14.7l6.54,0l0,14.7z"
      fill="url(#unraidLoadingGradient)"
      class="unraid_mark_7"
    />
    <path
      d="m70,19.24zm15.9,11.9l-6.54,0l0,-23.79l6.54,0l0,23.79z"
      fill="url(#unraidLoadingGradient)"
      class="unraid_mark_6"
    />
    <path
      d="m63.49,19.24l6.51,0l0,38.49l-6.51,0l0,-38.49z"
      fill="url(#unraidLoadingGradient)"
      class="unraid_mark_5"
    />
    <path
      d="m70,19.24zm-22.38,26.6l6.54,0l0,23.78l-6.54,0l0,-23.78z"
      fill="url(#unraidLoadingGradient)"
      class="unraid_mark_4"
    />
    <path
      d="m70,19.24zm-38.26,43.03l6.55,0l0,14.73l-6.55,0l0,-14.73z"
      fill="url(#unraidLoadingGradient)"
      class="unraid_mark_3"
    />
    <path
      d="m70,19.24zm-54.13,26.6l6.54,0l0,23.78l-6.54,0l0,-23.78z"
      fill="url(#unraidLoadingGradient)"
      class="unraid_mark_2"
    />
    <path
      d="m70,19.24zm-63.46,38.49l-6.54,0l0,-38.49l6.54,0l0,38.49z"
      fill="url(#unraidLoadingGradient)"
      class="unraid_mark_1"
    />
  </svg>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;

.unraid_mark_2,
.unraid_mark_4 {
  animation: mark_2 1.5s ease infinite;
}
.unraid_mark_3 {
  animation: mark_3 1.5s ease infinite;
}
.unraid_mark_6,
.unraid_mark_8 {
  animation: mark_6 1.5s ease infinite;
}
.unraid_mark_7 {
  animation: mark_7 1.5s ease infinite;
}

@keyframes mark_2 {
  50% {
    transform: translateY(-40px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_3 {
  50% {
    transform: translateY(-62px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_6 {
  50% {
    transform: translateY(40px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_7 {
  50% {
    transform: translateY(62px);
  }
  100% {
    transform: translateY(0);
  }
}

@tailwind utilities;
</style>
