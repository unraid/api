<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';

import { PlayIcon, StopIcon, TrashIcon } from '@heroicons/vue/24/solid';
import { Badge, Button, Switch } from '@unraid/ui';

import {
  BACKUP_CONFIG_FRAGMENT,
  BACKUP_JOB_CONFIG_FRAGMENT,
  BACKUP_JOB_CONFIG_QUERY,
  BACKUP_JOB_CONFIG_WITH_CURRENT_JOB_FRAGMENT,
  BACKUP_STATS_FRAGMENT,
  RCLONE_JOB_FRAGMENT,
  STOP_BACKUP_JOB_MUTATION,
  TOGGLE_BACKUP_JOB_CONFIG_MUTATION,
  TRIGGER_BACKUP_JOB_MUTATION,
  DELETE_BACKUP_JOB_CONFIG_MUTATION,
} from '~/components/Backup/backup-jobs.query';
import { useFragment } from '~/composables/gql/fragment-masking';
import { BackupJobStatus } from '~/composables/gql/graphql';

interface Props {
  configId: string;
}

const props = defineProps<Props>();

// Validate configId prop
if (!props.configId) {
  console.warn('BackupJobItem: configId prop is required but not provided');
}

const emit = defineEmits(['deleted']);

const isToggling = ref(false);
const isTriggering = ref(false);
const showDeleteConfirm = ref(false);

// Add reactive variables for the query
const queryVariables = computed(() => ({ id: props.configId }));

const { result, loading, error, refetch } = useQuery(BACKUP_JOB_CONFIG_QUERY, queryVariables, {
  fetchPolicy: 'cache-and-network',
  pollInterval: 50000,
  errorPolicy: 'all', // Show partial data even if there are errors
});

// Add debugging to see what's happening
watch(
  [result, error, loading],
  ([newResult, newError, newLoading]) => {
    console.log('BackupJobItem query state:', {
      configId: props.configId,
      loading: newLoading,
      error: newError,
      result: newResult,
      backupJobConfig: newResult?.backupJobConfig,
    });
  },
  { immediate: true }
);

// Watch for configId changes and refetch
watch(
  () => props.configId,
  (newConfigId) => {
    if (newConfigId) {
      console.log('ConfigId changed, refetching:', newConfigId);
      refetch();
      // Reset delete confirmation when configId changes
      showDeleteConfirm.value = false;
    }
  }
);

const { mutate: toggleJobConfig } = useMutation(TOGGLE_BACKUP_JOB_CONFIG_MUTATION);
const { mutate: triggerJob } = useMutation(TRIGGER_BACKUP_JOB_MUTATION);
const { mutate: stopJob } = useMutation(STOP_BACKUP_JOB_MUTATION);
const { mutate: deleteJobConfig, loading: isDeletingJob } = useMutation(
  DELETE_BACKUP_JOB_CONFIG_MUTATION
);

const configWithJob = computed(() => {
  if (!result.value?.backupJobConfig) {
    console.log('No backupJobConfig in result:', result.value);
    return null;
  }

  try {
    const config = useFragment(
      BACKUP_JOB_CONFIG_WITH_CURRENT_JOB_FRAGMENT,
      result.value.backupJobConfig
    );
    const baseConfig = useFragment(BACKUP_JOB_CONFIG_FRAGMENT, config);
    const currentJob = config.currentJob
      ? useFragment(RCLONE_JOB_FRAGMENT, config.currentJob)
      : undefined;
    const jobStats = currentJob?.stats
      ? useFragment(BACKUP_STATS_FRAGMENT, currentJob.stats)
      : undefined;
    const backupConfig = baseConfig.backupConfig
      ? useFragment(BACKUP_CONFIG_FRAGMENT, baseConfig.backupConfig)
      : undefined;

    return {
      ...baseConfig,
      backupConfig,
      runningJob: currentJob,
      jobStats,
      errorMessage: currentJob?.error || undefined,
      isRunning: currentJob ? !currentJob.finished : false,
      hasRecentJob: !!currentJob,
      sourcePath: backupConfig?.rawConfig?.sourcePath || '',
    };
  } catch (fragmentError) {
    console.error('Error processing fragments:', fragmentError);
    return null;
  }
});

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

