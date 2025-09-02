<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { useClipboardWithToast } from '~/composables/useClipboardWithToast';

import { ClipboardDocumentIcon } from '@heroicons/vue/24/solid';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button, 
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalFooter,
  jsonFormsAjv, 
  jsonFormsRenderers 
} from '@unraid/ui';
import { JsonForms } from '@jsonforms/vue';
import { extractGraphQLErrorMessage } from '~/helpers/functions';

import type { ApolloError } from '@apollo/client/errors';
import type { FragmentType } from '~/composables/gql/fragment-masking';
import type {
  ApiKeyFormSettings,
  AuthAction,
  CreateApiKeyInput,
  Resource,
  Role,
} from '~/composables/gql/graphql';
import type { ComposerTranslation } from 'vue-i18n';

import { useFragment } from '~/composables/gql/fragment-masking';
import { useApiKeyPermissionPresets } from '~/composables/useApiKeyPermissionPresets';
import { useApiKeyStore } from '~/store/apiKey';
import { GET_API_KEY_CREATION_FORM_SCHEMA } from './api-key-form.query';
import { API_KEY_FRAGMENT, CREATE_API_KEY, UPDATE_API_KEY } from './apikey.query';
import DeveloperAuthorizationLink from './DeveloperAuthorizationLink.vue';
import EffectivePermissions from './EffectivePermissions.vue';

interface Props {
  t?: ComposerTranslation;
}

const props = defineProps<Props>();
const { t } = props;

const apiKeyStore = useApiKeyStore();
const { modalVisible, editingKey, isAuthorizationMode, authorizationData, createdKey } =
  storeToRefs(apiKeyStore);

// Form data that matches what the backend expects
// This will be transformed into CreateApiKeyInput or UpdateApiKeyInput
interface FormData extends Partial<CreateApiKeyInput> {
  keyName?: string; // Used in authorization mode
  permissionGroups?: string[];
  permissionPresets?: string; // For the preset dropdown
  customPermissions?: Array<{
    resources: Resource[];
    actions: AuthAction[];
  }>;
  requestedPermissions?: {
    roles?: Role[];
    permissionGroups?: string[];
    customPermissions?: Array<{
      resources: Resource[];
      actions: AuthAction[];
    }>;
  };
  consent?: boolean;
}

const formSchema = ref<ApiKeyFormSettings | null>(null);
const formData = ref<FormData>({
  customPermissions: [],
  roles: [],
} as FormData);
const formValid = ref(false);

// Use clipboard for copying
const { copyWithNotification, copied } = useClipboardWithToast();

// Computed property to transform formData permissions for the EffectivePermissions component
const formDataPermissions = computed(() => {
  // Explicitly depend on the array length to ensure reactivity when going to/from empty
  const permissions = formData.value.customPermissions;
  const permissionCount = permissions?.length ?? 0;
  
  if (!permissions || permissionCount === 0) return [];

  // Flatten the resources array into individual permission entries
  return permissions.flatMap((perm) =>
    perm.resources.map((resource) => ({
      resource,
      actions: perm.actions, // Already string[] which can be AuthAction values
    }))
  );
});

const { mutate: createApiKey, loading: createLoading, error: createError } = useMutation(CREATE_API_KEY);
const { mutate: updateApiKey, loading: updateLoading, error: updateError } = useMutation(UPDATE_API_KEY);
const postCreateLoading = ref(false);

const loading = computed<boolean>(() => createLoading.value || updateLoading.value);
const error = computed<ApolloError | null>(() => createError.value || updateError.value);

// Computed property for button disabled state
const isButtonDisabled = computed<boolean>(() => {
  // In authorization mode, only check loading states if we have a name
  if (isAuthorizationMode.value && (formData.value.name || authorizationData.value?.formData?.name)) {
    return loading.value || postCreateLoading.value;
  }

  // Regular validation for non-authorization mode
  return loading.value || postCreateLoading.value || !formValid.value;
});

