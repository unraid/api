<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { storeToRefs } from 'pinia';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { useClipboardWithToast } from '~/composables/useClipboardWithToast';
import type { AuthAction, ApiKeyFragment, Role } from '~/composables/gql/graphql';

import { ClipboardDocumentIcon, EyeIcon, EyeSlashIcon, ChevronDownIcon, LinkIcon } from '@heroicons/vue/24/solid';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  CardWrapper,
  DropdownMenuRoot,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  PageContainer,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@unraid/ui';
import { extractGraphQLErrorMessage } from '~/helpers/functions';


import { useFragment } from '~/composables/gql/fragment-masking';
import { useApiKeyStore } from '~/store/apiKey';
import { API_KEY_FRAGMENT, DELETE_API_KEY, GET_API_KEY_META, GET_API_KEYS } from './apikey.query';
import EffectivePermissions from '~/components/ApiKey/EffectivePermissions.vue';
import { generateScopes } from '~/utils/authorizationLink';

const { result, refetch } = useQuery(GET_API_KEYS);

const apiKeyStore = useApiKeyStore();
const { createdKey } = storeToRefs(apiKeyStore);
const apiKeys = ref<ApiKeyFragment[]>([]);


watchEffect(() => {
  const baseKeys: ApiKeyFragment[] =
    result.value?.apiKeys.map((key) => useFragment(API_KEY_FRAGMENT, key)) || [];
  
  if (createdKey.value) {
    const existingKeyIndex = baseKeys.findIndex((key) => key.id === createdKey.value?.id);
    if (existingKeyIndex >= 0) {
      baseKeys[existingKeyIndex] = createdKey.value;
    } else {
      baseKeys.unshift(createdKey.value);
    }
    
    // Don't automatically show keys - keep them hidden by default
  }

  apiKeys.value = baseKeys;
});

const metaQuery = useQuery(GET_API_KEY_META);
const possibleRoles = ref<string[]>([]);
const possiblePermissions = ref<{ resource: string; actions: AuthAction[] }[]>([]);
watchEffect(() => {
  possibleRoles.value = metaQuery.result.value?.apiKeyPossibleRoles || [];
  // Cast actions to AuthAction[] since GraphQL returns string[] but we know they're AuthAction values
  possiblePermissions.value = (metaQuery.result.value?.apiKeyPossiblePermissions || []).map(p => ({
    resource: p.resource,
    actions: p.actions as AuthAction[]
  }));
});

const showKey = ref<Record<string, boolean>>({});
const { copyWithNotification, copied } = useClipboardWithToast();

// Template input state
const showTemplateInput = ref(false);
const templateUrl = ref('');
const templateError = ref('');

const { mutate: deleteKey } = useMutation(DELETE_API_KEY);

const deleteError = ref<string | null>(null);

function toggleShowKey(keyId: string) {
  showKey.value[keyId] = !showKey.value[keyId];
}

function openCreateModal(key: ApiKeyFragment | ApiKeyFragment | null = null) {
  apiKeyStore.clearCreatedKey();
  apiKeyStore.showModal(key as ApiKeyFragment | null);
}

function openCreateFromTemplate() {
  showTemplateInput.value = true;
  templateUrl.value = '';
  templateError.value = '';
}

function cancelTemplateInput() {
  showTemplateInput.value = false;
  templateUrl.value = '';
  templateError.value = '';
}

function applyTemplate() {
  templateError.value = '';
  
  try {
    // Parse the template URL or query string
    let url: URL;
    
    if (templateUrl.value.startsWith('http://') || templateUrl.value.startsWith('https://')) {
      // Full URL provided
      url = new URL(templateUrl.value);
    } else if (templateUrl.value.startsWith('?')) {
      // Query string only
      url = new URL(window.location.origin + templateUrl.value);
    } else {
      // Try to parse as query string without ?
      url = new URL(window.location.origin + '?' + templateUrl.value);
    }
    
    // Extract query parameters
    const params = url.searchParams;
    
    // Navigate to the authorization page with these params using window.location
    const authUrl = new URL('/tools/apikeyauthorize', window.location.origin);
    params.forEach((value, key) => {
      authUrl.searchParams.append(key, value);
    });
    window.location.href = authUrl.toString();
    
    cancelTemplateInput();
  } catch (_err) {
    templateError.value = 'Invalid template URL or query string. Please check the format and try again.';
  }
}

async function _deleteKey(_id: string) {
  if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.'))
    return;
  deleteError.value = null;
  try {
    await deleteKey({ input: { ids: [_id] } });
    await refetch();
  } catch (err: unknown) {
    deleteError.value = extractGraphQLErrorMessage(err);
  }
}

async function copyKeyValue(keyValue: string) {
  await copyWithNotification(keyValue, 'API key copied to clipboard');
}

async function copyKeyTemplate(key: ApiKeyFragment) {
  try {
    // Generate scopes using the same logic as DeveloperAuthorizationLink
    const scopes = generateScopes(
      key.roles as Role[] || [],
      key.permissions?.map(p => ({
        resource: p.resource,
        actions: p.actions as AuthAction[]
      })) || []
    );
    
    // Build URL parameters for the template
    const urlParams = new URLSearchParams({
      name: key.name,
      scopes: scopes.join(','),
    });
    
    if (key.description) {
      urlParams.set('description', key.description);
    }
    
    // Don't include redirect_uri for templates
    const templateQueryString = '?' + urlParams.toString();
    await copyWithNotification(templateQueryString, 'Template copied to clipboard');
  } catch (error) {
    console.error('Failed to copy template:', error);
  }
}


