<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMutation } from '@vue/apollo-composable';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@unraid/ui';

import type { FragmentType } from '~/composables/gql/fragment-masking';
import type { ApiKeyFragment, Resource, Role } from '~/composables/gql/graphql';

import { useFragment } from '~/composables/gql/fragment-masking';
import { API_KEY_FRAGMENT, CREATE_API_KEY, UPDATE_API_KEY } from './apikey.query';
import type { ApolloError } from '@apollo/client/errors';
import PermissionCounter from './PermissionCounter.vue';

const props = defineProps<{
  possibleRoles: Role[];
  possiblePermissions: { resource: Resource; actions: string[] }[];
  editingKey?: ApiKeyFragment | null;
}>();
const emit = defineEmits(['created', 'cancel']);

const newKeyName = ref('');
const newKeyDescription = ref('');
const newKeyRoles = ref<Role[]>([]);
const newKeyPermissions = ref<{ resource: Resource; actions: string[] }[]>([]);
const { mutate: createApiKey, loading: createLoading, error: createError } = useMutation(CREATE_API_KEY);
const { mutate: updateApiKey, loading: updateLoading, error: updateError } = useMutation(UPDATE_API_KEY);
const postCreateLoading = ref(false);

const loading = computed<boolean>(() => createLoading.value || updateLoading.value);
const error = computed<ApolloError | null>(() => createError.value || updateError.value);

// Prefill form fields if editingKey is present
watch(
  () => props.editingKey,
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
  return props.possiblePermissions.every((perm) => {
    const selected = newKeyPermissions.value.find((p) => p.resource === perm.resource)?.actions || [];
    return perm.actions.every((a) => selected.includes(a));
  });
}

function selectAllPermissions() {
  newKeyPermissions.value = props.possiblePermissions.map((perm) => ({
    resource: perm.resource as Resource,
    actions: [...perm.actions],
  }));
}

function clearAllPermissions() {
  newKeyPermissions.value = [];
}

function areAllActionsSelected(resource: string) {
  const perm = props.possiblePermissions.find((p) => p.resource === resource);
  if (!perm) return false;
  const selected = newKeyPermissions.value.find((p) => p.resource === resource)?.actions || [];
  return perm.actions.every((a) => selected.includes(a));
}

function selectAllActions(resource: string) {
  const res = resource as Resource;
  const perm = props.possiblePermissions.find((p) => p.resource === res);
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

async function upsertKey() {
  const isEdit = !!props.editingKey?.id;
  let res;
  if (isEdit) {
    res = await updateApiKey({
      input: {
        id: props.editingKey.id,
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
  postCreateLoading.value = true;
  let createdKey = null;
  const apiKeyResult = res?.data?.apiKey;
  if (isEdit && apiKeyResult && 'update' in apiKeyResult) {
    createdKey = apiKeyResult.update;
  } else if (!isEdit && apiKeyResult && 'create' in apiKeyResult) {
    createdKey = apiKeyResult.create;
  }
  emit('created', createdKey);
  postCreateLoading.value = false;
  newKeyName.value = '';
  newKeyDescription.value = '';
  newKeyRoles.value = [];
  newKeyPermissions.value = [];
}

defineExpose({
  upsertKey,
  loading,
  postCreateLoading,
  error,
});
</script>
<template>
  <div class="mb-4 p-4 border rounded bg-muted">
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
      <Select v-model="newKeyRoles" multiple class="mt-1 w-full">
        <SelectTrigger>
          <SelectValue placeholder="Select Roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="role in props.possibleRoles" :key="role" :value="role">{{
            role
          }}</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="mb-2">
      <Accordion type="single" collapsible class="w-full mt-2">
        <AccordionItem value="permissions">
          <AccordionTrigger>
            <PermissionCounter :permissions="newKeyPermissions" :possible-permissions="props.possiblePermissions" label="Permissions" />
          </AccordionTrigger>
          <AccordionContent>
            <div class="flex flex-row justify-end mb-2">
              <Button
                size="sm"
                variant="secondary"
                @click="areAllPermissionsSelected() ? clearAllPermissions() : selectAllPermissions()"
              >
                {{ areAllPermissionsSelected() ? 'Select None' : 'Select All' }}
              </Button>
            </div>
            <div class="flex flex-col gap-2 mt-1">
              <div
                v-for="perm in props.possiblePermissions"
                :key="perm.resource"
                class="border rounded p-2"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="font-semibold">{{ perm.resource }}</span>
                  <Button
                    size="sm"
                    variant="secondary"
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
                  <label v-for="action in perm.actions" :key="action" class="flex items-center gap-1">
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
                    />
                    <span>{{ action }}</span>
                  </label>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
    <div v-if="error && ((error as any).graphQLErrors || (error as any).message)" class="text-red-500 mt-2 text-sm">
      {{ (error as any).graphQLErrors?.[0]?.extensions?.originalError?.message?.[0] || (error as any).message }}
    </div>
  </div>
</template>
