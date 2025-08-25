<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue';
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
import DeveloperAuthorizationLink from './DeveloperAuthorizationLink.vue';

import type { ApolloError } from '@apollo/client/errors';
import type { FragmentType } from '~/composables/gql/fragment-masking';
import type { ComposerTranslation } from 'vue-i18n';
import { AuthAction } from '~/composables/gql/graphql';
import type { CreateApiKeyInput , Resource, Role } from '~/composables/gql/graphql';

import { useFragment } from '~/composables/gql/fragment-masking';
import { useApiKeyStore } from '~/store/apiKey';
import {
  API_KEY_FRAGMENT,
  CREATE_API_KEY,
  UPDATE_API_KEY,
} from './apikey.query';
import {
  GET_API_KEY_CREATION_FORM_SCHEMA,
} from './api-key-form.query';

interface Props {
  t?: ComposerTranslation;
}

const props = defineProps<Props>();
const { t } = props;

const apiKeyStore = useApiKeyStore();
const { modalVisible, editingKey, isAuthorizationMode, authorizationData, createdKey } = storeToRefs(apiKeyStore);

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

const formSchema = ref<JsonSchemaForm | null>(null);
const formData = ref<FormData>({});
const formValid = ref(false);
const jsonFormsKey = ref(0); // Key to force re-render of JsonForms

// Use clipboard for copying
const { copy, copied } = useClipboard();

