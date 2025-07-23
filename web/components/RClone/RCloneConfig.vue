<script lang="ts" setup>
import { computed, provide, ref, watch } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';

import { Button, jsonFormsRenderers } from '@unraid/ui';
import { JsonForms } from '@jsonforms/vue';

import { CREATE_REMOTE } from '~/components/RClone/graphql/rclone.mutations';
import { GET_RCLONE_CONFIG_FORM } from '~/components/RClone/graphql/rclone.query';
import { useUnraidApiStore } from '~/store/unraidApi';

const { offlineError: _offlineError, unraidApiStatus: _unraidApiStatus } = useUnraidApiStore();

// Define props
const props = defineProps({
  initialState: {
    type: Object,
    default: null
  }
});

// Define emit events
const emit = defineEmits(['complete']);

// Define types for form state
interface ConfigStep {
  current: number;
  total: number;
}

// Form state
const formState = ref(props.initialState || {
  configStep: 0 as number | ConfigStep,
  showAdvanced: false,
  name: '',
  type: '',
  parameters: {},
});

// Use static variables to prevent unnecessary refetches
const {
  result: formResult,
  loading: formLoading,
  refetch: updateFormSchema,
} = useQuery(GET_RCLONE_CONFIG_FORM, {
  formOptions: {
    providerType: formState.value.type || '',
    parameters: formState.value.parameters || {},
    showAdvanced: formState.value.showAdvanced || false,
  },
});

// Consolidate both watchers into a single watcher with throttling
let refetchTimeout: NodeJS.Timeout | null = null;
watch(
  formState,
  async (newValue, oldValue) => {
    // Get current step as number for comparison
    const newStep = typeof newValue.configStep === 'object' 
      ? (newValue.configStep as ConfigStep).current 
      : newValue.configStep as number;
    
    const oldStep = typeof oldValue.configStep === 'object'
      ? (oldValue.configStep as ConfigStep).current
      : oldValue.configStep as number;
    
    // Check if we need to refetch
    const shouldRefetch = 
      newValue.type !== oldValue.type ||
      newStep !== oldStep ||
      newValue.showAdvanced !== oldValue.showAdvanced;
    
    if (shouldRefetch) {
      // Log only meaningful changes
      if (newValue.type !== oldValue.type) {
        console.log('[RCloneConfig] providerType changed:', newValue.type);
      }
      
      if (newStep !== oldStep || newValue.showAdvanced !== oldValue.showAdvanced) {
        console.log('[RCloneConfig] Refetching form schema');
      }
      
      // Debounce refetch to prevent multiple rapid calls
      if (refetchTimeout) {
        clearTimeout(refetchTimeout);
      }
      
      refetchTimeout = setTimeout(async () => {
        await updateFormSchema({
          formOptions: {
            providerType: newValue.type,
            parameters: newValue.parameters,
            showAdvanced: newValue.showAdvanced,
          },
        });
        refetchTimeout = null;
      }, 100);
    }
  },
  { deep: true }
);

/**
 * Form submission and mutation handling
 */
const {
  mutate: createRemote,
  loading: isCreating,
  error: createError,
  onDone: onCreateDone,
} = useMutation(CREATE_REMOTE);

// Handle form submission
const submitForm = async () => {
  try {
    await createRemote({
      input: {
        name: formState.value.name,
        type: formState.value.type,
        parameters: formState.value.parameters,
      },
    });
  } catch (error) {
    console.error('Error creating remote:', error);
  }
};

// Handle successful creation
onCreateDone(async ({ data }) => {
  // Show success message
  if (window.toast) {
    window.toast.success('Remote Configuration Created', {
      description: `Successfully created remote "${formState.value.name}"`,
    });
  }

  console.log('[RCloneConfig] onCreateDone', data);

  // Reset form and emit complete event
  formState.value = {
    configStep: 0,
    showAdvanced: false,
    name: '',
    type: '',
    parameters: {},
  };
  
  emit('complete');
});

// Set up JSONForms config
const jsonFormsConfig = {
  restrict: false,
  trim: false,
};

const renderers = [...jsonFormsRenderers];

// Handle form data changes with debouncing to reduce excessive logging
let changeTimeout: NodeJS.Timeout | null = null;
const onChange = ({ data }: { data: Record<string, unknown> }) => {
  // Clear any pending timeout
  if (changeTimeout) {
    clearTimeout(changeTimeout);
  }
  
  // Log changes but debounce to reduce console spam
  changeTimeout = setTimeout(() => {
    console.log('[RCloneConfig] onChange received data:', JSON.stringify(data));
    changeTimeout = null;
  }, 300);
  
  // Update formState
  formState.value = data as typeof formState.value;
};

// --- Submit Button Logic ---
const uiSchema = computed(() => formResult.value?.rclone?.configForm?.uiSchema);

// Handle both number and object formats of configStep
const getCurrentStep = computed(() => {
  const step = formState.value.configStep;
  return typeof step === 'object' ? (step as ConfigStep).current : step as number;
});

// Get total steps from UI schema
const numSteps = computed(() => {
  if (uiSchema.value?.type === 'SteppedLayout') {
    return uiSchema.value?.options?.steps?.length ?? 0;
  } else if (uiSchema.value?.elements?.[0]?.type === 'SteppedLayout') {
    return uiSchema.value?.elements[0].options?.steps?.length ?? 0;
  }
  return 0;
});

const isLastStep = computed(() => {
  if (numSteps.value === 0) return false;
  return getCurrentStep.value === numSteps.value - 1;
});

// --- Provide submission logic to SteppedLayout ---
provide('submitForm', submitForm);
provide('isSubmitting', isCreating);
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-xs">
    <div class="p-6">
      <h2 class="text-xl font-medium mb-4">Configure RClone Remote</h2>

      <div v-if="createError" class="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
        {{ createError.message }}
      </div>

      <div v-if="formLoading" class="py-8 text-center text-gray-500">Loading configuration form...</div>

      <!-- Form -->
      <div v-else-if="formResult?.rclone?.configForm" class="mt-6 [&_.vertical-layout]:space-y-6">
        <JsonForms
          v-if="formResult?.rclone?.configForm"
          :schema="formResult.rclone.configForm.dataSchema"
          :uischema="formResult.rclone.configForm.uiSchema"
          :renderers="renderers"
          :data="formState"
          :config="jsonFormsConfig"
          :readonly="isCreating"
          @change="onChange"
        />
      </div>

      <!-- Submit Button (visible only on the last step) -->
      <div
        v-if="!formLoading && uiSchema && isLastStep"
        class="mt-6 flex justify-end border-t border-gray-200 pt-6"
      >
        <Button :loading="isCreating" @click="submitForm"> Submit Configuration </Button>
      </div>
    </div>
  </div>
</template>
