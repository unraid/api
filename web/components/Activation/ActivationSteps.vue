<script setup lang="ts">
import { CheckIcon, KeyIcon, ServerStackIcon } from '@heroicons/vue/24/outline';
import {
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

withDefaults(
  defineProps<{
    activeStep?: number;
  }>(),
  {
    activeStep: 1,
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
const steps: readonly Step[] = [
  {
    step: 1,
    title: 'Create Device Password',
    description: 'Secure your device',
    icon: {
      inactive: LockClosedIcon,
      active: LockClosedIcon,
      completed: CheckIcon,
    },
  },
  {
    step: 2,
    title: 'Activate License',
    description: 'Create an Unraid.net account and activate your key',
    icon: {
      inactive: KeyIcon,
      active: KeyIconSolid,
      completed: CheckIcon,
    },
  },
  {
    step: 3,
    title: 'Unleash Your Hardware',
    description: 'Device is ready to configure',
    icon: {
      inactive: ServerStackIcon,
      active: ServerStackIconSolid,
      completed: CheckIcon,
    },
  },
] as const;
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
            :class="`z-10 rounded-full  ${
              state !== 'inactive'
                ? 'ring-2 ring-offset-2 ring-offset-background *:cursor-default ' +
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
