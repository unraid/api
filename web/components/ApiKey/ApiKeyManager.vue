<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';

import {
  Button,
  CardWrapper,
  PageContainer,
} from '@unraid/ui';

import { DELETE_API_KEY, GET_API_KEY_META, GET_API_KEYS } from './apikey.query';
import ApiKeyCreate from './ApiKeyCreate.vue';
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/solid';

interface ApiKey {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  roles: string[];
  permissions: { resource: string; actions: string[] }[];
}

const { result, refetch } = useQuery<{ apiKeys: ApiKey[] }>(GET_API_KEYS);
const apiKeys = ref<ApiKey[]>([]);

watchEffect(() => {
  apiKeys.value = result.value?.apiKeys || [];
});

const metaQuery = useQuery(GET_API_KEY_META);
const possibleRoles = ref<string[]>([]);
const possiblePermissions = ref<{ resource: string; actions: string[] }[]>([]);
watchEffect(() => {
  possibleRoles.value = metaQuery.result.value?.apiKeyPossibleRoles || [];
  possiblePermissions.value = metaQuery.result.value?.apiKeyPossiblePermissions || [];
});

const showCreate = ref(false);
const createdKey = ref<{ id: string; key: string } | null>(null);
const showKey = ref(false);

const { mutate: deleteKey } = useMutation(DELETE_API_KEY);

const deleteError = ref<string | null>(null);

function toggleShowKey() {
  showKey.value = !showKey.value;
}

function onCreated(key: { id: string; key: string } | null) {
  createdKey.value = key;
  showCreate.value = false;
  refetch();
}

async function _deleteKey(_id: string) {
  if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;
  deleteError.value = null;
  try {
    await deleteKey({ input: { ids: [_id] } });
    await refetch();
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
      deleteError.value = (err as { message: string }).message;
    } else {
      deleteError.value = 'Failed to delete API key.';
    }
  }
}
</script>
<template>
  <PageContainer>
    <CardWrapper>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">API Keys</h2>
        <Button variant="primary" @click="showCreate = true">Create API Key</Button>
      </div>
      <div v-if="deleteError" class="mb-2 p-2 bg-red-100 text-red-700 border border-red-300 rounded">
        {{ deleteError }}
      </div>
      <ul v-if="apiKeys.length" class="space-y-2 mb-4">
        <li
          v-for="key in apiKeys"
          :key="key.id"
          class="flex items-center justify-between p-2 border rounded"
        >
          <div>
            <span class="font-medium">{{ key.name }}</span>
            <div v-if="key.roles.length" class="mt-1">
              <span class="font-semibold">Roles:</span>
              <span>{{ key.roles.join(', ') }}</span>
            </div>
            <div v-if="key.permissions.length" class="mt-1">
              <span class="font-semibold">Permissions:</span>
              <ul class="ml-2">
                <li v-for="perm in key.permissions" :key="perm.resource">
                  <span class="font-medium">{{ perm.resource }}</span>
                  <span v-if="perm.actions && perm.actions.length"> ({{ perm.actions.join(', ') }})</span>
                </li>
              </ul>
            </div>
            <div v-if="createdKey && createdKey.key && createdKey.id === key.id" class="mt-2 flex items-center gap-2">
              <span>API Key created:</span>
              <b>{{ showKey ? createdKey.key : '••••••••••••••••••••••••••••••••' }}</b>
              <button type="button" class="focus:outline-none" @click="toggleShowKey">
                <component :is="showKey ? EyeSlashIcon : EyeIcon" class="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          <Button variant="destructive" size="sm" @click="_deleteKey(key.id)">Delete</Button>
        </li>
      </ul>
      <div v-if="showCreate" class="mb-4 p-4 border rounded bg-muted">
        <ApiKeyCreate
          v-if="showCreate"
          :possible-roles="possibleRoles"
          :possible-permissions="possiblePermissions"
          @created="onCreated"
          @cancel="showCreate = false"
        />
      </div>
    </CardWrapper>
  </PageContainer>
</template>
