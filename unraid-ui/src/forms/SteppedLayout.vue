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
  Actions,
  type CoreActions,
  type JsonFormsSubStates,
  type JsonSchema,
  type Layout,
  type UISchemaElement,
} from '@jsonforms/core';
import { DispatchRenderer, useJsonFormsLayout, type RendererProps } from '@jsonforms/vue';
import { computed, inject, nextTick, onMounted, ref, type Ref } from 'vue';

// Define props based on RendererProps<Layout>
const props = defineProps<RendererProps<Layout>>();

// --- JSON Forms Context Injection ---
const jsonforms = inject<JsonFormsSubStates>('jsonforms');
const dispatch = inject<(action: CoreActions) => void>('dispatch'); // Inject dispatch separately

// --- START: Inject submission logic from parent ---
const submitForm = inject<() => Promise<void>>('submitForm', () => {
  console.warn('SteppedLayout: submitForm function not provided');
  return Promise.resolve(); // Provide a default no-op function
});
const isSubmitting = inject<Ref<boolean>>('isSubmitting', ref(false)); // Provide a default non-reactive ref
// --- END: Inject submission logic from parent ---

if (!jsonforms || !dispatch) {
  throw new Error("'jsonforms' or 'dispatch' context wasn't provided. Are you within JsonForms?");
}
const { core } = jsonforms; // Extract core state

// --- Layout Specific Composables ---
const { layout } = useJsonFormsLayout(props);

// --- Step Configuration --- Use props.uischema
const stepsConfig = computed(() => props.uischema.options?.steps || []);
const numSteps = computed(() => stepsConfig.value.length);

// --- Current Step Logic --- Use injected core.data
const currentStep = computed(() => {
  const stepData = core!.data?.configStep;

  // Return current step if properly initialized
  if (typeof stepData === 'object' && stepData !== null && typeof stepData.current === 'number') {
    return Math.max(0, Math.min(stepData.current, numSteps.value - 1));
  }

  // Return 0 as default if not initialized yet
  return 0;
});

// Initialize configStep on mount
onMounted(async () => {
  // Wait for next tick to ensure form data is available
  await nextTick();

  const stepData = core!.data?.configStep;

  // Only initialize if configStep doesn't exist or is in wrong format
  if (!stepData || typeof stepData !== 'object' || typeof stepData.current !== 'number') {
    const initialStep = { current: 0, total: numSteps.value };
    dispatch(Actions.update('configStep', () => initialStep));
  }
});

const isLastStep = computed(() => numSteps.value > 0 && currentStep.value === numSteps.value - 1);

// --- Step Update Logic ---
const updateStep = (newStep: number) => {
  // Validate step index bounds
  if (newStep < 0 || newStep >= numSteps.value) {
    return;
  }
  // Total should be the actual number of steps, not zero-indexed
  const total = numSteps.value;
  // Update the 'configStep' property in the JSON Forms data with the new object structure
  dispatch(Actions.update('configStep', () => ({ current: newStep, total })));
};

// --- Filtered Elements for Current Step ---
const currentStepElements = computed(() => {
  const filtered = (props.uischema.elements || []).filter((element: UISchemaElement) => {
    // Check if the element has an 'options' object and an 'step' property
    return (
      typeof element.options === 'object' &&
      element.options !== null &&
      element.options.step === currentStep.value
    );
  });

  return filtered;
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
    <Stepper
      v-if="numSteps > 0"
      :modelValue="currentStep + 1"
      class="text-foreground flex w-full items-start gap-2 text-sm"
    >
      <StepperItem
        v-for="(step, index) in stepsConfig"
        :key="index"
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
    <div class="current-step-content rounded-md border p-4 shadow" :key="`step-content-${currentStep}`">
      <DispatchRenderer
        v-for="(element, index) in currentStepElements"
        :key="`${layout.path}-${index}-step-${currentStep}`"
        :schema="props.schema as JsonSchema"
        :uischema="element as UISchemaElement"
        :path="layout.path || ''"
        :renderers="layout.renderers"
        :cells="layout.cells"
        :enabled="layout.enabled && !isSubmitting"
      />
    </div>

    <!-- Navigation Buttons -->
    <div class="mt-4 flex justify-end space-x-2">
      <Button
        variant="outline"
        @click="updateStep(currentStep - 1)"
        :disabled="currentStep === 0 || isSubmitting"
      >
        Previous
      </Button>
      <!-- Show Next button only if not the last step -->
      <Button v-if="!isLastStep" @click="updateStep(currentStep + 1)" :disabled="isSubmitting">
        Next
      </Button>
      <!-- Show Submit button only on the last step -->
      <Button v-if="isLastStep" @click="submitForm" :loading="isSubmitting" :disabled="isSubmitting">
        Submit Configuration
      </Button>
    </div>
  </div>
</template>

<style scoped>
/* Add any specific styling needed */
</style>
