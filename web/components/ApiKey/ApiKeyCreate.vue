<script setup lang="ts">
import { ref } from 'vue';
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
import { CREATE_API_KEY } from './apikey.query';

const props = defineProps<{
  possibleRoles: string[];
  possiblePermissions: { resource: string; actions: string[] }[];
}>();
const emit = defineEmits(['created', 'cancel']);

const newKeyName = ref('');
const newKeyDescription = ref('');
const newKeyRoles = ref<string[]>([]);
const newKeyPermissions = ref<{ resource: string; actions: string[] }[]>([]);
const { mutate: createApiKey, loading, error } = useMutation<
  { apiKey: { create: { key: string } } },
  { input: { name: string; description?: string; roles?: string[]; permissions?: { resource: string; actions: string[] }[] } }
>(CREATE_API_KEY);
const postCreateLoading = ref(false);

function togglePermission(resource: string, action: string, checked: boolean) {
  const perm = newKeyPermissions.value.find(p => p.resource === resource);
  if (checked) {
    if (perm) {
      if (!perm.actions.includes(action)) perm.actions.push(action);
    } else {
      newKeyPermissions.value.push({ resource, actions: [action] });
    }
  } else {
    if (perm) {
      perm.actions = perm.actions.filter(a => a !== action);
      if (perm.actions.length === 0) {
        newKeyPermissions.value = newKeyPermissions.value.filter(p => p.resource !== resource);
      }
    }
  }
}

function areAllPermissionsSelected() {
  return props.possiblePermissions.every(perm => {
    const selected = newKeyPermissions.value.find(p => p.resource === perm.resource)?.actions || [];
    return perm.actions.every(a => selected.includes(a));
  });
}

function selectAllPermissions() {
  newKeyPermissions.value = props.possiblePermissions.map(perm => ({
    resource: perm.resource,
    actions: [...perm.actions],
  }));
}

function clearAllPermissions() {
  newKeyPermissions.value = [];
}

function areAllActionsSelected(resource: string) {
  const perm = props.possiblePermissions.find(p => p.resource === resource);
  if (!perm) return false;
  const selected = newKeyPermissions.value.find(p => p.resource === resource)?.actions || [];
  return perm.actions.every(a => selected.includes(a));
}

function selectAllActions(resource: string) {
  const perm = props.possiblePermissions.find(p => p.resource === resource);
  if (!perm) return;
  const idx = newKeyPermissions.value.findIndex(p => p.resource === resource);
  if (idx !== -1) {
    newKeyPermissions.value[idx].actions = [...perm.actions];
  } else {
    newKeyPermissions.value.push({ resource, actions: [...perm.actions] });
  }
}

function clearAllActions(resource: string) {
  newKeyPermissions.value = newKeyPermissions.value.filter(p => p.resource !== resource);
}

async function createKey() {
  const res = await createApiKey({
    input: {
      name: newKeyName.value,
      description: newKeyDescription.value,
      roles: newKeyRoles.value,
      permissions: newKeyPermissions.value.length ? newKeyPermissions.value : undefined,
    },
  });
  postCreateLoading.value = true;
  setTimeout(() => {
    emit('created', res?.data?.apiKey?.create ?? null);
    postCreateLoading.value = false;
    newKeyName.value = '';
    newKeyDescription.value = '';
    newKeyRoles.value = [];
    newKeyPermissions.value = [];
  }, 1000);
}
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
          <SelectItem v-for="role in props.possibleRoles" :key="role" :value="role">{{ role }}</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="mb-2">
      <Accordion type="single" collapsible class="w-full mt-2">
        <AccordionItem value="permissions">
          <AccordionTrigger>Permissions</AccordionTrigger>
          <AccordionContent>
            <div class="flex flex-row justify-end mb-2">
              <span class="mr-auto text-sm text-muted-foreground">
                Selected: {{ newKeyPermissions.reduce((sum, perm) => sum + perm.actions.length, 0) }}
              </span>
              <Button size="sm" variant="secondary" @click="areAllPermissionsSelected() ? clearAllPermissions() : selectAllPermissions()">
                {{ areAllPermissionsSelected() ? 'Select None' : 'Select All' }}
              </Button>
            </div>
            <div class="flex flex-col gap-2 mt-1">
              <div v-for="perm in props.possiblePermissions" :key="perm.resource" class="border rounded p-2">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-semibold">{{ perm.resource }}</span>
                  <Button size="sm" variant="secondary" @click="areAllActionsSelected(perm.resource) ? clearAllActions(perm.resource) : selectAllActions(perm.resource)">
                    {{ areAllActionsSelected(perm.resource) ? 'Select None' : 'Select All' }}
                  </Button>
                </div>
                <div class="flex gap-4 flex-wrap">
                  <label v-for="action in perm.actions" :key="action" class="flex items-center gap-1">
                    <input
                      type="checkbox"
                      :checked="!!newKeyPermissions.find(p => p.resource === perm.resource && p.actions.includes(action))"
                      @change="(e: Event) => togglePermission(perm.resource, action, (e.target as HTMLInputElement)?.checked)"
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
    <div class="flex gap-2 mt-2">
      <Button variant="primary" :disabled="loading || postCreateLoading" @click="createKey">
        <span v-if="loading || postCreateLoading">Creating...</span>
        <span v-else>Create</span>
      </Button>
      <Button variant="secondary" @click="$emit('cancel')">Cancel</Button>
    </div>
    <div v-if="error" class="text-red-500 mt-2 text-sm">
      {{ error.message }}
    </div>
  </div>
</template> 