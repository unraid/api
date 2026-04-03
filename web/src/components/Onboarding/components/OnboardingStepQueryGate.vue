<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';
import OnboardingLoadingState from '@/components/Onboarding/components/OnboardingLoadingState.vue';

const props = withDefaults(
  defineProps<{
    loading?: boolean;
    error?: unknown | null;
    loadingTitle?: string;
    loadingDescription?: string;
    errorTitle?: string;
    errorDescription?: string;
    onRetry?: () => void | Promise<void>;
    onCloseOnboarding?: () => void | Promise<void>;
  }>(),
  {
    loading: false,
    loadingTitle: '',
    loadingDescription: '',
    errorTitle: '',
    errorDescription: '',
    onRetry: undefined,
    onCloseOnboarding: undefined,
  }
);

const { t } = useI18n();

const hasError = computed(() => Boolean(props.error));
const resolvedLoadingTitle = computed(() => props.loadingTitle || t('onboarding.loading.title'));
const resolvedErrorTitle = computed(() => props.errorTitle || t('onboarding.stepQueryGate.errorTitle'));
const resolvedErrorDescription = computed(
  () => props.errorDescription || t('onboarding.stepQueryGate.errorDescription')
);
</script>

<template>
  <OnboardingLoadingState
    v-if="loading"
    :title="resolvedLoadingTitle"
    :description="loadingDescription"
  />

  <div
    v-else-if="hasError"
    data-testid="onboarding-step-query-error"
    class="border-muted bg-elevated flex min-h-[320px] w-full flex-col items-center justify-center rounded-2xl border px-8 py-14 text-center shadow-sm"
    role="alert"
  >
    <ExclamationTriangleIcon class="h-10 w-10 text-amber-500" />
    <div class="mt-5 max-w-xl space-y-2">
      <h3 class="text-highlighted text-lg font-semibold">
        {{ resolvedErrorTitle }}
      </h3>
      <p class="text-muted text-sm leading-6">
        {{ resolvedErrorDescription }}
      </p>
    </div>

    <div class="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
      <BrandButton
        data-testid="onboarding-step-query-retry"
        :text="t('common.retry')"
        class="!bg-primary hover:!bg-primary/90 min-w-[140px] !text-white"
        @click="void onRetry?.()"
      />
      <button
        data-testid="onboarding-step-query-close"
        type="button"
        class="text-muted hover:text-highlighted rounded-md px-4 py-2 text-sm font-medium transition-colors"
        @click="void onCloseOnboarding?.()"
      >
        {{ t('onboarding.modal.exit.confirm') }}
      </button>
    </div>
  </div>

  <slot v-else />
</template>
