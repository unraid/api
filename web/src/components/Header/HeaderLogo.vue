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
    class="block max-w-full min-w-0"
  >
    <span
      v-if="logoStyle === 'theme'"
      class="theme-adaptive-logo bg-header-text-primary xs:w-[16rem] block w-[14rem] max-w-full"
      aria-hidden="true"
    />
    <img
      v-else
      :src="'/webGui/images/UN-logotype-gradient.svg'"
      class="xs:w-[16rem] h-auto max-h-[3rem] w-[14rem] max-w-full object-contain"
      alt="Unraid Logo"
    />
  </a>
</template>

<style scoped>
.theme-adaptive-logo {
  aspect-ratio: 222.36 / 39.04;
  max-height: 3rem;
  mask: url('/webGui/images/UN-logotype-gradient.svg') left center / contain no-repeat;
  -webkit-mask: url('/webGui/images/UN-logotype-gradient.svg') left center / contain no-repeat;
}
</style>
