<script setup lang="ts">
import type { BackupJobsQuery } from '~/composables/gql/graphql';
import { BackupJobStatus } from '~/composables/gql/graphql';
import { useFragment } from '~/composables/gql/fragment-masking';
import { BACKUP_STATS_FRAGMENT, RCLONE_JOB_FRAGMENT } from './backup-jobs.query';
import { computed } from 'vue';

interface Props {
  job: NonNullable<BackupJobsQuery['backup']>['jobs'][0];
}

const props = defineProps<Props>();

const jobData = useFragment(RCLONE_JOB_FRAGMENT, props.job);
const stats = useFragment(BACKUP_STATS_FRAGMENT, jobData.stats);

// Calculate percentage if it's null but we have bytes and totalBytes
const calculatedPercentage = computed(() => {
  if (stats?.percentage !== null) {
    return stats?.percentage;
  }
  if (stats?.bytes && stats?.totalBytes) {
    return Math.round((stats.bytes / stats.totalBytes) * 100);
  }
  return null;
});

// Determine job status based on job properties
const jobStatus = computed(() => {
  if (jobData.status) {
    return jobData.status;
  }
  if (jobData.error) return BackupJobStatus.FAILED;
  if (jobData.finished && jobData.success) return BackupJobStatus.COMPLETED;
  if (jobData.finished && !jobData.success) return BackupJobStatus.FAILED;
  return BackupJobStatus.RUNNING;
});

const statusColor = computed(() => {
  switch (jobStatus.value) {
    case BackupJobStatus.FAILED:
    case BackupJobStatus.CANCELLED:
      return 'red';
    case BackupJobStatus.COMPLETED:
      return 'green';
    case BackupJobStatus.RUNNING:
    default:
      return 'blue';
  }
});

const statusText = computed(() => {
  switch (jobStatus.value) {
    case BackupJobStatus.FAILED:
      return 'Error';
    case BackupJobStatus.CANCELLED:
      return 'Cancelled';
    case BackupJobStatus.COMPLETED:
      return 'Completed';
    case BackupJobStatus.RUNNING:
    default:
      return 'Running';
  }
});
</script>

<template>
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div class="flex-shrink-0">
          <div 
            :class="[
              'w-3 h-3 rounded-full',
              statusColor === 'green' ? 'bg-green-400' : statusColor === 'red' ? 'bg-red-400' : 'bg-blue-400',
              jobStatus === BackupJobStatus.RUNNING ? 'animate-pulse' : ''
            ]"
          ></div>
        </div>
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Backup Job
          </h3>
          <div class="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p>Job ID: {{ jobData.id }}</p>
            <p v-if="jobData.configId">Config ID: {{ jobData.configId }}</p>
            <p v-if="jobData.group">Group: {{ jobData.group }}</p>
            <p>Status: {{ statusText }}</p>
            <p v-if="jobData.error" class="text-red-600 dark:text-red-400">Error: {{ jobData.error }}</p>
          </div>
        </div>
      </div>
      <span
        :class="`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : statusColor === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'}`"
      >
        {{ statusText }}
      </span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div v-if="stats?.formattedBytes" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Bytes Transferred</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">
          {{ stats.formattedBytes }}
        </dd>
      </div>

      <div v-if="stats?.transfers" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Files Transferred</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">
          {{ stats.transfers }}
        </dd>
      </div>

      <div v-if="stats?.formattedSpeed" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Transfer Speed</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ stats.formattedSpeed }}</dd>
      </div>

      <div v-if="stats?.formattedElapsedTime" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Elapsed Time</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">
          {{ stats.formattedElapsedTime }}
        </dd>
      </div>

      <div v-if="stats?.formattedEta" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">ETA</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">
          {{ stats.formattedEta }}
        </dd>
      </div>

      <div v-if="calculatedPercentage" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Progress</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">{{ calculatedPercentage }}%</dd>
      </div>
    </div>

    <div v-if="calculatedPercentage" class="mt-4">
      <div class="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div
          :class="[
            'h-2 rounded-full transition-all duration-300',
            statusColor === 'green' ? 'bg-green-600' : statusColor === 'red' ? 'bg-red-600' : 'bg-blue-600'
          ]"
          :style="{ width: `${calculatedPercentage}%` }"
        ></div>
      </div>
    </div>
  </div>
</template> 