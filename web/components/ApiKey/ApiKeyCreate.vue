<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { useClipboard } from '@vueuse/core';

import {
  Button,
  Dialog,
  jsonFormsRenderers,
  jsonFormsAjv,
} from '@unraid/ui';
import { JsonForms } from '@jsonforms/vue';
import { ClipboardDocumentIcon } from '@heroicons/vue/24/solid';
import { extractGraphQLErrorMessage } from '~/helpers/functions';
import EffectivePermissions from './EffectivePermissions.vue';

import type { ApolloError } from '@apollo/client/errors';
import type { FragmentType } from '~/composables/gql/fragment-masking';
import type { ComposerTranslation } from 'vue-i18n';
import type { 
  Resource, 
  Role, 
  CreateApiKeyInput
} from '~/composables/gql/graphql';

import { useFragment } from '~/composables/gql/fragment-masking';
import { useApiKeyStore } from '~/store/apiKey';
import {
  API_KEY_FRAGMENT,
  API_KEY_FRAGMENT_WITH_KEY,
  CREATE_API_KEY,
  UPDATE_API_KEY,
} from './apikey.query';
import {
  GET_API_KEY_CREATION_FORM_SCHEMA,
  GET_API_KEY_AUTHORIZATION_FORM_SCHEMA,
} from './api-key-form.query';

interface Props {
  t?: ComposerTranslation;
}

const props = defineProps<Props>();
const { t } = props;

const apiKeyStore = useApiKeyStore();
const { modalVisible, editingKey, isAuthorizationMode, authorizationData } = storeToRefs(apiKeyStore);

// Form schema and data - these come from the backend JSON Schema service
// We parse the JSON string response into this structure
interface JsonSchemaForm {
  id: string;
  dataSchema: Record<string, unknown>;
  uiSchema?: Record<string, unknown>;
  values?: Record<string, unknown>;
}

// Form data that matches what the backend expects
// This will be transformed into CreateApiKeyInput or UpdateApiKeyInput
interface FormData extends Partial<CreateApiKeyInput> {
  keyName?: string; // Used in authorization mode
  authorizationType?: 'roles' | 'groups' | 'custom';
  permissionGroups?: string[];
  permissionPresets?: string; // For the preset dropdown
  customPermissions?: Array<{
    resources: Resource[];
    actions: string[];
  }>;
  requestedPermissions?: {
    roles?: Role[];
    permissionGroups?: string[];
    customPermissions?: Array<{
      resources: Resource[];
      actions: string[];
    }>;
  };
  consent?: boolean;
}

const formSchema = ref<JsonSchemaForm | null>(null);
const formData = ref<FormData>({});
const formValid = ref(false);

// Use clipboard for copying
const { copy, copied } = useClipboard();

// Computed property to transform formData permissions for the EffectivePermissions component
const formDataPermissions = computed(() => {
  if (!formData.value.customPermissions) return [];
  
  // Flatten the resources array into individual permission entries
  return formData.value.customPermissions.flatMap(perm =>
    perm.resources.map(resource => ({
      resource,
      actions: perm.actions
    }))
  );
});

const { mutate: createApiKey, loading: createLoading, error: createError } = useMutation(CREATE_API_KEY);
const { mutate: updateApiKey, loading: updateLoading, error: updateError } = useMutation(UPDATE_API_KEY);
const postCreateLoading = ref(false);

const loading = computed<boolean>(() => createLoading.value || updateLoading.value);
const error = computed<ApolloError | null>(() => createError.value || updateError.value);

