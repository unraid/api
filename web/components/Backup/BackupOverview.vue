<script setup lang="ts">
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';

import type { JobStatusFragment } from '~/composables/gql/graphql';

import { useFragment } from '~/composables/gql';
import { BACKUP_JOBS_QUERY, JOB_STATUS_FRAGMENT } from './backup-jobs.query';
import BackupEntry from './BackupEntry.vue';
import BackupJobConfig from './BackupJobConfig.vue';

const showSystemJobs = ref(false);

const { result, loading, error, refetch } = useQuery(
  BACKUP_JOBS_QUERY,
  {},
  {
    fetchPolicy: 'cache-and-network',
    pollInterval: 5000, // Poll every 5 seconds for real-time updates
  }
);

const jobs = computed<JobStatusFragment[]>(() => {
  return result.value?.backup?.jobs.map((job) => useFragment(JOB_STATUS_FRAGMENT, job)) || [];
});

// Enhanced refresh function that forces a network request
const refreshJobs = async () => {
  await refetch();
};
</script>

<template>
  <div class="backup-overview">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Backup Management</h1>
      <button
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        :disabled="loading"
        @click="refreshJobs"
      >
        {{ loading ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>

    <!-- Backup Job Configurations -->
    <BackupJobConfig />

    <!-- Running Backup Jobs Section -->
    <div class="mt-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Running Backup Jobs</h2>
        <div class="flex items-center space-x-3">
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="showSystemJobs" type="checkbox" class="sr-only peer" />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
            ></div>
            <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
              Show system jobs
            </span>
          </label>
        </div>
      </div>

      <div v-if="loading && !result" class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Loading backup jobs...</p>
      </div>

      <div
        v-else-if="error"
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
      >
        <div class="flex">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error loading backup jobs</h3>
            <div class="mt-2 text-sm text-red-700 dark:text-red-300">
              {{ error.message }}
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!backupJobs?.length" class="text-center py-12">
        <div class="text-gray-400 dark:text-gray-600 mb-4">
          <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No backup jobs running</h3>
        <p class="text-gray-600 dark:text-gray-400">There are currently no active backup operations.</p>
      </div>

      <div v-else class="space-y-4">
        <BackupEntry v-for="job in jobs" :key="job.id" :job="job" />
      </div>
    </div>
  </div>
</template>
