<script setup lang="ts">
import Button from '@/components/common/button/Button.vue';
import Stepper from '@/components/common/stepper/Stepper.vue';
import StepperDescription from '@/components/common/stepper/StepperDescription.vue';
import StepperItem from '@/components/common/stepper/StepperItem.vue';
import StepperSeparator from '@/components/common/stepper/StepperSeparator.vue';
import StepperTitle from '@/components/common/stepper/StepperTitle.vue';
import StepperTrigger from '@/components/common/stepper/StepperTrigger.vue';
import { CheckIcon } from '@heroicons/vue/24/solid'; // Example icon
import {
  // ControlElement, // No longer needed here, DispatchRenderer handles it
  type JsonSchema,
  type Layout,
  type UISchemaElement,
} from '@jsonforms/core';
import { DispatchRenderer, useJsonFormsLayout, type RendererProps } from '@jsonforms/vue';
import { computed, inject } from 'vue';

// Define props based on RendererProps<Layout>
const props = defineProps<RendererProps<Layout>>();

// --- JSON Forms Composables and Context ---
const { layout } = useJsonFormsLayout(props);
// Inject core jsonforms functionality (safer than relying on potentially non-exported composables)
const jsonforms = inject<any>('jsonforms');
const core = computed(() => jsonforms?.core);
const dispatch = computed(() => jsonforms?.dispatch);

// --- Step Configuration ---

// Expect options.steps: [{ label: string, description: string }, ...]
const stepsConfig = computed(() => props.uischema.options?.steps || []);

// Get the path to the step control property from uischema options (e.g., '#/properties/configStep')
const stepControlPath = computed(() => props.uischema.options?.stepControl as string | undefined);

// --- Current Step Logic ---

// Function to safely extract the step value from the data without lodash
const getCurrentStep = () => {
  if (!stepControlPath.value || !core?.value?.data) return 0;
  const pathSegments = stepControlPath.value.startsWith('#/')
    ? stepControlPath.value.substring(2).split('/')
    : stepControlPath.value.split('.'); // Allow dot notation too

  let currentData = core.value.data;
  for (const segment of pathSegments) {
    if (currentData === null || typeof currentData !== 'object' || !(segment in currentData)) {
      return 0; // Path not found or data structure incorrect, default to step 0
    }
    currentData = currentData[segment];
  }
  return typeof currentData === 'number' ? currentData : 0; // Return step number or default
};

const currentStep = computed(getCurrentStep);

// --- Step Update Logic ---

const updateStep = (newStep: number) => {
  if (!stepControlPath.value || !dispatch?.value || newStep < 0 || newStep >= stepsConfig.value.length)
    return;

  // Use Actions.update to modify the data property controlling the step
  const updateAction = jsonforms.Actions.update(stepControlPath.value, newStep);
  dispatch.value(updateAction);
};

// --- Filtered Elements for Current Step ---

const currentStepElements = computed(() => {
  return (props.uischema.elements || []).filter((element: UISchemaElement) => {
    return element.options?.step === currentStep.value;
  });
});

// --- Stepper State Logic ---
type StepState = 'inactive' | 'active' | 'completed';

const getStepState = (stepIndex: number): StepState => {
  if (stepIndex < currentStep.value) return 'completed';
  if (stepIndex === currentStep.value) return 'active';
  return 'inactive';
};
</script>

<template>
  <div v-if="layout.visible" class="stepped-layout space-y-6">
    <!-- Stepper Indicators -->
    <Stepper :modelValue="currentStep + 1" class="text-foreground flex w-full items-start gap-2 text-sm">
      <StepperItem
        v-for="(step, index) in stepsConfig"
        :key="index"
        v-slot="{ state }"
        class="relative flex w-full flex-col items-center justify-center"
        :step="index + 1"
        :disabled="getStepState(index) === 'inactive'"
      >
        <StepperTrigger @click="updateStep(index)" class="cursor-pointer">
          <!-- Use state calculated by getStepState for styling -->
          <div
            :class="[
              'flex h-8 w-8 items-center justify-center rounded-full border-2',
              getStepState(index) === 'completed'
                ? 'border-primary bg-primary text-primary-foreground'
                : getStepState(index) === 'active'
                  ? 'border-primary text-primary'
                  : 'border-muted text-muted-foreground',
            ]"
          >
            <CheckIcon v-if="getStepState(index) === 'completed'" class="size-4" />
            <span v-else>{{ index + 1 }}</span>
          </div>
        </StepperTrigger>
        <div class="mt-2 flex flex-col items-center text-center">
          <StepperTitle
            :class="[getStepState(index) === 'active' && 'text-primary']"
            class="text-xs font-semibold transition"
          >
            {{ step.label }}
          </StepperTitle>
          <StepperDescription v-if="step.description" class="text-xs font-normal text-muted-foreground">
            {{ step.description }}
          </StepperDescription>
        </div>
        <StepperSeparator
          v-if="index < stepsConfig.length - 1"
          class="absolute left-1/2 top-4 -z-10 ml-[calc(var(--separator-offset,0rem)+10px)] h-0.5 w-[calc(100%-20px)] bg-border data-[state=active]:bg-primary data-[state=completed]:bg-primary"
        />
      </StepperItem>
    </Stepper>

    <!-- Render elements for the current step -->
    <div class="current-step-content rounded-md border p-4 shadow">
      <DispatchRenderer
        v-for="(element, index) in currentStepElements"
        :key="`${layout.path}-${index}-step-${currentStep}`"
        :schema="props.schema as JsonSchema"
        :uischema="element as UISchemaElement"
        :path="layout.path || ''"
        :renderers="layout.renderers"
        :cells="layout.cells"
        :enabled="layout.enabled"
      />
    </div>

    <!-- Navigation Buttons -->
    <div class="mt-4 flex justify-end space-x-2">
      <Button variant="outline" @click="updateStep(currentStep - 1)" :disabled="currentStep === 0">
        Previous
      </Button>
      <Button @click="updateStep(currentStep + 1)" :disabled="currentStep >= stepsConfig.length - 1">
        Next
      </Button>
    </div>
  </div>
</template>

<style scoped>
/* Add any specific styling needed */
</style>
