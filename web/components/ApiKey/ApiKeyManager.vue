<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { storeToRefs } from 'pinia';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { useClipboard } from '@vueuse/core';

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

import type { ApiKeyFragment, ApiKeyWithKeyFragment } from '~/composables/gql/graphql';

import { useFragment } from '~/composables/gql/fragment-masking';
import { useApiKeyStore } from '~/store/apiKey';
import { API_KEY_FRAGMENT, DELETE_API_KEY, GET_API_KEY_META, GET_API_KEYS } from './apikey.query';
import PermissionCounter from './PermissionCounter.vue';

const { result, refetch } = useQuery(GET_API_KEYS);

const apiKeyStore = useApiKeyStore();
const { createdKey } = storeToRefs(apiKeyStore);
const apiKeys = ref<(ApiKeyFragment | ApiKeyWithKeyFragment)[]>([]);

watchEffect(() => {
  const baseKeys: (ApiKeyFragment | ApiKeyWithKeyFragment)[] =
    result.value?.apiKeys.map((key) => useFragment(API_KEY_FRAGMENT, key)) || [];
  console.log(createdKey.value);
  if (createdKey.value) {
    const existingKeyIndex = baseKeys.findIndex((key) => key.id === createdKey.value?.id);
    if (existingKeyIndex >= 0) {
      baseKeys[existingKeyIndex] = createdKey.value as ApiKeyFragment | ApiKeyWithKeyFragment;
    } else {
      baseKeys.unshift(createdKey.value as ApiKeyFragment | ApiKeyWithKeyFragment);
    }
  }

  apiKeys.value = baseKeys;
});

const metaQuery = useQuery(GET_API_KEY_META);
const possibleRoles = ref<string[]>([]);
const possiblePermissions = ref<{ resource: string; actions: string[] }[]>([]);
watchEffect(() => {
  possibleRoles.value = metaQuery.result.value?.apiKeyPossibleRoles || [];
  possiblePermissions.value = metaQuery.result.value?.apiKeyPossiblePermissions || [];
});

const showKey = ref<Record<string, boolean>>({});
const { copy, copied } = useClipboard();

const { mutate: deleteKey } = useMutation(DELETE_API_KEY);

const deleteError = ref<string | null>(null);

function toggleShowKey(keyId: string) {
  showKey.value[keyId] = !showKey.value[keyId];
}

function openCreateModal(key: ApiKeyFragment | ApiKeyWithKeyFragment | null = null) {
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

function hasKey(key: ApiKeyFragment | ApiKeyWithKeyFragment): key is ApiKeyWithKeyFragment {
  return 'key' in key && !!key.key;
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
      <ul v-if="apiKeys.length" class="flex flex-col gap-4 mb-6">
        <CardWrapper v-for="key in apiKeys" :key="key.id">
          <li class="flex flex-row items-start justify-between gap-4 p-4 list-none">
            <div class="flex-1 min-w-0">
              <header class="flex gap-2 justify-between items-start">
                <div class="flex flex-col gap-2">
                  <span class="text-sm truncate"><b>ID:</b> {{ key.id.split(':')[1] }}</span>
                  <span class="text-sm truncate"><b>Name:</b> {{ key.name }}</span>
                  <span v-if="key.description" class="text-sm truncate"
                    ><b>Description:</b> {{ key.description }}</span
                  >
                  <div v-if="key.roles.length" class="flex flex-wrap gap-2 items-center">
                    <span class="text-sm"><b>Roles:</b></span>
                    <Badge v-for="role in key.roles" :key="role" variant="blue" size="xs">{{
                      role
                    }}</Badge>
                  </div>
                </div>
                <div class="flex gap-2 shrink-0">
                  <Button variant="secondary" size="sm" @click="openCreateModal(key)">Edit</Button>
                  <Button variant="destructive" size="sm" @click="_deleteKey(key.id)">Delete</Button>
                </div>
              </header>
              <div v-if="key.permissions?.length" class="pt-2 w-full">
                <span class="text-sm"><b>Permissions:</b></span>
                <Accordion type="single" collapsible class="w-full">
                  <AccordionItem :value="'permissions-' + key.id">
                    <AccordionTrigger>
                      <PermissionCounter
                        :permissions="key.permissions"
                        :possible-permissions="possiblePermissions"
                      />
                    </AccordionTrigger>
                    <AccordionContent>
                      <div v-if="key.permissions?.length" class="flex flex-col gap-2 my-2">
                        <div
                          v-for="perm in key.permissions ?? []"
                          :key="perm.resource"
                          class="border rounded-sm p-2"
                        >
                          <div class="flex items-center gap-2 justify-between">
                            <span class="font-semibold">{{ perm.resource }}</span>
                            <PermissionCounter
                              :permissions="[perm]"
                              :possible-permissions="possiblePermissions"
                              :hide-number="true"
                            />
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <div v-if="hasKey(key)" class="mt-4 flex items-center gap-2">
                <span class="text-green-700 font-medium">API Key:</span>
                <div class="relative w-64">
                  <Input
                    :model-value="showKey[key.id] ? key.key : '••••••••••••••••••••••••••••••••'"
                    class="w-full font-mono text-base px-2 py-1 bg-gray-50 border border-gray-200 rounded pr-10"
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
                      <Button variant="ghost" size="icon" @click="copyKeyValue(key.key)">
                        <ClipboardDocumentIcon class="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{{ copied ? 'Copied!' : 'Copy to clipboard...' }}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </li>
        </CardWrapper>
      </ul>
      <ul v-else class="flex flex-col gap-4 mb-6">
        <li class="text-sm">No API keys found</li>
      </ul>
    </div>
  </PageContainer>
</template>