// Load form schema - always use creation form
const loadFormSchema = () => {
  // Always load creation form schema
  const { onResult, onError } = useQuery(GET_API_KEY_CREATION_FORM_SCHEMA);

  onResult(async (result) => {
    if (result.data?.getApiKeyCreationFormSchema) {
      formSchema.value = result.data.getApiKeyCreationFormSchema;

      if (isAuthorizationMode.value && authorizationData.value?.formData) {
        // In authorization mode, use the form data from the authorization store
        formData.value = { ...authorizationData.value.formData };
        // Ensure the name field is set for validation
        if (!formData.value.name && authorizationData.value.name) {
          formData.value.name = authorizationData.value.name;
        }

        // In auth mode, if we have all required fields, consider it valid initially
        // JsonForms will override this if there are actual errors
        if (formData.value.name) {
          formValid.value = true;
        }
      } else if (editingKey.value) {
        // If editing, populate form data from existing key
        populateFormFromExistingKey();
      } else {
        // For new keys, initialize with empty data
        formData.value = {
          customPermissions: [],
          roles: [],
        };
        // Set formValid to true initially for new keys
        // JsonForms will update this if there are validation errors
        formValid.value = true;
      }
    }
  });

  onError((error) => {
    console.error('Error loading creation form schema:', error);
  });
};

// Initialize form on mount
onMounted(() => {
  loadFormSchema();
});

// Watch for editing key changes
watch(
  () => editingKey.value,
  () => {
    if (!isAuthorizationMode.value) {
      populateFormFromExistingKey();
    }
  }
);

// Watch for authorization mode changes
watch(
  () => isAuthorizationMode.value,
  async (newValue) => {
    if (newValue && authorizationData.value?.formData) {
      formData.value = { ...authorizationData.value.formData };
      // Ensure the name field is set for validation
      if (!formData.value.name && authorizationData.value.name) {
        formData.value.name = authorizationData.value.name;
      }

      // Set initial valid state if we have required fields
      if (formData.value.name) {
        formValid.value = true;
      }
    }
  }
);

// Watch for authorization form data changes
watch(
  () => authorizationData.value?.formData,
  (newFormData) => {
    if (isAuthorizationMode.value && newFormData) {
      formData.value = { ...newFormData };
      // Ensure the name field is set for validation
      if (!formData.value.name && authorizationData.value?.name) {
        formData.value.name = authorizationData.value.name;
      }
    }
  },
  { deep: true }
);

// Use the permission presets composable
const { applyPreset } = useApiKeyPermissionPresets();

// Watch for permission preset selection and expand into custom permissions
watch(
  () => formData.value.permissionPresets,
  (presetId) => {
    if (!presetId || presetId === 'none') return;

    // Apply the preset to custom permissions
    formData.value.customPermissions = applyPreset(presetId, formData.value.customPermissions);

    // Reset the dropdown back to 'none'
    formData.value.permissionPresets = 'none';
  }
);

// Populate form data from existing key
const populateFormFromExistingKey = async () => {
  if (!editingKey.value || !formSchema.value) return;

  const fragmentKey = useFragment(
    API_KEY_FRAGMENT,
    editingKey.value as FragmentType<typeof API_KEY_FRAGMENT>
  );
  if (fragmentKey) {
    // Group permissions by actions for better UI
    const permissionGroups = new Map<string, Resource[]>();
    if (fragmentKey.permissions) {
      for (const perm of fragmentKey.permissions) {
        // Create a copy of the actions array to avoid modifying read-only data
        const actionKey = [...perm.actions].sort().join(',');
        if (!permissionGroups.has(actionKey)) {
          permissionGroups.set(actionKey, []);
        }
        permissionGroups.get(actionKey)!.push(perm.resource);
      }
    }

    const customPermissions = Array.from(permissionGroups.entries()).map(([actionKey, resources]) => ({
      resources,
      actions: actionKey.split(',') as AuthAction[], // Actions are now already in correct format
    }));

    formData.value = {
      name: fragmentKey.name,
      description: fragmentKey.description || '',
      roles: [...fragmentKey.roles],
      customPermissions,
    };
  }
};

