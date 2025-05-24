<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';

import { BACKUP_JOBS_QUERY } from './backup-jobs.query';
import BackupJobConfig from './BackupJobConfig.vue';

const showSystemJobs = ref(false);

const { result, loading, error, refetch } = useQuery(
  BACKUP_JOBS_QUERY,
  () => ({ showSystemJobs: showSystemJobs.value }),
);

const backupJobs = computed(() => result.value?.backup?.jobs || []);
</script>

<template>
  <div class="backup-overview">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Backup Management</h1>
      <button
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        :disabled="loading"
        @click="() => refetch()"
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
        <div
          v-for="job in backupJobs"
          :key="job.id"
          class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  {{ job.type || 'Backup Job' }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">Job ID: {{ job.id }}</p>
              </div>
            </div>
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
            >
              Running
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-if="job.stats?.formattedBytes" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Bytes Transferred</dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ job.stats.formattedBytes }}
              </dd>
            </div>

            <div v-if="job.stats?.transfers" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Files Transferred</dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ job.stats.transfers }}
              </dd>
            </div>

            <div v-if="job.stats?.formattedSpeed" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Transfer Speed</dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ job.stats.formattedSpeed }}/s</dd>
            </div>

            <div v-if="job.stats?.formattedElapsedTime" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Elapsed Time</dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ job.stats.formattedElapsedTime }}
              </dd>
            </div>

            <div v-if="job.stats?.formattedEta" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">ETA</dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ job.stats.formattedEta }}
              </dd>
            </div>

            <div v-if="job.stats?.percentage" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Progress</dt>
              <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ job.stats.percentage }}%</dd>
            </div>
          </div>

          <div v-if="job.stats?.percentage" class="mt-4">
            <div class="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${job.stats.percentage}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backup-overview {
  @apply mx-auto max-w-7xl p-6;
}
</style>
