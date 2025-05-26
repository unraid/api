<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';

import { Button, Sheet, SheetContent, SheetTitle, Spinner } from '@unraid/ui';

import { BACKUP_JOB_CONFIGS_LIST_QUERY } from '~/components/Backup/backup-jobs.query';
import BackupJobConfigForm from '~/components/Backup/BackupJobConfigForm.vue';
import BackupJobItem from '~/components/Backup/BackupJobItem.vue';

const showConfigModal = ref(false);

const { result, loading, error, refetch } = useQuery(
  BACKUP_JOB_CONFIGS_LIST_QUERY,
  {},
  {
    fetchPolicy: 'cache-and-network',
    pollInterval: 50000, // Much slower polling since we only need the list of configs
  }
);

const backupConfigIds = computed(() => {
  return result.value?.backup?.configs?.map((config) => config.id) || [];
});

function handleJobDeleted() {
  refetch();
}

function onConfigComplete() {
  showConfigModal.value = false;
  refetch();
}
</script>

<template>
  <div class="backup-config">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">Scheduled Backup Jobs</h2>
      <Button variant="primary" @click="showConfigModal = true"> Add Backup Job </Button>
    </div>

    <div v-if="loading && !result" class="text-center py-8">
      <Spinner class="mx-auto" />
      <p class="mt-2 text-gray-600 dark:text-gray-400">Loading backup configurations...</p>
    </div>

    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
    >
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
            Error loading backup configurations
          </h3>
          <div class="mt-2 text-sm text-red-700 dark:text-red-300">
            {{ error.message }}
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!backupConfigIds?.length" class="text-center py-12">
      <div class="text-gray-400 dark:text-gray-600 mb-4">
        <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 7V3a4 4 0 118 0v4m-4 8l-4-4 4-4m0 8h8a2 2 0 002-2V5a2 2 0 00-2-2H4a2 2 0 002 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No backup jobs configured</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Create your first scheduled backup job to automatically protect your data.
      </p>
      <Button variant="primary" @click="showConfigModal = true"> Create First Backup Job </Button>
    </div>

    <div v-else class="space-y-4">
      <BackupJobItem
        v-for="configId in backupConfigIds"
        :key="configId"
        :config-id="configId"
        @deleted="handleJobDeleted"
      />
    </div>

    <Sheet v-model:open="showConfigModal">
      <SheetContent class="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <SheetTitle class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Add New Backup Job
        </SheetTitle>
        <div class="p-6">
          <BackupJobConfigForm @complete="onConfigComplete" @cancel="showConfigModal = false" />
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>

<style scoped>
.backup-config {
  @apply mx-auto max-w-7xl p-6;
}
</style>
