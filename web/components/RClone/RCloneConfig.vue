<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';

import { BrandButton, jsonFormsRenderers } from '@unraid/ui';
import { JsonForms } from '@jsonforms/vue';

import {
  CREATE_REMOTE,
  GET_RCLONE_CONFIG_FORM,
  LIST_REMOTES,
} from '~/components/RClone/graphql/settings.query';
import { useUnraidApiStore } from '~/store/unraidApi';
import type { RCloneRemote } from '~/composables/gql/graphql';
const { offlineError, unraidApiStatus } = useUnraidApiStore();

// Form state
const formState = ref({
  configStep: 0,
  showAdvanced: false,
  name: '',
  type: '',
  parameters: {},
});


// Load form schema from API
const { result: formResult, loading: formLoading } = useQuery(GET_RCLONE_CONFIG_FORM);

// Query existing remotes
const { result, refetch: refetchRemotes } = useQuery(LIST_REMOTES);
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

  await refetchRemotes();
});

// Set up JSONForms config
const jsonFormsConfig = {
  restrict: false,
  trim: false,
};

const renderers = [...jsonFormsRenderers];

// Handle form data changes
const onChange = ({ data }: { data: Record<string, unknown> }) => {
  formState.value = data as typeof formState.value;
};

// Navigate between form steps
const goToNextStep = () => {
  if (formState.value.configStep < 2) {
    formState.value.configStep++;
  }
};

const goToPreviousStep = () => {
  if (formState.value.configStep > 0) {
    formState.value.configStep--;
  }
};

// Check if form can proceed to next step
const canProceedToNextStep = computed(() => {
  if (formState.value.configStep === 0) {
    // Step 1: Need name and type
    return !!formState.value.name && !!formState.value.type;
  }

  if (formState.value.configStep === 1) {
    // Step 2: Provider-specific validation could go here
    return true;
  }

  return true;
});

// Check if form can be submitted (on last step)
const canSubmitForm = computed(() => {
  return formState.value.configStep === 2 && !!formState.value.name && !!formState.value.type;
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

        <!-- Form navigation buttons -->
        <div class="mt-6 flex justify-between">
          <BrandButton
            v-if="formState.configStep > 0"
            variant="outline"
            padding="lean"
            size="12px"
            class="leading-normal"
            :disabled="isCreating"
            @click="goToPreviousStep"
          >
            Previous
          </BrandButton>

          <div class="flex space-x-4 ml-auto">
            <BrandButton
              v-if="formState.configStep < 2"
              variant="outline-primary"
              padding="lean"
              size="12px"
              class="leading-normal"
              :disabled="!canProceedToNextStep || isCreating"
              @click="goToNextStep"
            >
              Next
            </BrandButton>

            <BrandButton
              v-if="formState.configStep === 2"
              variant="fill"
              padding="lean"
              size="12px"
              class="leading-normal"
              :disabled="!canSubmitForm || isCreating"
              @click="submitForm"
            >
              Create Remote
            </BrandButton>
          </div>
        </div>
      </div>

      <!-- Existing remotes list -->
      <div v-if="existingRemotes?.length > 0" class="mt-10">
        <h3 class="text-lg font-medium mb-4">Configured Remotes</h3>
        <div class="space-y-4">
          <div
            v-for="remote in existingRemotes"
            :key="remote.name"
            class="p-4 border border-gray-200 rounded-md"
          >
            <div class="flex justify-between items-center">
              <div>
                <h4 class="font-medium">{{ remote.name }}</h4>
                <div class="text-sm text-gray-500">Type: {{ remote.type }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
</style>
