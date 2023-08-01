<script setup lang="ts">
export interface Props {
  gradientStart?: string;
  gradientStop?: string;
}

withDefaults(defineProps<Props>(), {
  gradientStart: '#e32929',
  gradientStop: '#ff8d30',
});
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" data-name="Layer 1" viewBox="0 0 954.29 142.4">
    <defs>
      <linearGradient
        id="a"
        x1="-57.82"
        x2="923.39"
        y1="71.2"
        y2="71.2"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" :stop-color="gradientStart" />
        <stop offset="1" :stop-color="gradientStop" />
      </linearGradient>
      <linearGradient id="b" xlink:href="#a" x2="923.39" />
      <linearGradient id="c" xlink:href="#a" x2="923.39" y1="71.2" y2="71.2" />
      <linearGradient id="d" xlink:href="#a" x2="923.39" y1="71.2" y2="71.2" />
      <linearGradient id="e" xlink:href="#a" x2="923.39" y1="71.2" y2="71.2" />
      <linearGradient id="f" xlink:href="#a" x2="923.39" />
      <linearGradient id="g" xlink:href="#a" y1="12.16" y2="12.16" />
      <linearGradient id="h" xlink:href="#a" x2="923.39" y1="86.94" y2="86.94" />
    </defs>
    <path fill="url(#a)" d="M54.39 0C20.96 0 0 17.4 0 49.84v42.52c0 32.63 20.96 50.04 53.99 50.04s53.8-16.81 53.8-48.06v-.99H84.25v.99c0 17.8-11.47 27.49-30.26 27.49s-30.46-10.28-30.46-29.47V49.84c0-18.99 11.67-29.47 30.85-29.47s29.86 9.89 29.86 27.69v.79h23.54v-.79C107.79 16.81 87.02 0 54.39 0Z" />
    <path fill="url(#b)" d="M197.58 0c-33.42 0-54.59 17.4-54.59 49.84v42.52c0 32.63 21.16 50.04 54.19 50.04s54.59-17.4 54.59-50.04V49.84C251.77 17.4 230.61 0 197.58 0Zm30.66 92.36c0 19.18-11.87 29.47-31.05 29.47s-30.66-10.28-30.66-29.47V49.84c0-18.99 11.87-29.47 31.05-29.47s30.66 10.48 30.66 29.47v42.52Z" />
    <path fill="url(#c)" d="M373.8 97.31 312.49 1.98h-21.95v138.44h23.53V45.09l61.32 95.33h21.95V1.98H373.8v95.33z" />
    <path fill="url(#d)" d="M521.35 97.31 460.04 1.98h-21.96v138.44h23.54V45.09l61.31 95.33h21.95V1.98h-23.53v95.33z" />
    <path fill="url(#e)" d="M585.63 140.42h92.95v-20.57h-69.42V81.29h59.54V60.92h-59.54V22.35h69.42V1.98h-92.95v138.44z" />
    <path fill="url(#f)" d="M766.8 0c-33.43 0-54.39 17.4-54.39 49.84v42.52c0 32.63 20.96 50.04 53.99 50.04s53.8-16.81 53.8-48.06v-.99h-23.54v.99c0 17.8-11.47 27.49-30.26 27.49s-30.46-10.28-30.46-29.47V49.84c0-18.99 11.67-29.47 30.85-29.47s29.86 9.89 29.86 27.69v.79h23.54v-.79c0-31.25-20.77-48.06-53.4-48.06Z" />
    <path fill="url(#g)" d="M846.11 1.98h108.18v20.37H846.11z" />
    <path fill="url(#h)" d="M888.43 33.45h23.54v106.97h-23.54z" />
  </svg>
</template>
