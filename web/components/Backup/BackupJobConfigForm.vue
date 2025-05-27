<script lang="ts" setup>
import { computed, provide, ref, watch } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';

import { Button, JsonForms } from '@unraid/ui';

import type {
  BackupJobConfig,
  CreateBackupJobConfigInput,
  UpdateBackupJobConfigInput,
} from '~/composables/gql/graphql';
import type { Ref } from 'vue';

import {
  BACKUP_JOB_CONFIG_FORM_QUERY,
  BACKUP_JOB_CONFIG_QUERY,
  CREATE_BACKUP_JOB_CONFIG_MUTATION,
  UPDATE_BACKUP_JOB_CONFIG_MUTATION,
} from './backup-jobs.query';

// Define props
const props = defineProps<{
  configId?: string | null;
}>();

// Define emit events
const emit = defineEmits<{
  complete: [];
  cancel: [];
}>();

// Define types for form state
interface ConfigStep {
  current: number;
  total: number;
}

// Determine if we are in edit mode
const isEditMode = computed(() => !!props.configId);

// Form state
const formState: Ref<Record<string, unknown>> = ref({}); // Using unknown for now due to dynamic nature of JsonForms data

// Get form schema
const {
  result: formResult,
  loading: formLoading,
  refetch: updateFormSchema,
} = useQuery(BACKUP_JOB_CONFIG_FORM_QUERY, () => ({
  input: {
    showAdvanced:
      typeof formState.value?.showAdvanced === 'boolean' ? formState.value.showAdvanced : false,
  },
}));

// Fetch existing config data if in edit mode
const {
  result: existingConfigResult,
  loading: existingConfigLoading,
  onError: onExistingConfigError,
  refetch: refetchExistingConfig,
} = useQuery(
  BACKUP_JOB_CONFIG_QUERY,
  () => ({ id: props.configId! }),
  () => ({
    enabled: isEditMode.value,
    fetchPolicy: 'network-only',
  })
);

onExistingConfigError((err) => {
  console.error('Error fetching existing backup job config:', err);
  if (window.toast) {
    window.toast.error('Failed to load backup job data for editing.');
  }
});

watch(
  existingConfigResult,
  (newVal) => {
    if (newVal?.backupJobConfig && isEditMode.value) {
      const config = newVal.backupJobConfig as BackupJobConfig;

      const {
        __typename,
        id,
        currentJob,
        sourceConfig: fetchedSourceConfig,
        destinationConfig: fetchedDestinationConfig,
        schedule,
        createdAt,
        updatedAt,
        lastRunAt,
        lastRunStatus,
        ...baseConfigFields
      } = config;

      const populatedDataForForm: Record<string, unknown> = {
        ...baseConfigFields,
        schedule: schedule,
      };

      if (fetchedSourceConfig) {
        const { __typename: st, ...sourceData } = fetchedSourceConfig as Record<string, unknown>;
        populatedDataForForm.sourceConfig = sourceData;
        if (typeof sourceData.type === 'string') {
          populatedDataForForm.sourceType = sourceData.type;
        }
      }

      if (fetchedDestinationConfig) {
        const { __typename: dt, ...destData } = fetchedDestinationConfig as Record<string, unknown>;
        populatedDataForForm.destinationConfig = destData;
        if (typeof destData.type === 'string') {
          populatedDataForForm.destinationType = destData.type;
        }
      }

      const finalFormData = { ...(formState.value || {}), ...populatedDataForForm };

      const cleanedFormData: Record<string, unknown> = {};
      for (const key in finalFormData) {
        if (
          Object.prototype.hasOwnProperty.call(finalFormData, key) &&
          finalFormData[key] !== undefined
        ) {
          cleanedFormData[key] = finalFormData[key];
        }
      }

      formState.value = cleanedFormData;
      console.log('[BackupJobConfigForm] Populated formState with existing data:', formState.value);
    }
  },
  { immediate: true, deep: true }
);

