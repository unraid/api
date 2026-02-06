<script lang="ts" setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useThemeStore } from '~/store/theme';

interface Props {
  partnerInfo?: {
    branding?: {
      partnerLogoLightUrl?: string | null;
      partnerLogoDarkUrl?: string | null;
      hasPartnerLogo?: boolean | null;
    } | null;
  } | null;
}

const props = defineProps<Props>();

const { theme } = storeToRefs(useThemeStore());

const isDarkTheme = computed(() => ['black', 'gray'].includes(theme.value.name));

const selectedLogoUrl = computed(() => {
  const branding = props.partnerInfo?.branding;
  if (!branding) return null;

  if (isDarkTheme.value) {
    return branding.partnerLogoDarkUrl || branding.partnerLogoLightUrl || null;
  }

  return branding.partnerLogoLightUrl || branding.partnerLogoDarkUrl || null;
});
</script>

<template>
  <img v-if="selectedLogoUrl" :src="selectedLogoUrl" class="w-72" />
</template>
