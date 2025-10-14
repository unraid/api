<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import type { StepMetadataEntry } from '~/components/Activation/stepRegistry';
import type { ActivationOnboardingQuery, ActivationOnboardingStepId } from '~/composables/gql/graphql';

import { stepMetadata } from '~/components/Activation/stepRegistry';

const props = withDefaults(
  defineProps<{
    steps: ActivationOnboardingQuery['activationOnboarding']['steps'];
    activeStepIndex?: number;
    onStepClick?: (stepIndex: number) => void;
  }>(),
  {
    activeStepIndex: 0,
  }
);

interface StepItem {
  title: string;
  description: string;
  icon?: string;
}

const { t } = useI18n();

// Ensure translation extractor retains keys used via metadata lookups
t('activation.activationSteps.activateLicense');
t('activation.activationSteps.createAnUnraidNetAccountAnd');
t('activation.pluginsStep.addHelpfulPlugins');

const translateStep = (meta: StepMetadataEntry): StepItem => ({
  title: t(meta.titleKey),
  description: t(meta.descriptionKey),
  icon: meta.icon,
});

const dynamicSteps = computed(() => {
  const metadataLookup: Record<ActivationOnboardingStepId, StepMetadataEntry> = stepMetadata;

  if (props.steps.length === 0) {
    return [
      translateStep(metadataLookup.WELCOME),
      translateStep(metadataLookup.TIMEZONE),
      translateStep(metadataLookup.PLUGINS),
      translateStep(metadataLookup.ACTIVATION),
    ];
  }

  return props.steps.map((step) => {
    const metadata = metadataLookup[step.id];
    if (metadata) {
      return translateStep(metadata);
    }
    return {
      title: step.id,
      description: '',
      icon: 'i-heroicons-circle-stack',
    };
  });
});

const includeInitialStep = computed(() => dynamicSteps.value.length > 0);

const timelineSteps = computed<StepItem[]>(() => {
  const items: StepItem[] = [];

  if (includeInitialStep.value) {
    items.push({
      title: t('activation.activationSteps.createDevicePassword'),
      description: t('activation.activationSteps.secureYourDevice'),
      icon: 'i-heroicons-lock-closed',
    });
  }

  items.push(...dynamicSteps.value);

  items.push({
    title: t('activation.activationSteps.unleashYourHardware'),
    description: t('activation.activationSteps.deviceIsReadyToConfigure'),
    icon: 'i-heroicons-server-stack',
  });

  return items;
});

const currentStepIndex = computed(() => {
  const offset = includeInitialStep.value ? 1 : 0;
  const targetIndex = (props.activeStepIndex ?? 0) + offset;
  return Math.min(Math.max(targetIndex, 0), timelineSteps.value.length - 1);
});

const isMobile = ref(false);

const checkScreenSize = () => {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth < 768;
  }
};

onMounted(() => {
  checkScreenSize();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', checkScreenSize);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkScreenSize);
  }
});

const orientation = computed(() => (isMobile.value ? 'vertical' : 'horizontal'));

const handleStepClick = (clickedStepIndex: string | number | undefined) => {
  if (!props.onStepClick || clickedStepIndex === undefined) return;

  const stepIndex =
    typeof clickedStepIndex === 'string' ? parseInt(clickedStepIndex, 10) : clickedStepIndex;
  if (isNaN(stepIndex)) return;

  // Map the clicked step index to the actual step index
  // Account for the "Create Device Password" step that's added at the beginning
  const offset = includeInitialStep.value ? 1 : 0;
  const actualStepIndex = Math.max(0, stepIndex - offset);

  // Allow clicking on any step that exists (completed or incomplete)
  if (actualStepIndex < props.steps.length) {
    props.onStepClick(actualStepIndex);
  }
};
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4">
    <UStepper
      :model-value="currentStepIndex"
      :items="timelineSteps"
      :orientation="orientation"
      class="w-full"
      @update:model-value="handleStepClick"
    />
  </div>
</template>