// Watch for changes to showAdvanced and refetch schema
let refetchTimeout: NodeJS.Timeout | null = null;
watch(
  formState,
  async (newValue, oldValue) => {
    const newStepCurrent = (newValue?.configStep as ConfigStep)?.current ?? 0;
    const oldStepCurrent = (oldValue?.configStep as ConfigStep)?.current ?? 0;
    const newShowAdvanced = typeof newValue?.showAdvanced === 'boolean' ? newValue.showAdvanced : false;
    const oldShowAdvanced = typeof oldValue?.showAdvanced === 'boolean' ? oldValue.showAdvanced : false;
    const shouldRefetch = newShowAdvanced !== oldShowAdvanced || newStepCurrent !== oldStepCurrent;

    if (shouldRefetch) {
      if (newShowAdvanced !== oldShowAdvanced) {
        console.log('[BackupJobConfigForm] showAdvanced changed:', newShowAdvanced);
      }
      if (newStepCurrent !== oldStepCurrent) {
        console.log(
          '[BackupJobConfigForm] configStep.current changed:',
          newStepCurrent,
          'from:',
          oldStepCurrent,
          'Refetching schema.'
        );
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

const {
  mutate: updateBackupJobConfig,
  loading: isUpdating,
  error: updateError,
  onDone: onUpdateDone,
} = useMutation(UPDATE_BACKUP_JOB_CONFIG_MUTATION);

const isLoading = computed(
  () =>
    isCreating.value ||
    isUpdating.value ||
    formLoading.value ||
    (isEditMode.value && existingConfigLoading.value)
);
const mutationError = computed(() => createError.value || updateError.value);

// Handle form submission
const submitForm = async () => {
  try {
    // Remove form-specific state like configStep or showAdvanced before submission.
    // Also remove sourceType and destinationType as they are likely derived for the UI
    // and the mutation probably expects type information within the nested config objects.
    const {
      configStep,
      showAdvanced,
      sourceType, // Destructure to exclude from inputData
      destinationType, // Destructure to exclude from inputData
      ...mutationInputData // Contains name, enabled, schedule, sourceConfig (obj), destinationConfig (obj)
    } = formState.value;

    // The mutationInputData should now align with CreateBackupJobConfigInput / UpdateBackupJobConfigInput
    // which expect nested sourceConfig and destinationConfig.
    const finalPayload = mutationInputData as unknown;

    if (isEditMode.value && props.configId) {
      await updateBackupJobConfig({
        id: props.configId,
        // The `input` here should strictly match UpdateBackupJobConfigInput
        input: finalPayload as UpdateBackupJobConfigInput,
      });
    } else {
      await createBackupJobConfig({
        // The `input` here should strictly match CreateBackupJobConfigInput
        input: finalPayload as CreateBackupJobConfigInput,
      });
    }
  } catch (error) {
    console.error(`Error ${isEditMode.value ? 'updating' : 'creating'} backup job config:`, error);
  }
};

// Handle successful creation/update
const onMutationSuccess = (isUpdate: boolean) => {
  if (window.toast) {
    window.toast.success(`Backup Job ${isUpdate ? 'Updated' : 'Created'}`, {
      description: `Successfully ${isUpdate ? 'updated' : 'created'} backup job "${formState.value?.name as string}"`,
    });
  }
  console.log(`[BackupJobConfigForm] on${isUpdate ? 'Update' : 'Create'}Done`);
  formState.value = {};
  emit('complete');
};

onCreateDone(() => onMutationSuccess(false));
onUpdateDone(() => onMutationSuccess(true));

const parsedOriginalErrorMessage = computed(() => {
  const originalError = mutationError.value?.graphQLErrors?.[0]?.extensions?.originalError;
  if (
    originalError &&
    typeof originalError === 'object' &&
    originalError !== null &&
    'message' in originalError
  ) {
    return (originalError as { message: string | string[] }).message;
  }
  return undefined;
});

let changeTimeout: NodeJS.Timeout | null = null;
const onChange = ({ data }: { data: Record<string, unknown> }) => {
  if (changeTimeout) {
    clearTimeout(changeTimeout);
  }

  changeTimeout = setTimeout(() => {
    console.log('[BackupJobConfigForm] onChange', data);
    changeTimeout = null;
  }, 300);

  formState.value = data;
};

provide('submitForm', submitForm);
provide('isSubmitting', isLoading);
</script>

<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
  >
    <div class="p-6">
      <h2 class="text-xl font-medium mb-4 text-gray-900 dark:text-white">
        {{ isEditMode ? 'Edit Backup Job' : 'Configure Backup Job' }}
      </h2>

      <div
        v-if="mutationError"
        class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-md"
      >
        <p>{{ mutationError.message }}</p>
        <ul v-if="Array.isArray(parsedOriginalErrorMessage)" class="list-disc list-inside mt-2">
          <li v-for="(msg, index) in parsedOriginalErrorMessage" :key="index">{{ msg }}</li>
        </ul>
        <p
          v-else-if="
            typeof parsedOriginalErrorMessage === 'string' && parsedOriginalErrorMessage.length > 0
          "
          class="mt-2"
        >
          {{ parsedOriginalErrorMessage }}
        </p>
      </div>

      <div
        v-if="isLoading || (isEditMode && existingConfigLoading && !formResult)"
        class="py-8 text-center text-gray-500 dark:text-gray-400"
      >
        {{
          isEditMode && existingConfigLoading
            ? 'Loading existing job data...'
            : 'Loading configuration form...'
        }}
      </div>

      <!-- Form -->
      <div v-else-if="formResult?.backupJobConfigForm" class="mt-6 [&_.vertical-layout]:space-y-6">
        <JsonForms
          v-if="formResult?.backupJobConfigForm"
          :schema="formResult.backupJobConfigForm.dataSchema"
          :uischema="formResult.backupJobConfigForm.uiSchema"
          :data="formState"
          :readonly="isLoading"
          @change="onChange"
        />
      </div>

      <div
        v-else-if="!isLoading && !formResult?.backupJobConfigForm"
        class="py-8 text-center text-gray-500 dark:text-gray-400"
      >
        Could not load form configuration. Please try again.
        <Button
          v-if="isEditMode"
          variant="link"
          @click="
            async () => {
              await refetchExistingConfig?.();
              await updateFormSchema();
            }
          "
        >
          Retry loading data
        </Button>
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
</style>
