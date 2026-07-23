<script lang="ts" setup>
import { computed, nextTick, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

import type { HeaderLogoStyle } from '~/themes/types';

const { logoStyle = 'gradient' } = defineProps<{
  logoStyle?: HeaderLogoStyle;
}>();

const { t } = useI18n();

// Defer legacy logo cleanup to avoid blocking mount.
onMounted(() => {
  nextTick(() => {
    const logoWrapper = document.querySelector('.logo');
    logoWrapper?.classList.remove('logo');
  });
});

const unraidLogoHeaderLink = computed<{ href: string; title: string }>(() => ({
  href: 'https://unraid.net',
  title: t('headerOsVersion.visitUnraidWebsite'),
}));
</script>

<template>
  <a
    :href="unraidLogoHeaderLink.href"
    :title="unraidLogoHeaderLink.title"
    target="_blank"
    rel="noopener"
    :aria-label="unraidLogoHeaderLink.title"
    class="flex max-w-full min-w-0"
  >
    <svg
      v-if="logoStyle === 'theme'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 222.36 39.04"
      class="text-header-text-primary xs:w-[16rem] h-auto max-h-[3rem] w-[14rem] max-w-full"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M146.7,29.47H135l-3,9h-6.49L138.93,0h8l13.41,38.49h-7.09L142.62,6.93l-5.83,16.88h8ZM29.69,0V25.4c0,8.91-5.77,13.64-14.9,13.64S0,34.31,0,25.4V0H6.54V25.4c0,5.17,3.19,7.92,8.25,7.92s8.36-2.75,8.36-7.92V0ZM50.86,12v26.5H44.31V0h6.11l17,26.5V0H74V38.49H67.9ZM171.29,0h6.54V38.49h-6.54Zm51.07,24.69c0,9-5.88,13.8-15.17,13.8H192.67V0H207.3c9.18,0,15.06,4.78,15.06,13.8ZM215.82,13.8c0-5.28-3.3-8.14-8.52-8.14h-8.08V32.77h8c5.33,0,8.63-2.8,8.63-8.08ZM108.31,23.92c4.34-1.6,6.93-5.28,6.93-11.55C115.24,3.68,110.18,0,102.48,0H88.84V38.49h6.55V5.66h6.87c3.8,0,6.21,1.82,6.21,6.71s-2.41,6.76-6.21,6.76H98.88l9.21,19.36h7.53Z"
      />
    </svg>
    <!--
      Inline the gradient logo (same paths as the theme variant above, same
      gradient as /webGui/images/UN-logotype-gradient.svg) rather than an <img>.
      The webgui boot logo paints an <img> of that file; re-rendering it as a
      fresh <img> on mount re-requests the asset (it ships without Cache-Control,
      so the browser revalidates), blanking the logo for a frame. Inline SVG
      paints immediately with no network round-trip, so the swap is seamless.
    -->
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 222.36 39.04"
      class="xs:w-[16rem] h-auto max-h-[3rem] w-[14rem] max-w-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id="unraid-header-logo-gradient"
          x1="47.53"
          y1="79.1"
          x2="170.71"
          y2="-44.08"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="#e32929" />
          <stop offset="1" stop-color="#ff8d30" />
        </linearGradient>
      </defs>
      <path
        fill="url(#unraid-header-logo-gradient)"
        d="M146.7,29.47H135l-3,9h-6.49L138.93,0h8l13.41,38.49h-7.09L142.62,6.93l-5.83,16.88h8ZM29.69,0V25.4c0,8.91-5.77,13.64-14.9,13.64S0,34.31,0,25.4V0H6.54V25.4c0,5.17,3.19,7.92,8.25,7.92s8.36-2.75,8.36-7.92V0ZM50.86,12v26.5H44.31V0h6.11l17,26.5V0H74V38.49H67.9ZM171.29,0h6.54V38.49h-6.54Zm51.07,24.69c0,9-5.88,13.8-15.17,13.8H192.67V0H207.3c9.18,0,15.06,4.78,15.06,13.8ZM215.82,13.8c0-5.28-3.3-8.14-8.52-8.14h-8.08V32.77h8c5.33,0,8.63-2.8,8.63-8.08ZM108.31,23.92c4.34-1.6,6.93-5.28,6.93-11.55C115.24,3.68,110.18,0,102.48,0H88.84V38.49h6.55V5.66h6.87c3.8,0,6.21,1.82,6.21,6.71s-2.41,6.76-6.21,6.76H98.88l9.21,19.36h7.53Z"
      />
    </svg>
  </a>
</template>
