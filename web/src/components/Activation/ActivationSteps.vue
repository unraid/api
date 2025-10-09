<script setup lang="ts">
import { computed } from 'vue';

import { CheckIcon, ClockIcon, KeyIcon, ServerStackIcon } from '@heroicons/vue/24/outline';
import {
  ClockIcon as ClockIconSolid,
  KeyIcon as KeyIconSolid,
  LockClosedIcon,
  ServerStackIcon as ServerStackIconSolid,
} from '@heroicons/vue/24/solid';
import {
  Button,
  Stepper,
  StepperDescription,
  StepperItem,
  StepperTitle,
  StepperTrigger,
} from '@unraid/ui';

import type { Component } from 'vue';

type StepState = 'inactive' | 'active' | 'completed';

const props = withDefaults(
  defineProps<{
    activeStep?: number;
    showActivationStep?: boolean;
  }>(),
  {
    activeStep: 1,
    showActivationStep: true,
  }
);

interface Step {
  step: number;
  title: string;
  description: string;
  icon: {
    inactive: Component;
    active: Component;
    completed: Component;
  };
}

const allSteps: readonly Step[] = [
  {
    step: 1,
    title: t('activation.activationSteps.createDevicePassword'),
    description: t('activation.activationSteps.secureYourDevice'),
    icon: {
      inactive: LockClosedIcon,
      active: LockClosedIcon,
      completed: CheckIcon,
    },
  },
  {
    step: 2,
    title: 'Configure Basic Settings',
    description: 'Set up system preferences',
    icon: {
      inactive: ClockIcon,
      active: ClockIconSolid,
      completed: CheckIcon,
    },
  },
  {
    step: 3,
    title: 'Activate License',
    description: 'Create an Unraid.net account and activate your key',
    icon: {
      inactive: KeyIcon,
      active: KeyIconSolid,
      completed: CheckIcon,
    },
  },
  {
    step: 4,
    title: 'Unleash Your Hardware',
    description: 'Device is ready to configure',
    icon: {
      inactive: ServerStackIcon,
      active: ServerStackIconSolid,
      completed: CheckIcon,
    },
  },
] as const;

const steps = computed(() => {
  if (props.showActivationStep) {
    return allSteps;
  }
  return allSteps
    .filter((step) => step.step !== 3)
    .map((step, index) => ({
      ...step,
      step: index + 1,
    }));
});
</script>

<template>
  <Stepper :default-value="activeStep" class="text-foreground flex w-full items-start gap-2 text-base">
    <StepperItem
      v-for="step in steps"
      :key="step.step"
      v-slot="{ state }: { state: StepState }"
      class="relative flex w-full flex-col items-center justify-center data-disabled:opacity-100"
      :step="step.step"
      :disabled="true"
    >
      <StepperTrigger>
        <div class="flex items-center justify-center">
          <Button
            :variant="state === 'completed' ? 'primary' : state === 'active' ? 'primary' : 'outline'"
            size="md"
            :class="`z-10 rounded-full ${
              state !== 'inactive'
                ? 'ring-offset-background ring-2 ring-offset-2 *:cursor-default ' +
                  (state === 'completed' ? 'ring-success' : 'ring-primary')
                : ''
            }`"
            :disabled="state === 'inactive'"
          >
            <component :is="step.icon[state]" class="size-4" />
          </Button>
        </div>

        <div class="mt-2 flex flex-col items-center text-center">
          <StepperTitle
            :class="[state === 'active' && 'text-primary']"
            class="text-2xs font-semibold transition"
          >
            {{ step.title }}
          </StepperTitle>
          <StepperDescription class="text-2xs font-normal">
            {{ step.description }}
          </StepperDescription>
        </div>
      </StepperTrigger>
    </StepperItem>
  </Stepper>
</template>