// Transform form data to API format
const transformFormDataForApi = (): CreateApiKeyInput => {
  const apiData: CreateApiKeyInput = {
    name: formData.value.name || formData.value.keyName || '',
    description: formData.value.description,
    roles: [],
    permissions: undefined,
  };

  // Both authorization and regular mode now use the same form structure
  if (formData.value.roles && formData.value.roles.length > 0) {
    apiData.roles = formData.value.roles;
  }

  // Note: permissionGroups would need to be handled by backend
  // The CreateApiKeyInput doesn't have permissionGroups field yet
  // For now, we could expand them client-side by querying the permissions
  // or add backend support to handle permission groups

  // Always include permissions array, even if empty (for updates to clear permissions)
  if (formData.value.customPermissions) {
    // Expand resources array into individual AddPermissionInput entries
    apiData.permissions = formData.value.customPermissions.flatMap((perm) =>
      perm.resources.map((resource) => ({
        resource,
        actions: perm.actions,
      }))
    );
  } else {
    // If customPermissions is undefined or null, and we're editing,
    // we should still send an empty array to clear permissions
    if (editingKey.value) {
      apiData.permissions = [];
    }
  }

  // Note: expiresAt field would need to be added to CreateApiKeyInput type
  // if (formData.value.expiresAt) {
  //   apiData.expiresAt = formData.value.expiresAt;
  // }

  return apiData;
};

const close = () => {
  apiKeyStore.hideModal();
  formData.value = {
    customPermissions: [],
    roles: [],
  } as FormData;
};

// Handle form submission
async function upsertKey() {
  // In authorization mode, skip validation if we have a name
  if (!isAuthorizationMode.value && !formValid.value) {
    return;
  }
  if (isAuthorizationMode.value && !formData.value.name) {
    console.error('Cannot authorize without a name');
    return;
  }

  // In authorization mode, validation is enough - no separate consent field

  postCreateLoading.value = true;
  try {
    const apiData = transformFormDataForApi();

    const isEdit = !!editingKey.value?.id;

    let res;
    if (isEdit && editingKey.value) {
      res = await updateApiKey({
        input: {
          id: editingKey.value.id,
          ...apiData,
        },
      });
    } else {
      res = await createApiKey({
        input: apiData,
      });
    }

    const apiKeyResult = res?.data?.apiKey;
    if (isEdit && apiKeyResult && 'update' in apiKeyResult) {
      const fragmentData = useFragment(API_KEY_FRAGMENT, apiKeyResult.update);
      apiKeyStore.setCreatedKey(fragmentData);
    } else if (!isEdit && apiKeyResult && 'create' in apiKeyResult) {
      const fragmentData = useFragment(API_KEY_FRAGMENT, apiKeyResult.create);
      apiKeyStore.setCreatedKey(fragmentData);

      // If in authorization mode, call the callback with the API key
      if (isAuthorizationMode.value && authorizationData.value?.onAuthorize && 'key' in fragmentData) {
        authorizationData.value.onAuthorize(fragmentData.key);
        // Don't close the modal or reset form - let the callback handle it
        return;
      }
    }

    apiKeyStore.hideModal();
    formData.value = {
      customPermissions: [],
      roles: [],
    } as FormData;
  } catch (error) {
    console.error('Error in upsertKey:', error);
  } finally {
    postCreateLoading.value = false;
  }
}

// Copy API key after creation
const copyApiKey = async () => {
  if (createdKey.value && 'key' in createdKey.value) {
    await copyWithNotification(createdKey.value.key, 'API key copied to clipboard');
  }
};
</script>

