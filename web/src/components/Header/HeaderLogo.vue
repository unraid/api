<script lang="ts" setup>
import { computed, nextTick, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

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
  >
    <img
      :src="'/webGui/images/UN-logotype-gradient.svg'"
      class="xs:w-[16rem] h-auto max-h-[3rem] w-[14rem] object-contain"
      alt="Unraid Logo"
    />
  </a>
</template>
