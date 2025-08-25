<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { storeToRefs } from 'pinia';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { useClipboard } from '@vueuse/core';
import type { AuthAction, ApiKeyFragment  } from '~/composables/gql/graphql';

import { ClipboardDocumentIcon, EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/solid';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  CardWrapper,
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
const { copy, copied } = useClipboard();

const { mutate: deleteKey } = useMutation(DELETE_API_KEY);

const deleteError = ref<string | null>(null);

function toggleShowKey(keyId: string) {
  showKey.value[keyId] = !showKey.value[keyId];
}

function openCreateModal(key: ApiKeyFragment | ApiKeyFragment | null = null) {
  apiKeyStore.clearCreatedKey();
  apiKeyStore.showModal(key as ApiKeyFragment | null);
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
  await copy(keyValue);
}


</script>

<template>
  <PageContainer>
    <div>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold tracking-tight">API Keys</h2>
        <Button variant="primary" @click="openCreateModal(null)">Create API Key</Button>
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
                            actions: p.actions as AuthAction[]
                          })) || []"
                          :show-header="false"
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
              <div class="mt-4 pt-4 border-t flex gap-2 md:justify-between">
                <Button variant="secondary" size="sm" class="flex-1 md:flex-none" @click="openCreateModal(key)">Edit</Button>
                <Button variant="destructive" size="sm" class="flex-1 md:flex-none" @click="_deleteKey(key.id)">Delete</Button>
              </div>
            </div>
          </CardWrapper>
        </div>
      </div>
      <div v-else class="flex flex-col gap-4 mb-6">
        <p class="text-sm">No API keys found</p>
      </div>
    </div>
  </PageContainer>
</template>
