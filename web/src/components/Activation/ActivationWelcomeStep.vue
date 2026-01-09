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
  isSavingStep?: boolean;
}

const props = defineProps<Props>();
const { t } = useI18n();

const modalTitle = computed<string>(() => {
  // Partner context
  if (props.partnerName) {
    return t('activation.welcomeModal.welcomeToYourNewSystemPowered', [props.partnerName]);
  }

  // Version context
  if (props.currentVersion) {
    return t('activation.welcomeModal.welcomeToUnraidVersion', [props.currentVersion]);
  }

  return t('activation.welcomeModal.welcomeToUnraid');
});

const modalDescription = computed<string>(() => {
  // Upgrade context (has both previous and current version)
  if (props.previousVersion && props.currentVersion) {
    return t('activation.welcomeModal.youVeUpgradedFromPrevToCurr', [
      props.previousVersion,
      props.currentVersion,
    ]);
  }

  // Current version context (has current version but no previous)
  if (props.currentVersion) {
    return t('activation.welcomeModal.welcomeToYourUnraidSystem', [props.currentVersion]);
  }

  // Default context
  return t('activation.welcomeModal.getStartedWithYourNewSystem');
});

const buttonText = computed<string>(() => {
  return t('activation.welcomeModal.getStarted');
});

const isBusy = computed(() => props.isSavingStep ?? false);

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
      <BrandButton
        v-if="showBack"
        :text="t('common.back')"
        variant="outline"
        :disabled="isBusy"
        @click="onBack"
      />

      <BrandButton
        v-if="showSkip"
        :text="t('common.skip')"
        variant="outline"
        :disabled="isBusy"
        @click="onSkip"
      />

      <BrandButton :text="buttonText" :disabled="isBusy" :loading="isBusy" @click="handleComplete" />
    </div>
  </div>
</template>
