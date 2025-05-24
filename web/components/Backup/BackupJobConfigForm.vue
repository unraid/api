<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
    <div class="p-6">
      <h2 class="text-xl font-medium mb-4 text-gray-900 dark:text-white">Configure Backup Job</h2>

      <div v-if="createError" class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-md">
        {{ createError.message }}
      </div>

      <div v-if="formLoading" class="py-8 text-center text-gray-500 dark:text-gray-400">Loading configuration form...</div>

      <!-- Form -->
      <div v-else-if="formResult?.backupJobConfigForm" class="mt-6 [&_.vertical-layout]:space-y-6">
        <JsonForms
          v-if="formResult?.backupJobConfigForm"
          :schema="formResult.backupJobConfigForm.dataSchema"
          :uischema="formResult.backupJobConfigForm.uiSchema"
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
        class="mt-6 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-6"
      >
        <Button variant="outline" @click="emit('cancel')">
          Cancel
        </Button>
        <Button :loading="isCreating" @click="submitForm">
          Create Backup Job
        </Button>
      </div>

      <!-- If there's no stepped layout, show buttons at the bottom -->
      <div
        v-if="!formLoading && (!uiSchema || (numSteps === 0))"
        class="mt-6 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-6"
      >
        <Button variant="outline" @click="emit('cancel')">
          Cancel
        </Button>
        <Button :loading="isCreating" @click="submitForm">
          Create Backup Job
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, provide, ref, watch } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';

import { Button, jsonFormsRenderers } from '@unraid/ui';
import { JsonForms } from '@jsonforms/vue';

import { CREATE_BACKUP_JOB_CONFIG_MUTATION, BACKUP_JOB_CONFIG_FORM_QUERY } from './backup-jobs.query';

// Define emit events
const emit = defineEmits<{
  complete: []
  cancel: []
}>()

// Define types for form state
interface ConfigStep {
  current: number;
  total: number;
}

// Form state
const formState = ref({
  configStep: 0 as number | ConfigStep,
  showAdvanced: false,
  name: '',
  sourcePath: '',
  remoteName: '',
  destinationPath: '',
  schedule: '0 2 * * *',
  enabled: true,
  rcloneOptions: {},
});

// Get form schema
const {
  result: formResult,
  loading: formLoading,
  refetch: updateFormSchema,
} = useQuery(BACKUP_JOB_CONFIG_FORM_QUERY, {
  input: {
    showAdvanced: formState.value.showAdvanced || false,
  },
});

// Watch for changes to showAdvanced and refetch schema
let refetchTimeout: NodeJS.Timeout | null = null;
watch(
  formState,
  async (newValue, oldValue) => {
    if (newValue.showAdvanced !== oldValue.showAdvanced) {
      console.log('[BackupJobConfigForm] showAdvanced changed:', newValue.showAdvanced);
      
      // Debounce refetch to prevent multiple rapid calls
      if (refetchTimeout) {
        clearTimeout(refetchTimeout);
      }
      
      refetchTimeout = setTimeout(async () => {
        await updateFormSchema({
          input: {
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
  mutate: createBackupJobConfig,
  loading: isCreating,
  error: createError,
  onDone: onCreateDone,
} = useMutation(CREATE_BACKUP_JOB_CONFIG_MUTATION);

// Handle form submission
const submitForm = async () => {
  try {
    await createBackupJobConfig({
      input: {
        name: formState.value.name,
        sourcePath: formState.value.sourcePath,
        remoteName: formState.value.remoteName,
        destinationPath: formState.value.destinationPath,
        schedule: formState.value.schedule,
        enabled: formState.value.enabled,
        rcloneOptions: formState.value.rcloneOptions,
      },
    });
  } catch (error) {
    console.error('Error creating backup job config:', error);
  }
};

// Handle successful creation
onCreateDone(async ({ data }) => {
  // Show success message
  if (window.toast) {
    window.toast.success('Backup Job Created', {
      description: `Successfully created backup job "${formState.value.name}"`,
    });
  }

  console.log('[BackupJobConfigForm] onCreateDone', data);

  // Reset form and emit complete event
  formState.value = {
    configStep: 0,
    showAdvanced: false,
    name: '',
    sourcePath: '',
    remoteName: '',
    destinationPath: '',
    schedule: '0 2 * * *',
    enabled: true,
    rcloneOptions: {},
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
    console.log('[BackupJobConfigForm] onChange received data:', JSON.stringify(data));
    changeTimeout = null;
  }, 300);
  
  // Update formState
  formState.value = data as typeof formState.value;
};

// --- Submit Button Logic ---
const uiSchema = computed(() => formResult.value?.backupJobConfigForm?.uiSchema);

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

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
</style> 