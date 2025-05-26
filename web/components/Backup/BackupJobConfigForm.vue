<script lang="ts" setup>
import { computed, provide, ref, watch } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import type { Ref } from 'vue';

import { Button, JsonForms } from '@unraid/ui';

import { CREATE_BACKUP_JOB_CONFIG_MUTATION, BACKUP_JOB_CONFIG_FORM_QUERY } from './backup-jobs.query';
import type { CreateBackupJobConfigInput, InputMaybe, PreprocessConfigInput, BackupMode } from '~/composables/gql/graphql';

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
const formState: Ref<Record<string, unknown>> = ref({});

// Get form schema
const {
  result: formResult,
  loading: formLoading,
  refetch: updateFormSchema,
} = useQuery(BACKUP_JOB_CONFIG_FORM_QUERY, {
  input: {
    showAdvanced: typeof formState.value?.showAdvanced === 'boolean' ? formState.value.showAdvanced : false,
  },
});

// Watch for changes to showAdvanced and refetch schema
let refetchTimeout: NodeJS.Timeout | null = null;
watch(
  formState,
  async (newValue, oldValue) => {
    const newStepCurrent = typeof (newValue?.configStep) === 'object' ? (newValue.configStep as ConfigStep).current : (newValue?.configStep as number);
    const oldStepCurrent = typeof (oldValue?.configStep) === 'object' ? (oldValue.configStep as ConfigStep).current : (oldValue?.configStep as number);
    const newShowAdvanced = typeof newValue?.showAdvanced === 'boolean' ? newValue.showAdvanced : false;
    const oldShowAdvanced = typeof oldValue?.showAdvanced === 'boolean' ? oldValue.showAdvanced : false;
    const shouldRefetch = newShowAdvanced !== oldShowAdvanced || newStepCurrent !== oldStepCurrent;
    if (shouldRefetch) {
      if (newShowAdvanced !== oldShowAdvanced) {
        console.log('[BackupJobConfigForm] showAdvanced changed:', newShowAdvanced);
      }
      if (newStepCurrent !== oldStepCurrent) {
        console.log('[BackupJobConfigForm] configStep.current changed:', newStepCurrent, 'from:', oldStepCurrent, 'Refetching schema.');
      }
      if (refetchTimeout) {
        clearTimeout(refetchTimeout);
      }
      refetchTimeout = setTimeout(async () => {
        await updateFormSchema({
          input: {
            showAdvanced: newShowAdvanced,
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
    const value = formState.value as Record<string, unknown>;
    console.log('value', value);
    console.log('[BackupJobConfigForm] submitForm', value);
    const input: CreateBackupJobConfigInput = {
      name: value?.name as string,
      destinationPath: value?.destinationPath as string,
      schedule: (value?.schedule as string) || '',
      enabled: value?.enabled as boolean,
      remoteName: value?.remoteName as string,
      sourcePath: (value?.sourcePath as string) || '',
      rcloneOptions: value?.rcloneOptions as Record<string, unknown>,
      preprocessConfig: value?.preprocessConfig as InputMaybe<PreprocessConfigInput> | undefined,
      backupMode: (value?.backupMode as BackupMode) || 'RAW' as BackupMode,
    };
    await createBackupJobConfig({
      input,
    });
  } catch (error) {
    console.error('Error creating backup job config:', error);
  }
};

// Handle successful creation
onCreateDone(async ({ data }) => {
  if (window.toast) {
    window.toast.success('Backup Job Created', {
      description: `Successfully created backup job "${formState.value?.name as string}"`,
    });
  }
  console.log('[BackupJobConfigForm] onCreateDone', data);
  formState.value = {};
  emit('complete');
});

const parsedOriginalErrorMessage = computed(() => {
  const originalError = createError.value?.graphQLErrors?.[0]?.extensions?.originalError;
  if (originalError && typeof originalError === 'object' && originalError !== null && 'message' in originalError) {
    return (originalError as { message: string | string[] }).message;
  }
  return undefined;
});

const onChange = ({ data }: { data: unknown }) => {
  console.log('[BackupJobConfigForm] onChange', data);
  formState.value = data as Record<string, unknown>;
};

// --- Submit Button Logic ---
const uiSchema = computed(() => formResult.value?.backupJobConfigForm?.uiSchema);

// Handle both number and object formats of configStep
const getCurrentStep = computed(() => {
  const step = formState.value?.configStep;
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
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
    <div class="p-6">
      <h2 class="text-xl font-medium mb-4 text-gray-900 dark:text-white">Configure Backup Job</h2>

      <div v-if="createError" class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-md">
        <p>{{ createError.message }}</p>
        <ul v-if="Array.isArray(parsedOriginalErrorMessage)" class="list-disc list-inside mt-2">
          <li v-for="(msg, index) in parsedOriginalErrorMessage" :key="index">{{ msg }}</li>
        </ul>
        <p v-else-if="typeof parsedOriginalErrorMessage === 'string' && parsedOriginalErrorMessage.length > 0" class="mt-2">
          {{ parsedOriginalErrorMessage }}
        </p>
      </div>

      <div v-if="formLoading" class="py-8 text-center text-gray-500 dark:text-gray-400">Loading configuration form...</div>

      <!-- Form -->
      <div v-else-if="formResult?.backupJobConfigForm" class="mt-6 [&_.vertical-layout]:space-y-6">
        <JsonForms
          v-if="formResult?.backupJobConfigForm"
          :schema="formResult.backupJobConfigForm.dataSchema"
          :uischema="formResult.backupJobConfigForm.uiSchema"
          :data="formState"
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


<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
</style> 