// Load form schema based on mode
const loadFormSchema = () => {
  console.log('Loading form schema, authorization mode:', isAuthorizationMode.value);
  console.log('Available renderers:', jsonFormsRenderers);
  
  if (isAuthorizationMode.value && authorizationData.value?.scopes) {
    // Load authorization form schema
    const { onResult, onError } = useQuery(GET_API_KEY_AUTHORIZATION_FORM_SCHEMA, {
      appName: authorizationData.value.name.replace(' API Key', '') || 'Application',
      requestedScopes: authorizationData.value.scopes,
      appDescription: authorizationData.value.description,
    });
    
    onResult((result) => {
      if (result.data?.getApiKeyAuthorizationFormSchema) {
        console.log('Authorization form schema received:', result.data.getApiKeyAuthorizationFormSchema);
        formSchema.value = result.data.getApiKeyAuthorizationFormSchema;
        formData.value = result.data.getApiKeyAuthorizationFormSchema.values || {};
      }
    });
    
    onError((error) => {
      console.error('Error loading authorization form schema:', error);
    });
  } else {
    // Load creation form schema
    const { onResult, onError } = useQuery(GET_API_KEY_CREATION_FORM_SCHEMA);
    
    onResult((result) => {
      if (result.data?.getApiKeyCreationFormSchema) {
        console.log('Creation form schema received:', result.data.getApiKeyCreationFormSchema);
        formSchema.value = result.data.getApiKeyCreationFormSchema;
        
        // If editing, populate form data from existing key
        if (editingKey.value) {
          populateFormFromExistingKey();
        } else {
          // For new keys, initialize with empty data
          formData.value = {
            customPermissions: [],
            permissionPresets: 'none', // Initialize the preset dropdown
          };
        }
      }
    });
    
    onError((error) => {
      console.error('Error loading creation form schema:', error);
    });
  }
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

// Watch for permission preset selection
watch(
  () => formData.value.permissionPresets,
  (presetId) => {
    if (!presetId || presetId === 'none') return;
    
    // Define presets locally (matching backend)
    const presets: Record<string, { resources: Resource[]; actions: string[] }> = {
      docker_manager: {
        resources: ['DOCKER' as Resource],
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      vm_manager: {
        resources: ['VMS' as Resource],
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      monitoring: {
        resources: ['INFO', 'DASHBOARD', 'LOGS', 'ARRAY', 'DISK', 'NETWORK'] as Resource[],
        actions: ['read:any'],
      },
      backup_manager: {
        resources: ['FLASH', 'SHARE'] as Resource[],
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
      network_admin: {
        resources: ['NETWORK', 'SERVICES'] as Resource[],
        actions: ['create:any', 'read:any', 'update:any', 'delete:any'],
      },
    };
    
    const preset = presets[presetId];
    if (preset) {
      // Add the preset to custom permissions
      if (!formData.value.customPermissions) {
        formData.value.customPermissions = [];
      }
      formData.value.customPermissions.push({
        resources: preset.resources,
        actions: preset.actions,
      });
      
      // Reset the dropdown
      formData.value.permissionPresets = 'none';
    }
  }
);

// Populate form data from existing key
const populateFormFromExistingKey = async () => {
  if (!editingKey.value || !formSchema.value) return;
  
  const fragmentKey = useFragment(API_KEY_FRAGMENT, editingKey.value as FragmentType<typeof API_KEY_FRAGMENT>);
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
      actions: actionKey.split(','),
    }));
    
    formData.value = {
      name: fragmentKey.name,
      description: fragmentKey.description || '',
      authorizationType: fragmentKey.roles.length > 0 ? 'roles' : 'custom',
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

  if (isAuthorizationMode.value) {
    // In authorization mode, use the requested permissions
    const { roles, customPermissions } = formData.value.requestedPermissions || {};
    
    if (roles && roles.length > 0) {
      apiData.roles = roles;
    }
    
    if (customPermissions && customPermissions.length > 0) {
      // Expand resources array into individual AddPermissionInput entries
      apiData.permissions = customPermissions.flatMap(perm =>
        perm.resources.map(resource => ({
          resource,
          actions: perm.actions
        }))
      );
    }
  } else {
    // Regular creation mode - combine all selected permissions
    if (formData.value.roles && formData.value.roles.length > 0) {
      apiData.roles = formData.value.roles;
    }
    
    // Note: permissionGroups would need to be handled by backend
    // The CreateApiKeyInput doesn't have permissionGroups field yet
    // For now, we could expand them client-side by querying the permissions
    // or add backend support to handle permission groups
    
    if (formData.value.customPermissions && formData.value.customPermissions.length > 0) {
      // Expand resources array into individual AddPermissionInput entries
      apiData.permissions = formData.value.customPermissions.flatMap(perm =>
        perm.resources.map(resource => ({
          resource,
          actions: perm.actions
        }))
      );
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
  formData.value = {} as FormData; // Reset to empty object
};

// Handle form submission
async function upsertKey() {
  if (!formValid.value && !isAuthorizationMode.value) return;
  
  // In authorization mode, check consent
  if (isAuthorizationMode.value && !formData.value.consent) {
    return;
  }

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
      const fragmentData = useFragment(API_KEY_FRAGMENT_WITH_KEY, apiKeyResult.update);
      apiKeyStore.setCreatedKey(fragmentData);
    } else if (!isEdit && apiKeyResult && 'create' in apiKeyResult) {
      const fragmentData = useFragment(API_KEY_FRAGMENT_WITH_KEY, apiKeyResult.create);
      apiKeyStore.setCreatedKey(fragmentData);
      
      // If in authorization mode, call the callback with the API key
      if (isAuthorizationMode.value && authorizationData.value?.onAuthorize && 'key' in fragmentData) {
        authorizationData.value.onAuthorize(fragmentData.key);
        return; // Don't close the modal in authorization mode
      }
    }

    apiKeyStore.hideModal();
    formData.value = {} as FormData; // Reset to empty object
  } finally {
    postCreateLoading.value = false;
  }
}

// Copy API key after creation
const copyApiKey = async () => {
  const createdKey = apiKeyStore.createdKey;
  if (createdKey && 'key' in createdKey) {
    await copy(createdKey.key);
  }
};
</script>

<template>
  <!-- Authorization mode (standalone page) -->
  <div v-if="isAuthorizationMode" class="bg-white dark:bg-gray-800 rounded-lg shadow">
    <div class="p-6">
      <!-- Shared form content -->
      <template v-if="formSchema">
        <JsonForms
          :schema="formSchema.dataSchema"
          :uischema="formSchema.uiSchema"
          :renderers="jsonFormsRenderers"
          :data="formData"
          :ajv="jsonFormsAjv"
          @change="({ data, errors }) => {
            formData = data;
            formValid = errors ? errors.length === 0 : true;
          }"
        />
        
        <!-- Permissions Preview -->
        <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <EffectivePermissions
            :roles="formData.roles || []"
            :raw-permissions="formDataPermissions"
            :show-header="true"
          />
          
          <!-- Show selected roles for context -->
          <div v-if="formData.roles && formData.roles.length > 0" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
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
      </template>
      
      <!-- Action buttons for authorization mode -->
      <div class="mt-6 flex gap-3">
        <Button
          type="button"
          :disabled="loading || postCreateLoading || !formData.consent"
          :loading="loading || postCreateLoading"
          @click="upsertKey"
        >
          Authorize
        </Button>
      </div>
    </div>
  </div>
  
  <!-- Regular modal mode -->
  <Dialog
    v-else
    v-model="modalVisible"
    size="lg"
    :title="
      editingKey 
        ? (t ? t('Edit API Key') : 'Edit API Key') 
        : (t ? t('Create API Key') : 'Create API Key')
    "
    :scrollable="true"
    close-button-text="Cancel"
    :primary-button-text="
      editingKey 
        ? 'Save' 
        : 'Create'
    "
    :primary-button-loading="loading || postCreateLoading"
    :primary-button-loading-text="
      editingKey 
        ? 'Saving...' 
        : 'Creating...'
    "
    :primary-button-disabled="
      loading || 
      postCreateLoading || 
      !formValid
    "
    @update:model-value="
      (v) => {
        if (!v) close();
      }
    "
    @primary-click="upsertKey"
  >
    <div class="max-w-[800px]">
      <!-- Show authorization description if in authorization mode -->
      <div v-if="isAuthorizationMode && formSchema?.dataSchema?.description" class="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p class="text-sm">{{ formSchema.dataSchema.description }}</p>
      </div>

      <!-- Dynamic Form based on schema -->
      <div v-if="formSchema" class="[&_.vertical-layout]:space-y-4">
        
        <JsonForms
          :schema="formSchema.dataSchema"
          :uischema="formSchema.uiSchema"
          :renderers="jsonFormsRenderers"
          :data="formData"
          :ajv="jsonFormsAjv"
          @change="({ data, errors }) => {
            formData = data;
            formValid = errors ? errors.length === 0 : true;
          }"
        />
      </div>
      
      <!-- Loading state -->
      <div v-else class="flex items-center justify-center py-8">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"/>
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
      <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <EffectivePermissions
          :roles="formData.roles || []"
          :raw-permissions="formDataPermissions"
          :show-header="true"
        />
        
        <!-- Show selected roles for context -->
        <div v-if="formData.roles && formData.roles.length > 0" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
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

      <!-- Success state for authorization mode -->
      <div v-if="isAuthorizationMode && apiKeyStore.createdKey && 'key' in apiKeyStore.createdKey" class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium">API Key created successfully!</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            @click="copyApiKey"
          >
            <ClipboardDocumentIcon class="w-4 h-4 mr-2" />
            {{ copied ? 'Copied!' : 'Copy Key' }}
          </Button>
        </div>
        <code class="block mt-2 p-2 bg-white dark:bg-gray-800 rounded text-xs break-all border">
          {{ apiKeyStore.createdKey.key }}
        </code>
        <p class="text-xs text-muted-foreground mt-2">
          Save this key securely. You won't be able to see it again.
        </p>
      </div>
    </div>
  </Dialog>
</template>
