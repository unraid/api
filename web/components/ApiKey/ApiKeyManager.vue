<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';

import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/solid';
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
  TooltipProvider,
} from '@unraid/ui';

import type { ApiKeyFragment } from '~/composables/gql/graphql';

import { useFragment } from '~/composables/gql/fragment-masking';
import { API_KEY_FRAGMENT, DELETE_API_KEY, GET_API_KEY_META, GET_API_KEYS } from './apikey.query';
import ApiKeyModal from './ApiKeyModal.vue';
import PermissionCounter from './PermissionCounter.vue';
import { extractGraphQLErrorMessage } from '~/helpers/functions';

const { result, refetch } = useQuery(GET_API_KEYS);
const apiKeys = ref<ApiKeyFragment[]>([]);

watchEffect(() => {
  apiKeys.value = result.value?.apiKeys.map((key) => useFragment(API_KEY_FRAGMENT, key)) || [];
});

const metaQuery = useQuery(GET_API_KEY_META);
const possibleRoles = ref<string[]>([]);
const possiblePermissions = ref<{ resource: string; actions: string[] }[]>([]);
watchEffect(() => {
  possibleRoles.value = metaQuery.result.value?.apiKeyPossibleRoles || [];
  possiblePermissions.value = metaQuery.result.value?.apiKeyPossiblePermissions || [];
});

const showCreate = ref(false);
const editingKey = ref<ApiKeyFragment | null>(null);
const createdKey = ref<{ id: string; key: string } | null>(null);
const showKey = ref(false);

const { mutate: deleteKey } = useMutation(DELETE_API_KEY);

const deleteError = ref<string | null>(null);

function toggleShowKey() {
  showKey.value = !showKey.value;
}

async function onCreated(key: { id: string; key: string } | null) {
  createdKey.value = key;
  showCreate.value = false;
  editingKey.value = null;
  await refetch();
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

function openCreateModal(key: ApiKeyFragment | null = null) {
  showCreate.value = true;
  editingKey.value = key;
}

function closeCreateModal() {
  showCreate.value = false;
  editingKey.value = null;
}
</script>
<template>
  <PageContainer>
    <div>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold tracking-tight">API Keys</h2>
        <Button variant="primary" @click="() => openCreateModal(null)">Create API Key</Button>
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
              <div class="flex items-center gap-2">
                <span class="font-semibold text-lg truncate">{{ key.name }}</span>
                <span v-if="key.description" class="text-muted-foreground text-sm truncate">{{
                  key.description
                }}</span>
              </div>
              <div v-if="key.roles.length" class="mt-2 flex flex-wrap gap-2 items-center">
                <span class="font-semibold text-sm">Roles:</span>
                <Badge v-for="role in key.roles" :key="role" variant="blue" size="sm">{{ role }}</Badge>
              </div>
              <div v-if="key.permissions?.length" class="pt-2 w-full">
                <Accordion type="single" collapsible class="w-full">
                  <AccordionItem :value="'permissions-' + key.id">
                    <AccordionTrigger>
                      <PermissionCounter
                        :permissions="key.permissions"
                        :possible-permissions="possiblePermissions"
                        label="Permissions"
                      />
                    </AccordionTrigger>
                    <AccordionContent>
                      <div v-if="key.permissions?.length" class="flex flex-col gap-2">
                        <div
                          v-for="perm in key.permissions ?? []"
                          :key="perm.resource"
                          class="border rounded p-2"
                        >
                          <div class="flex items-center gap-2">
                            <span class="font-semibold">{{ perm.resource }}</span>
                            <span
                              v-if="perm.actions && perm.actions.length"
                              class="text-xs text-muted-foreground"
                              >({{ perm.actions.join(', ') }})</span
                            >
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <div
                v-if="createdKey && createdKey.key && createdKey.id === key.id"
                class="mt-4 flex items-center gap-2"
              >
                <span class="text-green-700 font-medium">API Key created / updated:</span>
                <Input
                  :model-value="showKey ? createdKey.key : '••••••••••••••••••••••••••••••••'"
                  class="w-64 font-mono text-base px-2 py-1 bg-gray-50 border border-gray-200 rounded"
                  readonly
                />
                <TooltipProvider>
                  <Tooltip :content="showKey ? 'Hide key' : 'Show key'">
                    <Button variant="ghost" size="icon" @click="toggleShowKey">
                      <component :is="showKey ? EyeSlashIcon : EyeIcon" class="w-5 h-5 text-gray-500" />
                    </Button>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div class="flex items-stretch gap-2 self-end md:self-center h-10">
              <Button variant="secondary" size="sm" class="h-full" @click="() => openCreateModal(key)"
                >Edit</Button
              >
              <Button variant="destructive" size="sm" class="h-full" @click="_deleteKey(key.id)"
                >Delete</Button
              >
            </div>
          </li>
        </CardWrapper>
      </ul>
      <ApiKeyModal
        :open="showCreate"
        :editing-key="editingKey"
        @close="closeCreateModal"
        @created="onCreated"
      />
    </div>
  </PageContainer>
</template>
