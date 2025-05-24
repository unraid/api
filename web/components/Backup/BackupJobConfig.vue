<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { useFragment } from '~/composables/gql/fragment-masking';

import { Badge, Button, Sheet, SheetContent, SheetTitle, Spinner, Switch } from '@unraid/ui';

import {
  BACKUP_JOB_CONFIGS_QUERY,
  BACKUP_JOBS_QUERY,
  BACKUP_STATS_FRAGMENT,
  TOGGLE_BACKUP_JOB_CONFIG_MUTATION,
  TRIGGER_BACKUP_JOB_MUTATION,
} from '~/components/Backup/backup-jobs.query';
import BackupJobConfigForm from '~/components/Backup/BackupJobConfigForm.vue';

const showConfigModal = ref(false);
const togglingJobs = ref<Set<string>>(new Set<string>());
const triggeringJobs = ref<Set<string>>(new Set<string>());

const { result, loading, error, refetch } = useQuery(BACKUP_JOB_CONFIGS_QUERY, {}, {
  fetchPolicy: 'cache-and-network',
});
const { result: jobsResult, refetch: refetchJobs } = useQuery(BACKUP_JOBS_QUERY, {}, {
  fetchPolicy: 'cache-and-network',
  pollInterval: 5000, // Poll every 5 seconds for real-time updates
});

const { mutate: toggleJobConfig } = useMutation(TOGGLE_BACKUP_JOB_CONFIG_MUTATION);
const { mutate: triggerJob } = useMutation(TRIGGER_BACKUP_JOB_MUTATION);

const backupConfigs = computed(() => result.value?.backup?.configs || []);
const runningJobs = computed(() => jobsResult.value?.backup?.jobs || []);

// Match running jobs to configs and create combined data
const configsWithJobs = computed(() => {
  return backupConfigs.value.map(config => {
    // Find running job that matches this config using the configId field
    const runningJob = runningJobs.value.find(job => job.configId === config.id);
    
    let jobStats = null;
    if (runningJob?.stats) {
      const stats = useFragment(BACKUP_STATS_FRAGMENT, runningJob.stats);
      
      // Calculate percentage if it's null but we have bytes and totalBytes
      let calculatedPercentage = stats?.percentage;
      if (calculatedPercentage === null && stats?.bytes && stats?.totalBytes) {
        calculatedPercentage = Math.round((stats.bytes / stats.totalBytes) * 100);
      }
      
      jobStats = {
        percentage: Math.round(calculatedPercentage || 0),
        transferredBytes: stats?.formattedBytes || '0 B',
        speed: stats?.formattedSpeed || '0 B/s',
        elapsedTime: stats?.formattedElapsedTime || '0s',
        eta: stats?.formattedEta || 'Unknown',
        transfers: stats?.transfers || 0,
        checks: stats?.checks || 0,
        errors: stats?.errors || 0,
      };
    }

    return {
      ...config,
      runningJob,
      jobStats,
      isRunning: !!runningJob,
    };
  });
});

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

function onConfigComplete() {
  showConfigModal.value = false;
  refetch();
}

async function handleToggleJob(jobId: string) {
  if (togglingJobs.value.has(jobId)) return;

  togglingJobs.value.add(jobId);

  try {
    await toggleJobConfig({ id: jobId });
    await refetch();
  } catch (error) {
    console.error('Failed to toggle job:', error);
  } finally {
    togglingJobs.value.delete(jobId);
  }
}