// Computed property to transform formData permissions for the EffectivePermissions component
const formDataPermissions = computed(() => {
  if (!formData.value.customPermissions) return [];
  
  // Flatten the resources array into individual permission entries
  return formData.value.customPermissions.flatMap(perm =>
    perm.resources.map(resource => ({
      resource,
      actions: perm.actions // Already string[] which can be AuthAction values
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
      
      console.log('Form schema loaded - action enum values:', {
        actionEnum: formSchema.value?.dataSchema?.properties?.customPermissions?.items?.properties?.actions?.items?.enum,
        fullSchema: formSchema.value?.dataSchema
      });
      
      if (isAuthorizationMode.value && authorizationData.value?.formData) {
        // In authorization mode, use the form data from the authorization store
        formData.value = { ...authorizationData.value.formData };
        // Ensure the name field is set for validation
        if (!formData.value.name && authorizationData.value.name) {
          formData.value.name = authorizationData.value.name;
        }
        
        console.log('Setting form data in auth mode:', {
          formData: formData.value,
          permissions: formData.value.customPermissions,
          firstActions: formData.value.customPermissions?.[0]?.actions,
          schemaEnumValues: formSchema.value?.dataSchema?.properties?.customPermissions?.items?.properties?.actions?.items?.enum,
          areEqual: formData.value.customPermissions?.[0]?.actions?.[0] === formSchema.value?.dataSchema?.properties?.customPermissions?.items?.properties?.actions?.items?.enum?.[0]
        });
        
        // Force JsonForms to re-render and validate with the new data
        await nextTick();
        jsonFormsKey.value++; // Force re-render
        console.log('Triggered JsonForms re-render in auth mode');
        
        // In auth mode, if we have all required fields, consider it valid initially
        // JsonForms will override this if there are actual errors
        if (formData.value.name) {
          formValid.value = true;
          console.log('Set initial formValid=true for auth mode with name');
        }
      } else if (editingKey.value) {
        // If editing, populate form data from existing key
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
      
      // Force JsonForms to re-render and validate
      await nextTick();
      jsonFormsKey.value++;
      console.log('Triggered JsonForms re-render (mode changed)');
      
      // Set initial valid state if we have required fields
      if (formData.value.name) {
        formValid.value = true;
        console.log('Set initial formValid=true (mode changed)');
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


// Watch for permission preset selection
watch(
  () => formData.value.permissionPresets,
  (presetId) => {
    if (!presetId || presetId === 'none') return;
    
    // Define presets locally (matching backend) - using AuthAction
    const presets: Record<string, { resources: Resource[]; actions: AuthAction[] }> = {
      docker_manager: {
        resources: ['DOCKER' as Resource],
        actions: [AuthAction.CREATE_ANY, AuthAction.READ_ANY, AuthAction.UPDATE_ANY, AuthAction.DELETE_ANY],
      },
      vm_manager: {
        resources: ['VMS' as Resource],
        actions: [AuthAction.CREATE_ANY, AuthAction.READ_ANY, AuthAction.UPDATE_ANY, AuthAction.DELETE_ANY],
      },
      monitoring: {
        resources: ['INFO', 'DASHBOARD', 'LOGS', 'ARRAY', 'DISK', 'NETWORK'] as Resource[],
        actions: [AuthAction.READ_ANY],
      },
      backup_manager: {
        resources: ['FLASH', 'SHARE'] as Resource[],
        actions: [AuthAction.CREATE_ANY, AuthAction.READ_ANY, AuthAction.UPDATE_ANY, AuthAction.DELETE_ANY],
      },
      network_admin: {
        resources: ['NETWORK', 'SERVICES'] as Resource[],
        actions: [AuthAction.CREATE_ANY, AuthAction.READ_ANY, AuthAction.UPDATE_ANY, AuthAction.DELETE_ANY],
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
      actions: actionKey.split(',') as AuthAction[], // GraphQL will return these as enum values
    }));
    
    console.log('Edit mode - actions from API:', {
      rawActions: fragmentKey.permissions?.[0]?.actions,
      customPermissions,
      firstActionSet: customPermissions[0]?.actions
    });
    
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

  // Both authorization and regular mode now use the same form structure
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
  console.log('upsertKey called:', {
    isAuthorizationMode: isAuthorizationMode.value,
    formValid: formValid.value,
    formData: formData.value,
    hasName: !!formData.value.name
  });
  
  // In authorization mode, skip validation if we have a name
  if (!isAuthorizationMode.value && !formValid.value) {
    console.log('Blocked: not in auth mode and form invalid');
    return;
  }
  if (isAuthorizationMode.value && !formData.value.name) {
    console.error('Cannot authorize without a name');
    return;
  }
  
  console.log('Proceeding with API call...');
  
  // In authorization mode, validation is enough - no separate consent field

  postCreateLoading.value = true;
  try {
    const apiData = transformFormDataForApi();
    console.log('API data prepared:', {
      ...apiData,
      permissionsDetail: apiData.permissions?.map(p => ({
        resource: p.resource,
        actions: p.actions,
        actionTypes: p.actions?.map(a => typeof a)
      }))
    });
    
    const isEdit = !!editingKey.value?.id;
    
    let res;
    if (isEdit && editingKey.value) {
      console.log('Updating API key...');
      res = await updateApiKey({
        input: {
          id: editingKey.value.id,
          ...apiData,
        },
      });
    } else {
      console.log('Creating new API key...');
      res = await createApiKey({
        input: apiData,
      });
    }

    console.log('API response:', res);
    
    const apiKeyResult = res?.data?.apiKey;
    if (isEdit && apiKeyResult && 'update' in apiKeyResult) {
      const fragmentData = useFragment(API_KEY_FRAGMENT, apiKeyResult.update);
      apiKeyStore.setCreatedKey(fragmentData);
    } else if (!isEdit && apiKeyResult && 'create' in apiKeyResult) {
      const fragmentData = useFragment(API_KEY_FRAGMENT, apiKeyResult.create);
      apiKeyStore.setCreatedKey(fragmentData);
      console.log('Key created, fragment data:', fragmentData);
      
      // If in authorization mode, call the callback with the API key
      if (isAuthorizationMode.value && authorizationData.value?.onAuthorize && 'key' in fragmentData) {
        console.log('Calling onAuthorize callback...');
        authorizationData.value.onAuthorize(fragmentData.key);
        // Don't close the modal or reset form - let the callback handle it
        return;
      }
    }

    apiKeyStore.hideModal();
    formData.value = {} as FormData; // Reset to empty object
  } catch (error) {
    console.error('Error in upsertKey:', error);
  } finally {
    postCreateLoading.value = false;
  }
}

// Copy API key after creation
const copyApiKey = async () => {
  if (createdKey.value && 'key' in createdKey.value) {
    await copy(createdKey.value.key);
  }
};
</script>

<template>
  <!-- Modal mode (handles both regular creation and authorization) -->
  <Dialog
    v-if="modalVisible"
    v-model="modalVisible"
    size="xl"
    :title="
      isAuthorizationMode
        ? 'Authorize API Key Access'
        : editingKey 
        ? (t ? t('Edit API Key') : 'Edit API Key') 
        : (t ? t('Create API Key') : 'Create API Key')
    "
    :scrollable="true"
    close-button-text="Cancel"
    :primary-button-text="
      isAuthorizationMode
        ? 'Authorize'
        : editingKey 
        ? 'Save' 
        : 'Create'
    "
    :primary-button-loading="loading || postCreateLoading"
    :primary-button-loading-text="
      isAuthorizationMode
        ? 'Authorizing...'
        : editingKey 
        ? 'Saving...' 
        : 'Creating...'
    "
    :primary-button-disabled="isButtonDisabled"
    @update:model-value="
      (v) => {
        if (!v) close();
      }
    "
    @primary-click="() => {
      console.log('Primary button clicked!');
      upsertKey();
    }"
  >
    <div class="w-full">
      <!-- Show authorization description if in authorization mode -->
      <div v-if="isAuthorizationMode && formSchema?.dataSchema?.description" class="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
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
          :key="jsonFormsKey"
          :schema="formSchema.dataSchema"
          :uischema="formSchema.uiSchema"
          :renderers="jsonFormsRenderers"
          :data="formData"
          :ajv="jsonFormsAjv"
          @change="({ data, errors }) => {
            formData = data;
            formValid = errors ? errors.length === 0 : true;
            
            // Always log in authorization mode to see what's happening
            if (isAuthorizationMode.value) {
              console.log('JsonForms change event in auth mode:', {
                errors: errors || [],
                errorCount: errors ? errors.length : 0,
                formValid: formValid.value,
                formData: data,
                hasName: !!data?.name
              });
            }
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
      <div class="mt-6 p-4 bg-muted/50 rounded-lg border border-muted">
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

      <!-- Developer Authorization Link for Modal Mode (hide in authorization flow) -->
      <div v-if="!isAuthorizationMode" class="mt-4">
        <DeveloperAuthorizationLink
          :roles="formData.roles || []"
          :raw-permissions="formDataPermissions"
          :app-name="formData.name || 'My Application'"
          :app-description="formData.description || 'API key for my application'"
        />
      </div>

      <!-- Success state for authorization mode -->
      <div v-if="isAuthorizationMode && createdKey && 'key' in createdKey" class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
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
          {{ createdKey.key }}
        </code>
        <p class="text-xs text-muted-foreground mt-2">
          Save this key securely for your application.
        </p>
      </div>
    </div>
  </Dialog>
</template>