async function handleToggleJob() {
  if (!configWithJob.value || isToggling.value) return;

  isToggling.value = true;
  try {
    await toggleJobConfig({ id: configWithJob.value.id });
  } catch (error) {
    console.error('Failed to toggle job:', error);
  } finally {
    isToggling.value = false;
  }
}

async function handleTriggerOrStopJob() {
  if (!configWithJob.value || isTriggering.value) return;

  isTriggering.value = true;
  try {
    if (configWithJob.value.isRunning && configWithJob.value.runningJob?.id) {
      const result = await stopJob({ id: configWithJob.value.runningJob.id });
      if (result?.data?.backup?.stopBackupJob?.status) {
        console.log('Backup job stopped:', result.data.backup.stopBackupJob);
      }
    } else {
      const result = await triggerJob({ id: configWithJob.value.id });
      if (result?.data?.backup?.triggerJob?.jobId) {
        console.log('Backup job triggered:', result.data.backup.triggerJob);
      }
    }
  } catch (error) {
    console.error('Failed to trigger/stop backup job:', error);
  } finally {
    isTriggering.value = false;
  }
}

async function handleDeleteJob() {
  if (!configWithJob.value || isDeletingJob.value) return;

  try {
    const result = await deleteJobConfig({ id: configWithJob.value.id });
    if (result?.data?.backup?.deleteBackupJobConfig) {
      console.log('Backup job config deleted:', configWithJob.value.id);
      emit('deleted', configWithJob.value.id);
      showDeleteConfirm.value = false;
    } else {
      console.error('Failed to delete backup job config, no confirmation in result:', result);
    }
  } catch (error) {
    console.error('Error deleting backup job config:', error);
  }
}

function getPreprocessingTypeLabel(type: string): string {
  switch (type) {
    case 'ZFS':
      return 'ZFS Snapshot';
    case 'FLASH':
      return 'Flash Backup';
    case 'SCRIPT':
      return 'Custom Script';
    case 'RAW':
    default:
      return 'Raw Backup';
  }
}
</script>

