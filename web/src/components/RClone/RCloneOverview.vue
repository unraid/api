<script lang="ts" setup>
import { ref } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';

import { Button } from '@unraid/ui';

import { DELETE_REMOTE } from '~/components/RClone/graphql/rclone.mutations';
import { GET_RCLONE_REMOTES } from '~/components/RClone/graphql/rclone.query';
import RCloneConfig from '~/components/RClone/RCloneConfig.vue';
import RemoteItem from '~/components/RClone/RemoteItem.vue';

interface FormState {
  configStep: number;
  showAdvanced: boolean;
  name: string;
  type: string;
  parameters: Record<string, unknown>;
}

const showConfigModal = ref(false);
const selectedRemote = ref<{ name: string; type: string } | null>(null);
const initialFormState = ref<FormState | null>(null);

const {
  result: remotes,
  loading: loadingRemotes,
  refetch: refetchRemotes,
  error,
} = useQuery(GET_RCLONE_REMOTES);

const {
  mutate: deleteRemote,
  loading: isDeleting,
  onDone: onDeleteDone,
} = useMutation(DELETE_REMOTE, {
  refetchQueries: [{ query: GET_RCLONE_REMOTES }],
});

const toast = useToast();

onDeleteDone((result) => {
  const data = result?.data;
  if (data?.rclone?.deleteRCloneRemote) {
    toast.add({
      title: 'Remote Deleted',
      description: 'Remote deleted successfully',
      color: 'success',
    });
  } else {
    toast.add({
      title: 'Deletion Failed',
      description: 'Failed to delete remote. Please try again.',
      color: 'error',
    });
  }
});

const confirmDelete = (remote: string) => {
  if (confirm(`Are you sure you want to delete "${remote}"?`)) {
    deleteRemote({ input: { name: remote } });
  }
};

const openCryptModal = (remote: { name: string; type: string }) => {
  const entropy = Math.random().toString(36).substring(2, 8);
  selectedRemote.value = remote;
  initialFormState.value = {
    configStep: 0,
    showAdvanced: false,
    name: `${remote.name}-crypt-${entropy}`,
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

const onConfigComplete = () => {
  showConfigModal.value = false;
  initialFormState.value = null;
  refetchRemotes();
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">RClone Remotes</h1>
      <Button
        @click="
          showConfigModal = true;
          initialFormState = null;
        "
        >Add New Remote</Button
      >
    </div>

    <div v-if="loadingRemotes" class="py-8 text-center text-gray-500">Loading remotes...</div>

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

    <div v-else-if="error" class="py-8 text-center text-red-500">
      <p class="mb-4">Failed to load remotes</p>
      <Button @click="() => refetchRemotes()">Retry</Button>
    </div>

    <div v-else class="py-8 text-center">
      <p class="mb-4 text-gray-500">No remotes configured yet</p>
      <Button @click="showConfigModal = true">Create Your First Remote</Button>
    </div>

    <div
      v-if="showConfigModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div class="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white shadow-xl">
        <div class="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 id="modal-title" class="text-xl font-semibold">
            {{ initialFormState ? `Add Crypt to ${selectedRemote?.name}` : 'Add New Remote' }}
          </h2>
          <Button variant="ghost" size="sm" aria-label="Close dialog" @click="showConfigModal = false"
            >×</Button
          >
        </div>
        <div class="p-6">
          <RCloneConfig :initial-state="initialFormState || undefined" @complete="onConfigComplete" />
        </div>
      </div>
    </div>
  </div>
</template>