<template>
  <!-- Modal mode (handles both regular creation and authorization) -->
  <ResponsiveModal
    v-if="modalVisible"
    :open="modalVisible"
    sheet-side="bottom"
    :sheet-class="'h-[100vh] flex flex-col'"
    :dialog-class="'max-w-4xl max-h-[90vh] overflow-hidden'"
    :show-close-button="true"
    @update:open="
      (v) => {
        if (!v) close();
      }
    "
  >
    <ResponsiveModalHeader>
      <ResponsiveModalTitle>
        {{
          isAuthorizationMode
            ? 'Authorize API Key Access'
            : editingKey
              ? t
                ? t('Edit API Key')
                : 'Edit API Key'
              : t
                ? t('Create API Key')
                : 'Create API Key'
        }}
      </ResponsiveModalTitle>
    </ResponsiveModalHeader>
    
    <div class="flex-1 overflow-y-auto p-6 w-full">
      <!-- Show authorization description if in authorization mode -->
      <div
        v-if="isAuthorizationMode && formSchema?.dataSchema?.description"
        class="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
      >
        <p class="text-sm">{{ formSchema.dataSchema.description }}</p>
      </div>

      <!-- Dynamic Form based on schema -->
      <div
        v-if="formSchema"
        class="[&_.vertical-layout]:space-y-4"
        @click.stop
        @mousedown.stop
        @focus.stop
      >
        <JsonForms
          :schema="formSchema.dataSchema"
          :uischema="formSchema.uiSchema"
          :renderers="jsonFormsRenderers"
          :data="formData"
          :ajv="jsonFormsAjv"
          @change="
            ({ data, errors }) => {
              formData = data;
              formValid = errors ? errors.length === 0 : true;
            }
          "
        />
      </div>

      <!-- Loading state -->
      <div v-else class="flex items-center justify-center py-8">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p class="text-sm text-muted-foreground">Loading form...</p>
        </div>
      </div>

      <!-- Error display -->
      <div v-if="error" class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p class="text-sm text-red-600 dark:text-red-400">
          {{ extractGraphQLErrorMessage(error) }}
        </p>
      </div>

      <!-- Permissions Preview -->
      <div class="mt-6 p-4 bg-muted/50 rounded-lg border border-muted">
        <EffectivePermissions
          :roles="formData.roles || []"
          :raw-permissions="formDataPermissions"
          :show-header="true"
        />

        <!-- Show selected roles for context -->
        <div
          v-if="formData.roles && formData.roles.length > 0"
          class="mt-3 pt-3 border-t border-muted border-gray-200 dark:border-gray-700"
        >
          <div class="text-xs text-gray-600 dark:text-gray-400 mb-1">Selected Roles:</div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="role in formData.roles"
              :key="role"
              class="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded text-xs"
            >
              {{ role }}
            </span>
          </div>
        </div>
      </div>

      <!-- Developer Tools Accordion (hide in authorization flow) -->
      <div v-if="!isAuthorizationMode" class="mt-4">
        <Accordion type="single" collapsible class="w-full">
          <AccordionItem value="developer-tools">
            <AccordionTrigger>
              <span class="text-sm font-semibold">Developer Tools</span>
            </AccordionTrigger>
            <AccordionContent>
              <div class="py-2">
                <DeveloperAuthorizationLink
                  :roles="formData.roles || []"
                  :raw-permissions="formDataPermissions"
                  :app-name="formData.name || 'My Application'"
                  :app-description="formData.description || 'API key for my application'"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <!-- Success state for authorization mode -->
      <div
        v-if="isAuthorizationMode && createdKey && 'key' in createdKey"
        class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium">API Key created successfully!</span>
          <Button type="button" variant="ghost" size="sm" @click="copyApiKey">
            <ClipboardDocumentIcon class="w-4 h-4 mr-2" />
            {{ copied ? 'Copied!' : 'Copy Key' }}
          </Button>
        </div>
        <code class="block mt-2 p-2 bg-white dark:bg-gray-800 rounded text-xs break-all border">
          {{ createdKey.key }}
        </code>
        <p class="text-xs text-muted-foreground mt-2">Save this key securely for your application.</p>
      </div>
    </div>

    <ResponsiveModalFooter>
      <div class="flex justify-end gap-2 w-full">
        <Button variant="secondary" @click="close()">
          Cancel
        </Button>
        <Button
          variant="primary"
          :disabled="isButtonDisabled || loading || postCreateLoading"
          @click="upsertKey"
        >
          <span v-if="loading || postCreateLoading">
            {{ isAuthorizationMode ? 'Authorizing...' : editingKey ? 'Saving...' : 'Creating...' }}
          </span>
          <span v-else>
            {{ isAuthorizationMode ? 'Authorize' : editingKey ? 'Save' : 'Create' }}
          </span>
        </Button>
      </div>
    </ResponsiveModalFooter>
  </ResponsiveModal>
</template>
