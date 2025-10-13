<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

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

const dynamicSteps = computed(() => {
  const metadataLookup = stepMetadata as Record<ActivationOnboardingStepId, StepItem>;

  if (props.steps.length === 0) {
    return [
      metadataLookup.WELCOME,
      metadataLookup.TIMEZONE,
      metadataLookup.PLUGINS,
      metadataLookup.ACTIVATION,
    ];
  }

  return props.steps.map(
    (step) =>
      metadataLookup[step.id] ?? {
        title: step.id,
        description: '',
        icon: 'i-heroicons-circle-stack',
      }
  );
});

const includeInitialStep = computed(() => dynamicSteps.value.length > 0);

const timelineSteps = computed<StepItem[]>(() => {
  const items: StepItem[] = [];

  if (includeInitialStep.value) {
    items.push({
      title: 'Create Device Password',
      description: 'Secure your device',
      icon: 'i-heroicons-lock-closed',
    });
  }

  items.push(...dynamicSteps.value);

  items.push({
    title: 'Unleash Your Hardware',
    description: 'Device is ready to configure',
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
  isMobile.value = window.innerWidth < 768;
};

onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize);
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
