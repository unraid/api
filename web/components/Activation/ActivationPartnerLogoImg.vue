<script lang="ts" setup>
/**
 * The actual image should be full black filled #000000.
 * This allows us to use the `invert` class to change the color to white when displayed in dark mode.
 */
import { storeToRefs } from 'pinia';

import { useThemeStore } from '~/store/theme';

interface Props {
  partnerInfo?: {
    partnerLogoUrl?: string | null;
    hasPartnerLogo?: boolean;
  };
}

defineProps<Props>();

const { darkMode } = storeToRefs(useThemeStore());
</script>

<template>
  <img
    v-if="partnerInfo?.partnerLogoUrl"
    :src="partnerInfo?.partnerLogoUrl"
    class="w-72"
    :class="{ invert: darkMode && partnerInfo.hasPartnerLogo }"
  >
</template>
