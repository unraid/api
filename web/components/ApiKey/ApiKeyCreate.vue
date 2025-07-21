<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useMutation, useQuery } from '@vue/apollo-composable';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Dialog,
  Input,
  Label,
  Select,
} from '@unraid/ui';
import { extractGraphQLErrorMessage } from '~/helpers/functions';

import type { ApolloError } from '@apollo/client/errors';
import type { FragmentType } from '~/composables/gql/fragment-masking';
import type { Resource, Role } from '~/composables/gql/graphql';
import type { ComposerTranslation } from 'vue-i18n';

import { useFragment } from '~/composables/gql/fragment-masking';
import { useApiKeyStore } from '~/store/apiKey';
import {
  API_KEY_FRAGMENT,
  API_KEY_FRAGMENT_WITH_KEY,
  CREATE_API_KEY,
  GET_API_KEY_META,
  UPDATE_API_KEY,
} from './apikey.query';
import PermissionCounter from './PermissionCounter.vue';

defineProps<{ t: ComposerTranslation }>();

const apiKeyStore = useApiKeyStore();
const { modalVisible, editingKey } = storeToRefs(apiKeyStore);

const { result: apiKeyMetaResult } = useQuery(GET_API_KEY_META);
const possibleRoles = computed(() => apiKeyMetaResult.value?.apiKeyPossibleRoles || []);
const possiblePermissions = computed(() => apiKeyMetaResult.value?.apiKeyPossiblePermissions || []);

const newKeyName = ref('');
const newKeyDescription = ref('');
const newKeyRoles = ref<Role[]>([]);
const newKeyPermissions = ref<{ resource: Resource; actions: string[] }[]>([]);
const { mutate: createApiKey, loading: createLoading, error: createError } = useMutation(CREATE_API_KEY);
const { mutate: updateApiKey, loading: updateLoading, error: updateError } = useMutation(UPDATE_API_KEY);
const postCreateLoading = ref(false);

const loading = computed<boolean>(() => createLoading.value || updateLoading.value);
const error = computed<ApolloError | null>(() => createError.value || updateError.value);

watch(
  () => editingKey.value,
  (key) => {
    const fragmentKey = key
      ? useFragment(API_KEY_FRAGMENT, key as FragmentType<typeof API_KEY_FRAGMENT>)
      : null;
    if (fragmentKey) {
      newKeyName.value = fragmentKey.name;
      newKeyDescription.value = fragmentKey.description || '';
      newKeyRoles.value = [...fragmentKey.roles];
      newKeyPermissions.value = fragmentKey.permissions
        ? fragmentKey.permissions.map((p) => ({
            resource: p.resource as Resource,
            actions: [...p.actions],
          }))
        : [];
    } else {
      newKeyName.value = '';
      newKeyDescription.value = '';
      newKeyRoles.value = [];
      newKeyPermissions.value = [];
    }
  },
  { immediate: true }
);

function togglePermission(resource: string, action: string, checked: boolean) {
  const res = resource as Resource;
  const perm = newKeyPermissions.value.find((p) => p.resource === res);
  if (checked) {
    if (perm) {
      if (!perm.actions.includes(action)) perm.actions.push(action);
    } else {
      newKeyPermissions.value.push({ resource: res, actions: [action] });
    }
  } else {
    if (perm) {
      perm.actions = perm.actions.filter((a) => a !== action);
      if (perm.actions.length === 0) {
        newKeyPermissions.value = newKeyPermissions.value.filter((p) => p.resource !== res);
      }
    }
  }
}

function areAllPermissionsSelected() {
  return possiblePermissions.value.every((perm) => {
    const selected = newKeyPermissions.value.find((p) => p.resource === perm.resource)?.actions || [];
    return perm.actions.every((a) => selected.includes(a));
  });
}

function selectAllPermissions() {
  newKeyPermissions.value = possiblePermissions.value.map((perm) => ({
    resource: perm.resource as Resource,
    actions: [...perm.actions],
  }));
}

function clearAllPermissions() {
  newKeyPermissions.value = [];
}

function areAllActionsSelected(resource: string) {
  const perm = possiblePermissions.value.find((p) => p.resource === resource);
  if (!perm) return false;
  const selected = newKeyPermissions.value.find((p) => p.resource === resource)?.actions || [];
  return perm.actions.every((a) => selected.includes(a));
}

function selectAllActions(resource: string) {
  const res = resource as Resource;
  const perm = possiblePermissions.value.find((p) => p.resource === res);
  if (!perm) return;
  const idx = newKeyPermissions.value.findIndex((p) => p.resource === res);
  if (idx !== -1) {
    newKeyPermissions.value[idx].actions = [...perm.actions];
  } else {
    newKeyPermissions.value.push({ resource: res, actions: [...perm.actions] });
  }
}

function clearAllActions(resource: string) {
  newKeyPermissions.value = newKeyPermissions.value.filter((p) => p.resource !== resource);
}

const close = () => {
  apiKeyStore.hideModal();
};

