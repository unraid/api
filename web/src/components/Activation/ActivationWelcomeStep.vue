<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { BrandButton } from '@unraid/ui';

export interface Props {
  // Version context
  currentVersion?: string;
  previousVersion?: string;
  // Partner context
  partnerName?: string;
  // Common props
  onComplete: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  showSkip?: boolean;
  showBack?: boolean;
  // For redirecting to login page after welcome
  redirectToLogin?: boolean;
}

const props = defineProps<Props>();
const { t } = useI18n();

const modalTitle = computed<string>(() => {
  // Partner context
  if (props.partnerName) {
    return t('Welcome to your new {0} system, powered by Unraid!', [props.partnerName]);
  }

  // Version context
  if (props.currentVersion) {
    return t('Welcome to Unraid {0}!', [props.currentVersion]);
  }

  return t('Welcome to Unraid!');
});

const modalDescription = computed<string>(() => {
  // Upgrade context (has both previous and current version)
  if (props.previousVersion && props.currentVersion) {
    return t("You've upgraded from {0} to {1}", [props.previousVersion, props.currentVersion]);
  }

  // Current version context (has current version but no previous)
  if (props.currentVersion) {
    return t('Welcome to your Unraid {0} system', [props.currentVersion]);
  }

  // Default context
  return t('Get started with your new Unraid system');
});

const buttonText = computed<string>(() => {
  return t('Get Started');
});

const handleComplete = () => {
  if (props.redirectToLogin) {
    // Redirect to login page for password creation
    window.location.href = '/login';
  } else {
    // Normal completion flow
    props.onComplete();
  }
};
</script>

<template>
  <div class="flex flex-col items-center space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-semibold">{{ modalTitle }}</h1>
      <p class="mt-2 text-sm opacity-75">{{ modalDescription }}</p>
    </div>

    <div class="flex space-x-4">
      <BrandButton v-if="showBack" :text="t('Back')" variant="outline" @click="onBack" />

      <BrandButton v-if="showSkip" :text="t('Skip')" variant="outline" @click="onSkip" />

      <BrandButton :text="buttonText" @click="handleComplete" />
    </div>
  </div>
</template>
