<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';

const props = withDefaults(
  defineProps<{
    rootTestId?: string;
    title?: string;
    description?: string;
    primaryActionText?: string;
    secondaryActionText?: string;
    primaryTestId?: string;
    secondaryTestId?: string;
    onPrimaryAction?: () => void | Promise<void>;
    onSecondaryAction?: () => void | Promise<void>;
  }>(),
  {
    rootTestId: 'onboarding-step-blocking-state',
    title: '',
    description: '',
    primaryActionText: '',
    secondaryActionText: '',
    primaryTestId: 'onboarding-step-blocking-primary',
    secondaryTestId: 'onboarding-step-blocking-secondary',
    onPrimaryAction: undefined,
    onSecondaryAction: undefined,
  }
);

const { t } = useI18n();

const resolvedTitle = computed(() => props.title || t('onboarding.stepQueryGate.errorTitle'));
const resolvedDescription = computed(
  () => props.description || t('onboarding.stepQueryGate.errorDescription')
);
const hasPrimaryAction = computed(() => Boolean(props.primaryActionText && props.onPrimaryAction));
const hasSecondaryAction = computed(() => Boolean(props.secondaryActionText && props.onSecondaryAction));
</script>

<template>
  <div
    :data-testid="rootTestId"
    class="border-muted bg-elevated flex min-h-[320px] w-full flex-col items-center justify-center rounded-2xl border px-8 py-14 text-center shadow-sm"
    role="alert"
  >
    <ExclamationTriangleIcon class="h-10 w-10 text-amber-500" />
    <div class="mt-5 max-w-xl space-y-2">
      <h3 class="text-highlighted text-lg font-semibold">
        {{ resolvedTitle }}
      </h3>
      <p class="text-muted text-sm leading-6">
        {{ resolvedDescription }}
      </p>
    </div>

    <div class="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
      <BrandButton
        v-if="hasPrimaryAction"
        :data-testid="primaryTestId"
        :text="primaryActionText"
        class="!bg-primary hover:!bg-primary/90 min-w-[140px] !text-white"
        @click="void onPrimaryAction?.()"
      />
      <button
        v-if="hasSecondaryAction"
        :data-testid="secondaryTestId"
        type="button"
        class="text-muted hover:text-highlighted rounded-md px-4 py-2 text-sm font-medium transition-colors"
        @click="void onSecondaryAction?.()"
      >
        {{ secondaryActionText }}
      </button>
    </div>
  </div>
</template>
