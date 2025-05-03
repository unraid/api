<script lang="ts" setup>
import { ref } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';

import { Button } from '@unraid/ui';

import { DELETE_REMOTE } from '~/components/RClone/graphql/rclone.mutations';
import { GET_RCLONE_REMOTES } from '~/components/RClone/graphql/rclone.query';
import RCloneConfig from './RCloneConfig.vue';
import RemoteItem from './RemoteItem.vue';

// Types
interface FormState {
  configStep: number;
  showAdvanced: boolean;
  name: string;
  type: string;
  parameters: Record<string, unknown>;
}

// Component state
const showConfigModal = ref(false);
const selectedRemote = ref<{ name: string, type: string } | null>(null);
const initialFormState = ref<FormState | null>(null);

// Fetch remotes
const {
  result: remotes,
  loading: loadingRemotes,
  refetch: refetchRemotes,
} = useQuery(GET_RCLONE_REMOTES);

// Delete remote mutation
const {
  mutate: deleteRemote,
  loading: isDeleting,
  onDone: onDeleteDone,
} = useMutation(DELETE_REMOTE, {
  refetchQueries: [{ query: GET_RCLONE_REMOTES }],
});

// Handle successful deletion
onDeleteDone((result) => {
  const data = result?.data;
  if (data?.rclone?.deleteRCloneRemote) {
    if (window.toast) {
      window.toast.success('Remote Deleted', {
        description: 'Remote deleted successfully',
      });
    }
  }
});

// Confirm delete
const confirmDelete = (remote: string) => {
  if (confirm(`Are you sure you want to delete "${remote}"?`)) {
    deleteRemote({ input: { name: remote } });
  }
};

// Open crypt setup modal for a remote
const openCryptModal = (remote: { name: string, type: string }) => {
  selectedRemote.value = remote;
  // Set initial form state for adding crypt config
  initialFormState.value = {
    configStep: 0,
    showAdvanced: false,
    name: `${remote.name}-crypt`,
    type: 'crypt',
    parameters: {
      remote: `${remote.name}:`,
      filename_encryption: 'standard',
      directory_name_encryption: true,
      password: '',
      password2: '',
    },
  };
  showConfigModal.value = true;
};

// Handle config creation completion
const onConfigComplete = () => {
  showConfigModal.value = false;
  initialFormState.value = null;
  refetchRemotes();
};

// Add declare for global toast object
declare global {
  interface Window {
    toast?: {
      success: (title: string, options: { description?: string }) => void;
    };
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Add Remote button -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">RClone Remotes</h1>
      <Button @click="showConfigModal = true; initialFormState = null">Add New Remote</Button>
    </div>

    <!-- Loading state -->
    <div v-if="loadingRemotes" class="py-8 text-center text-gray-500">Loading remotes...</div>

    <!-- Remotes list -->
    <div v-else-if="remotes?.rclone?.remotes?.length" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <RemoteItem
        v-for="remote in remotes?.rclone?.remotes"
        :key="remote.name"
        :remote="remote"
        :is-deleting="isDeleting"
        @open-crypt-modal="openCryptModal"
        @delete="confirmDelete"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="py-8 text-center">
      <p class="text-gray-500 mb-4">No remotes configured yet</p>
      <Button @click="showConfigModal = true">Create Your First Remote</Button>
    </div>

    <!-- Remote Configuration Modal -->
    <div
      v-if="showConfigModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div class="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 class="text-xl font-semibold">{{ initialFormState ? 'Add Crypt to ' + selectedRemote?.name : 'Add New Remote' }}</h2>
          <Button variant="ghost" size="sm" @click="showConfigModal = false">×</Button>
        </div>
        <div class="p-6">
          <RCloneConfig :initial-state="initialFormState || undefined" @complete="onConfigComplete" />
        </div>
      </div>
    </div>
  </div>
</template>
