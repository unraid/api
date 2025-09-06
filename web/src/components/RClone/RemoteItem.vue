<script lang="ts" setup>
import { Button } from '@unraid/ui';

interface RemoteProps {
  remote: {
    name: string;
    type: string;
    parameters: Record<string, unknown>;
  };
  isDeleting: boolean;
}

defineProps<RemoteProps>();

const emit = defineEmits<{
  'open-crypt-modal': [remote: { name: string; type: string }];
  delete: [name: string];
}>();

const confirmDelete = (name: string) => {
  if (confirm(`Are you sure you want to delete "${name}"?`)) {
    emit('delete', name);
  }
};

// Helper function to safely handle the string replacement
const getLinkedRemote = (remote: string | unknown): string => {
  if (typeof remote === 'string') {
    return remote.replace(':', '');
  }
  return String(remote || '');
};
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-xs">
    <div class="flex items-start justify-between">
      <div class="space-y-1">
        <h3 class="text-lg font-medium">{{ remote.name }}</h3>
        <p class="text-sm text-gray-600">Type: {{ remote.type }}</p>

        <!-- Show additional details based on remote type -->
        <div v-if="remote.parameters" class="mt-2 space-y-1 text-sm text-gray-600">
          <!-- For crypt remotes, show which remote they're linked to -->
          <p v-if="remote.type === 'crypt' && remote.parameters.remote">
            Linked to: {{ getLinkedRemote(remote.parameters.remote) }}
          </p>

          <!-- For other remote types with important parameters -->
          <template v-if="remote.type === 's3' || remote.type === 'b2' || remote.type === 'drive'">
            <p v-if="remote.parameters.provider">Provider: {{ remote.parameters.provider }}</p>
            <p v-if="remote.parameters.region">Region: {{ remote.parameters.region }}</p>
            <p v-if="remote.parameters.bucket_name">Bucket: {{ remote.parameters.bucket_name }}</p>
          </template>
        </div>
      </div>
      <div class="flex gap-2">
        <Button
          v-if="remote.type !== 'crypt'"
          size="sm"
          variant="secondary"
          @click="emit('open-crypt-modal', remote)"
        >
          Add Crypt
        </Button>
        <Button
          size="sm"
          variant="destructive"
          :loading="isDeleting"
          @click="confirmDelete(remote.name)"
        >
          Delete
        </Button>
      </div>
    </div>
  </div>
</template>
