<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import type { StepMetadataEntry } from '~/components/Onboarding/stepRegistry';

import { stepMetadata } from '~/components/Onboarding/stepRegistry';

// Hardcoded step type matching OnboardingModal
type StepId =
  | 'OVERVIEW'
  | 'CONFIGURE_SETTINGS'
  | 'ADD_PLUGINS'
  | 'ACTIVATE_LICENSE'
  | 'SUMMARY'
  | 'NEXT_STEPS';

type HardcodedStep = { id: StepId; required: boolean };

const props = withDefaults(
  defineProps<{
    steps: HardcodedStep[];
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
t('onboarding.activationSteps.activateLicense');
t('onboarding.activationSteps.createAnUnraidNetAccountAnd');
t('onboarding.pluginsStep.addHelpfulPlugins');

const formatStep = (title: string, index: number, icon?: string): StepItem => ({
  title: `Step ${index + 1}`,
  description: title,
  icon,
});

const dynamicSteps = computed(() => {
  const metadataLookup: Record<StepId, StepMetadataEntry> = stepMetadata;

  if (props.steps.length === 0) {
    const defaultSteps = [
      metadataLookup.OVERVIEW,
      metadataLookup.CONFIGURE_SETTINGS,
      metadataLookup.ADD_PLUGINS,
      metadataLookup.ACTIVATE_LICENSE,
    ];
    return defaultSteps.map((meta, index) => formatStep(t(meta.titleKey), index, meta.icon));
  }

  return props.steps.map((step, index) => {
    const metadata = metadataLookup[step.id];
    if (metadata) {
      return formatStep(t(metadata.titleKey), index, metadata.icon);
    }
    return formatStep(step.id, index, 'i-heroicons-circle-stack');
  });
});

const timelineSteps = computed<StepItem[]>(() => {
  const items: StepItem[] = [];

  items.push(...dynamicSteps.value);

  return items;
});

const currentStepIndex = computed(() => {
  const targetIndex = props.activeStepIndex ?? 0;
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
  const actualStepIndex = Math.max(0, stepIndex);

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