async function handleTriggerJob(jobId: string) {
  if (triggeringJobs.value.has(jobId)) return;

  triggeringJobs.value.add(jobId);

  try {
    const result = await triggerJob({ id: jobId });
    if (result?.data?.backup?.triggerJob?.jobId) {
      console.log('Backup job triggered:', result.data.backup.triggerJob);
      // Wait a moment for the RClone API to register the job
      await new Promise(resolve => setTimeout(resolve, 500));
      // Refetch both configs and jobs to show the running job immediately
      await Promise.all([refetch(), refetchJobs()]);
    }
  } catch (error) {
    console.error('Failed to trigger backup job:', error);
  } finally {
    triggeringJobs.value.delete(jobId);
  }
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

    <div v-else-if="!backupConfigs?.length" class="text-center py-12">
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
      <div
        v-for="configWithJob in configsWithJobs"
        :key="configWithJob.id"
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div
                :class="[
                  'w-3 h-3 rounded-full',
                  configWithJob.isRunning 
                    ? 'bg-blue-400 animate-pulse' 
                    : configWithJob.enabled 
                      ? 'bg-green-400' 
                      : 'bg-gray-400',
                ]"
              ></div>
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ configWithJob.name }}
                <span
                  v-if="configWithJob.isRunning"
                  class="text-sm text-blue-600 dark:text-blue-400 ml-2"
                >
                  (Running)
                </span>
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ configWithJob.sourcePath }} → {{ configWithJob.remoteName }}:{{ configWithJob.destinationPath }}
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ configWithJob.enabled ? 'Enabled' : 'Disabled' }}
              </span>
              <Switch
                :checked="configWithJob.enabled"
                :disabled="togglingJobs.has(configWithJob.id) || configWithJob.isRunning"
                @update:checked="() => handleToggleJob(configWithJob.id)"
              />
            </div>

            <Button
              :disabled="triggeringJobs.has(configWithJob.id) || configWithJob.isRunning"
              :variant="!triggeringJobs.has(configWithJob.id) && !configWithJob.isRunning ? 'primary' : 'outline'"
              size="sm"
              @click="handleTriggerJob(configWithJob.id)"
            >
              <span
                v-if="triggeringJobs.has(configWithJob.id)"
                class="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"
              ></span>
              <svg v-else class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6-4h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z"
                />
              </svg>
              {{ 
                configWithJob.isRunning 
                  ? 'Running' 
                  : triggeringJobs.has(configWithJob.id) 
                    ? 'Starting...' 
                    : 'Run Now' 
              }}
            </Button>

            <Badge 
              :variant="configWithJob.isRunning ? 'blue' : configWithJob.enabled ? 'green' : 'gray'" 
              size="sm"
            >
              {{ configWithJob.isRunning ? 'Running' : configWithJob.enabled ? 'Active' : 'Inactive' }}
            </Badge>
          </div>
        </div>

        <!-- Progress information for running jobs -->
        <div 
          v-if="configWithJob.isRunning && configWithJob.jobStats"
          class="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div class="flex justify-between text-sm text-blue-700 dark:text-blue-300 mb-3">
            <span class="font-medium">{{ configWithJob.jobStats.percentage }}% complete</span>
            <span>{{ configWithJob.jobStats.speed }}</span>
          </div>
          <div class="w-full bg-blue-200 dark:bg-blue-700 rounded-full h-2 mb-3">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${configWithJob.jobStats.percentage}%` }"
            ></div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-700 dark:text-blue-300">
            <div>
              <span class="font-medium">Transferred:</span> {{ configWithJob.jobStats.transferredBytes }}
            </div>
            <div>
              <span class="font-medium">Elapsed:</span> {{ configWithJob.jobStats.elapsedTime }}
            </div>
            <div>
              <span class="font-medium">ETA:</span> {{ configWithJob.jobStats.eta }}
            </div>
            <div>
              <span class="font-medium">Files:</span> {{ configWithJob.jobStats.transfers }}
            </div>
          </div>
        </div>

        <!-- Schedule and status information -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Schedule</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ configWithJob.schedule }}
            </dd>
          </div>

          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Last Run</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ configWithJob.lastRunAt ? formatDate(configWithJob.lastRunAt) : 'Never' }}
            </dd>
          </div>

          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ configWithJob.isRunning ? 'Running' : configWithJob.lastRunStatus || 'Not run yet' }}
            </dd>
          </div>
        </div>
      </div>
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