<template>
  <div
    v-if="loading"
    class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm animate-pulse"
  >
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div class="w-3 h-3 bg-gray-300 rounded-full"></div>
        <div class="space-y-2">
          <div class="h-4 bg-gray-300 rounded w-32"></div>
          <div class="h-3 bg-gray-300 rounded w-48"></div>
        </div>
      </div>
      <div class="flex items-center space-x-3">
        <div class="h-6 bg-gray-300 rounded w-16"></div>
        <div class="h-8 bg-gray-300 rounded w-20"></div>
      </div>
    </div>
  </div>

  <div
    v-else-if="error"
    class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
  >
    <p class="text-red-700 dark:text-red-300">Error loading backup job: {{ error.message }}</p>
  </div>

  <div
    v-else-if="!loading && !configWithJob"
    class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
  >
    <p class="text-yellow-700 dark:text-yellow-300">
      Backup job configuration not found (ID: {{ configId }})
    </p>
    <button
      class="mt-2 text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 underline"
      @click="refetch()"
    >
      Retry loading
    </button>
  </div>

  <div
    v-else-if="configWithJob"
    class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm relative"
  >
    <!-- Delete Confirmation Dialog -->
    <div
      v-if="showDeleteConfirm"
      class="absolute inset-0 z-10 bg-white/80 dark:bg-gray-800/80 flex flex-col items-center justify-center p-6 rounded-lg"
    >
      <p class="text-lg font-medium text-gray-900 dark:text-white mb-4 text-center">
        Are you sure you want to delete this backup job?
      </p>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
        This action cannot be undone.
      </p>
      <div class="flex space-x-3">
        <Button variant="outline" :disabled="isDeletingJob" @click="showDeleteConfirm = false">
          Cancel
        </Button>
        <Button variant="destructive" :disabled="isDeletingJob" @click="handleDeleteJob">
          <span
            v-if="isDeletingJob"
            class="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"
          ></span>
          {{ isDeletingJob ? 'Deleting...' : 'Delete' }}
        </Button>
      </div>
    </div>

    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div class="flex-shrink-0">
          <div
            :class="[
              'w-3 h-3 rounded-full',
              configWithJob.runningJob?.status === BackupJobStatus.COMPLETED
                ? 'bg-green-400'
                : configWithJob.errorMessage ||
                    configWithJob.runningJob?.status === BackupJobStatus.CANCELLED ||
                    configWithJob.runningJob?.status === BackupJobStatus.FAILED
                  ? 'bg-red-400'
                  : configWithJob.isRunning
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
            <span v-if="configWithJob.isRunning" class="text-sm text-blue-600 dark:text-blue-400 ml-2">
              (Running)
            </span>
            <span
              v-else-if="configWithJob.runningJob?.status === BackupJobStatus.COMPLETED"
              class="text-sm text-green-600 dark:text-green-400 ml-2"
            >
              (Completed)
            </span>
            <span
              v-else-if="configWithJob.errorMessage"
              class="text-sm text-red-600 dark:text-red-400 ml-2"
            >
              ({{ configWithJob.runningJob?.status }})
            </span>
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ configWithJob.sourcePath }} → {{ configWithJob.remoteName }}:{{
              configWithJob.destinationPath
            }}
            <span
              v-if="configWithJob.backupType && configWithJob.backupType !== 'RAW'"
              class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
            >
              {{ getPreprocessingTypeLabel(configWithJob.backupType) }}
            </span>
          </p>
          <p v-if="configWithJob.errorMessage" class="text-sm text-red-600 dark:text-red-400 mt-1">
            Error: {{ configWithJob.errorMessage }}
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
            :disabled="isToggling || configWithJob.isRunning || showDeleteConfirm"
            @update:checked="handleToggleJob"
          />
        </div>

        <Button
          :disabled="isTriggering || showDeleteConfirm"
          :variant="!isTriggering ? 'primary' : 'outline'"
          size="sm"
          @click="handleTriggerOrStopJob"
        >
          <span
            v-if="isTriggering"
            class="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"
          ></span>
          <StopIcon v-else-if="configWithJob.isRunning" class="w-4 h-4 mr-1" />
          <PlayIcon v-else class="w-4 h-4 mr-1" />
          {{
            isTriggering
              ? configWithJob.isRunning
                ? 'Stopping...'
                : 'Starting...'
              : configWithJob.isRunning
                ? 'Stop'
                : 'Run Now'
          }}
        </Button>

        <Button
          variant="destructive"
          size="sm"
          :disabled="isDeletingJob || configWithJob.isRunning || showDeleteConfirm"
          @click="showDeleteConfirm = true"
        >
          <TrashIcon class="w-4 h-4" />
        </Button>

        <Badge
          :variant="
            configWithJob.runningJob?.status === BackupJobStatus.COMPLETED
              ? 'green'
              : configWithJob.errorMessage ||
                  configWithJob.runningJob?.status === BackupJobStatus.CANCELLED ||
                  configWithJob.runningJob?.status === BackupJobStatus.FAILED
                ? 'red'
                : configWithJob.isRunning
                  ? 'blue'
                  : configWithJob.enabled
                    ? 'green'
                    : 'gray'
          "
          size="sm"
        >
          {{
            configWithJob.hasRecentJob && configWithJob.runningJob?.status
              ? configWithJob.runningJob.status.charAt(0).toUpperCase() +
                configWithJob.runningJob.status.slice(1).toLowerCase()
              : configWithJob.enabled
                ? 'Active'
                : 'Inactive'
          }}
        </Badge>
      </div>
    </div>

    <!-- Progress information for running or recently completed jobs -->
    <div
      v-if="configWithJob.hasRecentJob && configWithJob.jobStats"
      :class="[
        'mb-4 border rounded-lg p-4',
        configWithJob.runningJob?.status === BackupJobStatus.COMPLETED
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : configWithJob.errorMessage ||
              configWithJob.runningJob?.status === BackupJobStatus.CANCELLED ||
              configWithJob.runningJob?.status === BackupJobStatus.FAILED
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      ]"
    >
      <div
        :class="[
          'flex justify-between text-sm mb-3',
          configWithJob.runningJob?.status === BackupJobStatus.COMPLETED
            ? 'text-green-700 dark:text-green-300'
            : configWithJob.errorMessage ||
                configWithJob.runningJob?.status === BackupJobStatus.CANCELLED ||
                configWithJob.runningJob?.status === BackupJobStatus.FAILED
              ? 'text-red-700 dark:text-red-300'
              : 'text-blue-700 dark:text-blue-300',
        ]"
      >
        <span class="font-medium">{{ configWithJob.jobStats.percentage }}% complete</span>
        <span>{{ configWithJob.jobStats.formattedSpeed }}</span>
      </div>
      <div
        :class="[
          'w-full rounded-full h-2 mb-3',
          configWithJob.runningJob?.status === BackupJobStatus.COMPLETED
            ? 'bg-green-200 dark:bg-green-700'
            : configWithJob.errorMessage ||
                configWithJob.runningJob?.status === BackupJobStatus.CANCELLED ||
                configWithJob.runningJob?.status === BackupJobStatus.FAILED
              ? 'bg-red-200 dark:bg-red-700'
              : 'bg-blue-200 dark:bg-blue-700',
        ]"
      >
        <div
          :class="[
            'h-2 rounded-full transition-all duration-300',
            configWithJob.runningJob?.status === BackupJobStatus.COMPLETED
              ? 'bg-green-600'
              : configWithJob.errorMessage ||
                  configWithJob.runningJob?.status === BackupJobStatus.CANCELLED ||
                  configWithJob.runningJob?.status === BackupJobStatus.FAILED
                ? 'bg-red-600'
                : 'bg-blue-600',
          ]"
          :style="{ width: `${configWithJob.jobStats.percentage}%` }"
        ></div>
      </div>
      <div
        :class="[
          'grid grid-cols-2 md:grid-cols-4 gap-4 text-sm',
          configWithJob.runningJob?.status === BackupJobStatus.COMPLETED
            ? 'text-green-700 dark:text-green-300'
            : configWithJob.errorMessage ||
                configWithJob.runningJob?.status === BackupJobStatus.CANCELLED ||
                configWithJob.runningJob?.status === BackupJobStatus.FAILED
              ? 'text-red-700 dark:text-red-300'
              : 'text-blue-700 dark:text-blue-300',
        ]"
      >
        <div>
          <span class="font-medium">Transferred:</span> {{ configWithJob.jobStats.formattedBytes }}
        </div>
        <div>
          <span class="font-medium">Elapsed:</span> {{ configWithJob.jobStats.formattedElapsedTime }}
        </div>
        <div v-if="configWithJob.runningJob?.status === BackupJobStatus.RUNNING">
          <span class="font-medium">ETA:</span> {{ configWithJob.jobStats.formattedEta }}
        </div>
        <div v-else>
          <span class="font-medium">Status:</span>
          {{
            configWithJob.runningJob?.status
              ? configWithJob.runningJob.status.charAt(0).toUpperCase() +
                configWithJob.runningJob.status.slice(1).toLowerCase()
              : 'Unknown'
          }}
        </div>
        <div><span class="font-medium">Files:</span> {{ configWithJob.jobStats.transfers }}</div>
      </div>
    </div>

    <!-- Schedule and status information -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Schedule</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">
          {{ configWithJob.schedule }}
        </dd>
      </div>

      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Backup Type</dt>
        <dd class="mt-1 text-sm text-gray-900 dark:text-white">
          {{ getPreprocessingTypeLabel(configWithJob.backupType || 'RAW') }}
          <span
            v-if="
              configWithJob.backupType === 'ZFS' && configWithJob.backupConfig?.zfsConfig
            "
            class="block text-xs text-gray-500 dark:text-gray-400 mt-1"
          >
            {{ configWithJob.backupConfig.zfsConfig.poolName }}/{{
              configWithJob.backupConfig.zfsConfig.datasetName
            }}
          </span>
          <span
            v-else-if="
              configWithJob.backupType === 'FLASH' &&
              configWithJob.backupConfig?.flashConfig
            "
            class="block text-xs text-gray-500 dark:text-gray-400 mt-1"
          >
            {{ configWithJob.backupConfig.flashConfig.flashPath }}
          </span>
          <span
            v-else-if="
              configWithJob.backupType === 'SCRIPT' &&
              configWithJob.backupConfig?.scriptConfig
            "
            class="block text-xs text-gray-500 dark:text-gray-400 mt-1"
          >
            {{ configWithJob.backupConfig.scriptConfig.scriptPath }}
          </span>
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
</template>