async function upsertKey() {
  postCreateLoading.value = true;
  try {
    const isEdit = !!editingKey.value?.id;
    let res;
    if (isEdit && editingKey.value) {
      res = await updateApiKey({
        input: {
          id: editingKey.value.id,
          name: newKeyName.value,
          description: newKeyDescription.value,
          roles: newKeyRoles.value,
          permissions: newKeyPermissions.value.length ? newKeyPermissions.value : undefined,
        },
      });
    } else {
      res = await createApiKey({
        input: {
          name: newKeyName.value,
          description: newKeyDescription.value,
          roles: newKeyRoles.value,
          permissions: newKeyPermissions.value.length ? newKeyPermissions.value : undefined,
        },
      });
    }

    const apiKeyResult = res?.data?.apiKey;
    if (isEdit && apiKeyResult && 'update' in apiKeyResult) {
      const fragmentData = useFragment(API_KEY_FRAGMENT_WITH_KEY, apiKeyResult.update);
      apiKeyStore.setCreatedKey(fragmentData);
    } else if (!isEdit && apiKeyResult && 'create' in apiKeyResult) {
      const fragmentData = useFragment(API_KEY_FRAGMENT_WITH_KEY, apiKeyResult.create);
      apiKeyStore.setCreatedKey(fragmentData);
    }

    modalVisible.value = false;
    editingKey.value = null;
    newKeyName.value = '';
    newKeyDescription.value = '';
    newKeyRoles.value = [];
    newKeyPermissions.value = [];
  } finally {
    postCreateLoading.value = false;
  }
}
</script>

<template>
  <Dialog
    v-model="modalVisible"
    size="lg"
    :title="editingKey ? t('Edit API Key') : t('Create API Key')"
    :scrollable="true"
    close-button-text="Cancel"
    :primary-button-text="editingKey ? 'Save' : 'Create'"
    :primary-button-loading="loading || postCreateLoading"
    :primary-button-loading-text="editingKey ? 'Saving...' : 'Creating...'"
    :primary-button-disabled="loading || postCreateLoading"
    @update:model-value="
      (v) => {
        if (!v) close();
      }
    "
    @primary-click="upsertKey"
  >
    <div class="max-w-[800px]">
      <form @submit.prevent="upsertKey">
        <div class="mb-2">
          <Label for="api-key-name">Name</Label>
          <Input id="api-key-name" v-model="newKeyName" placeholder="Name" class="mt-1" />
        </div>
        <div class="mb-2">
          <Label for="api-key-desc">Description</Label>
          <Input id="api-key-desc" v-model="newKeyDescription" placeholder="Description" class="mt-1" />
        </div>
        <div class="mb-2">
          <Label for="api-key-roles">Roles</Label>
          <Select
            v-model="newKeyRoles"
            :items="possibleRoles"
            :multiple="true"
            :placeholder="'Select Roles'"
            class="mt-1 w-full"
          />
        </div>
        <div class="mb-2">
          <Label for="api-key-permissions">Permissions</Label>
          <Accordion id="api-key-permissions" type="single" collapsible class="w-full mt-2">
            <AccordionItem value="permissions">
              <AccordionTrigger>
                <PermissionCounter
                  :permissions="newKeyPermissions"
                  :possible-permissions="possiblePermissions"
                />
              </AccordionTrigger>
              <AccordionContent>
                <div class="flex flex-row justify-end my-2">
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    @click="areAllPermissionsSelected() ? clearAllPermissions() : selectAllPermissions()"
                  >
                    {{ areAllPermissionsSelected() ? 'Select None' : 'Select All' }}
                  </Button>
                </div>
                <div class="flex flex-col gap-2 mt-1">
                  <div
                    v-for="perm in possiblePermissions"
                    :key="perm.resource"
                    class="rounded-sm p-2 border"
                  >
                    <div class="flex items-center justify-between mb-1">
                      <span class="font-semibold">{{ perm.resource }}</span>
                      <Button
                        size="sm"
                        variant="link"
                        type="button"
                        @click="
                          areAllActionsSelected(perm.resource)
                            ? clearAllActions(perm.resource)
                            : selectAllActions(perm.resource)
                        "
                      >
                        {{ areAllActionsSelected(perm.resource) ? 'Select None' : 'Select All' }}
                      </Button>
                    </div>
                    <div class="flex gap-4 flex-wrap">
                      <label
                        v-for="action in perm.actions"
                        :key="action"
                        class="flex items-center gap-1"
                      >
                        <input
                          type="checkbox"
                          :checked="
                            !!newKeyPermissions.find(
                              (p) => p.resource === perm.resource && p.actions.includes(action)
                            )
                          "
                          @change="
                            (e: Event) =>
                              togglePermission(
                                perm.resource,
                                action,
                                (e.target as HTMLInputElement)?.checked
                              )
                          "
                        >
                        <span class="text-sm">{{ action }}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <div v-if="error" class="text-red-500 mt-2 text-sm">
          {{ extractGraphQLErrorMessage(error) }}
        </div>
      </form>
    </div>
  </Dialog>
</template>
