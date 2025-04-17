<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';

import { Button, jsonFormsRenderers } from '@unraid/ui';
import { JsonForms } from '@jsonforms/vue';

import type { CreateRCloneRemoteInput } from '~/composables/gql/graphql';

import {
  CREATE_REMOTE,
  GET_RCLONE_CONFIG_FORM,
} from '~/components/RClone/graphql/settings.query';
import { useUnraidApiStore } from '~/store/unraidApi';

const { offlineError: _offlineError, unraidApiStatus: _unraidApiStatus } = useUnraidApiStore();

// Form state
const formState = ref({
  configStep: 0,
  showAdvanced: false,
  name: '',
  type: '',
  parameters: {},
});

// Track provider changes to update form schema
const providerType = computed(() => formState.value.type || '');
const {
  result: formResult,
  loading: formLoading,
  refetch: updateFormSchema,
} = useQuery(GET_RCLONE_CONFIG_FORM, {
  providerType: formState.value.type,
  parameters: formState.value.parameters,
});

// Watch for provider type changes to update schema
watch(providerType, async (newType) => {
  if (newType) {
    await updateFormSchema({
      providerType: newType,
      parameters: formState.value.parameters,
    });
  }
});

// Watch for step changes to update schema if needed
watch(
  () => formState.value.configStep,
  async (newStep) => {
    if (newStep > 0) {
      await updateFormSchema({
        providerType: formState.value.type,
        parameters: formState.value.parameters,
      });
    }
  }
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
      } as CreateRCloneRemoteInput,
    });
  } catch (error) {
    console.error('Error creating remote:', error);
  }
};

// Handle successful creation
onCreateDone(async () => {
  // Show success message
  if (window.toast) {
    window.toast.success('Remote Configuration Created', {
      description: `Successfully created remote "${formState.value.name}"`,
    });
  }

  // Reset form and refetch remotes
  formState.value = {
    configStep: 0,
    showAdvanced: false,
    name: '',
    type: '',
    parameters: {},
  };
});

// Set up JSONForms config
const jsonFormsConfig = {
  restrict: false,
  trim: false,
};

const renderers = [...jsonFormsRenderers];

// Handle form data changes
const onChange = ({ data }: { data: Record<string, unknown> }) => {
  console.log('[RCloneConfig] onChange received data:', JSON.stringify(data));
  formState.value = data as typeof formState.value;
};

// --- Submit Button Logic ---
const uiSchema = computed(() => formResult.value?.rcloneBackup?.configForm?.uiSchema);
// Assuming the stepped layout is the first element and its type indicates steps
const numSteps = computed(() => {
  // Adjust selector based on actual UI schema structure if needed
  if (uiSchema.value?.type === 'SteppedLayout') {
    return uiSchema.value?.options?.steps?.length ?? 0;
  } else if (uiSchema.value?.elements?.[0]?.type === 'SteppedLayout') {
    // Check if it's the first element
    return uiSchema.value?.elements[0].options?.steps?.length ?? 0;
  }
  return 0; // Default or indicate error/no steps
});

const isLastStep = computed(() => {
  if (numSteps.value === 0) return false;
  return formState.value.configStep === numSteps.value - 1;
});
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
    <div class="p-6">
      <h2 class="text-xl font-medium mb-4">Configure RClone Remote</h2>

      <div v-if="createError" class="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
        {{ createError.message }}
      </div>

      <div v-if="formLoading" class="py-8 text-center text-gray-500">Loading configuration form...</div>

      <!-- Form -->
      <div v-else-if="formResult?.rcloneBackup?.configForm" class="mt-6 [&_.vertical-layout]:space-y-6">
        <JsonForms
          v-if="formResult?.rcloneBackup?.configForm"
          :schema="formResult.rcloneBackup.configForm.dataSchema"
          :uischema="formResult.rcloneBackup.configForm.uiSchema"
          :renderers="renderers"
          :data="formState"
          :config="jsonFormsConfig"
          :readonly="isCreating"
          @change="onChange"
        />
      </div>

      <!-- Submit Button (visible only on the last step) -->
      <div v-if="!formLoading && uiSchema && isLastStep" class="mt-6 flex justify-end border-t border-gray-200 pt-6">
        <Button :loading="isCreating" @click="submitForm">
          Submit Configuration
        </Button>
      </div>

    </div>
  </div>
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
</style>