</script>

<template>
  <PageContainer>
    <div>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold tracking-tight">API Keys</h2>
        <DropdownMenuRoot>
          <DropdownMenuTrigger as-child>
            <Button variant="primary">
              Create API Key
              <ChevronDownIcon class="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="openCreateModal(null)">
              Create New
            </DropdownMenuItem>
            <DropdownMenuItem @click="openCreateFromTemplate">
              Create from Template
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuRoot>
      </div>
      <div
        v-if="deleteError"
        class="mb-4 p-3 rounded border border-destructive bg-destructive/10 text-destructive"
      >
        {{ deleteError }}
      </div>
      <div v-if="apiKeys.length" class="flex flex-col gap-4 mb-6">
        <div v-for="key in apiKeys" :key="key.id" class="w-full">
          <CardWrapper :padding="false">
            <div class="p-4 overflow-hidden">
              <div class="flex flex-col gap-2">
                <div class="text-sm truncate max-w-[250px] md:max-w-md"><b>ID:</b> {{ key.id.split(':')[1] }}</div>
                <div class="text-sm"><b>Name:</b> {{ key.name }}</div>
                <div v-if="key.description" class="text-sm"
                  ><b>Description:</b> {{ key.description }}</div>
                <div v-if="key.roles.length" class="flex flex-wrap gap-2 items-center">
                  <span class="text-sm"><b>Roles:</b></span>
                  <Badge v-for="role in key.roles" :key="role" variant="blue" size="xs">{{
                    role
                  }}</Badge>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-green-700 font-medium"><b>API Key:</b></span>
                  <div class="relative flex-1 max-w-[300px]">
                    <Input
                      :model-value="showKey[key.id] ? key.key : '••••••••••••••••••••••••••••••••'"
                      class="w-full font-mono text-xs px-2 py-1 rounded pr-10"
                      readonly
                    />
                    <button
                      type="button"
                      class="absolute inset-y-0 right-2 flex items-center px-1 text-gray-500 hover:text-gray-700"
                      tabindex="-1"
                      @click="toggleShowKey(key.id)"
                    >
                      <component :is="showKey[key.id] ? EyeSlashIcon : EyeIcon" class="w-5 h-5" />
                    </button>
                  </div>
                  <TooltipProvider>
                    <Tooltip :delay-duration="0">
                      <TooltipTrigger>
                        <Button variant="ghost" size="icon" class="h-8 w-8" @click="copyKeyValue(key.key)">
                          <ClipboardDocumentIcon class="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{{ copied ? 'Copied!' : 'Copy to clipboard...' }}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div v-if="key.permissions?.length || key.roles?.length" class="mt-4 pt-4 border-t">
                <Accordion 
                  type="single" 
                  collapsible 
                  class="w-full"
                >
                  <AccordionItem :value="'permissions-' + key.id">
                    <AccordionTrigger>
                      <span class="text-sm font-semibold">Effective Permissions</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div class="py-2 overflow-auto">
                        <EffectivePermissions
                          :roles="key.roles"
                          :raw-permissions="key.permissions?.map(p => ({
                            resource: p.resource,
                            actions: p.actions
                          })) || []"
                          :show-header="false"
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
              <div class="mt-4 pt-4 border-t flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" @click="openCreateModal(key)">Edit</Button>
                <TooltipProvider>
                  <Tooltip :delay-duration="0">
                    <TooltipTrigger>
                      <Button variant="outline" size="sm" @click="copyKeyTemplate(key)">
                        <LinkIcon class="w-4 h-4 mr-1" />
                        Copy Template
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy a shareable template with these permissions</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button variant="destructive" size="sm" @click="_deleteKey(key.id)">Delete</Button>
              </div>
            </div>
          </CardWrapper>
        </div>
      </div>
      <div v-else class="flex flex-col gap-4 mb-6">
        <p class="text-sm">No API keys found</p>
      </div>
      
      <!-- Template Input Dialog -->
      <div v-if="showTemplateInput" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-background rounded-lg p-6 max-w-lg w-full mx-4">
          <h3 class="text-lg font-semibold mb-4">Create from Template</h3>
          <p class="text-sm text-muted-foreground mb-4">
            Paste a template URL or query string to pre-fill the API key creation form with permissions.
          </p>
          <Input
            v-model="templateUrl"
            placeholder="Paste template URL or query string (e.g., ?name=MyApp&scopes=role:admin)"
            class="mb-4"
            @keydown.enter="applyTemplate"
          />
          <div v-if="templateError" class="mb-4 p-3 rounded border border-destructive bg-destructive/10 text-destructive text-sm">
            {{ templateError }}
          </div>
          <div class="flex gap-3 justify-end">
            <Button variant="outline" @click="cancelTemplateInput">Cancel</Button>
            <Button variant="primary" @click="applyTemplate">Apply Template</Button>
          </div>
        </div>
      </div>
    </div>
  </PageContainer>
</template>
