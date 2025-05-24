<template>
  <div class="backup-config">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">
        Scheduled Backup Jobs
      </h2>
      <button
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        @click="showConfigModal = true"
      >
        Add Backup Job
      </button>
    </div>

    <div v-if="loading && !result" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Loading backup configurations...</p>
    </div>

    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
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
            d="M8 7V3a4 4 0 118 0v4m-4 8l-4-4 4-4m0 8h8a2 2 0 002-2V5a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" 
          />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No backup jobs configured
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Create your first scheduled backup job to automatically protect your data.
      </p>
      <button
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        @click="showConfigModal = true"
      >
        Create First Backup Job
      </button>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="config in backupConfigs"
        :key="config.id"
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div 
                :class="[
                  'w-3 h-3 rounded-full',
                  config.enabled ? 'bg-green-400' : 'bg-gray-400'
                ]"
              ></div>
            </div>
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ config.name }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ config.sourcePath }} → {{ config.remoteName }}:{{ config.destinationPath }}
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span 
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                config.enabled 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
              ]"
            >
              {{ config.enabled ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Schedule
            </dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ config.schedule }}
            </dd>
          </div>

          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Last Run
            </dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ config.lastRunAt ? formatDate(config.lastRunAt) : 'Never' }}
            </dd>
          </div>

          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Status
            </dt>
            <dd class="mt-1 text-sm text-gray-900 dark:text-white">
              {{ config.lastRunStatus || 'Not run yet' }}
            </dd>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal for adding new backup job -->
    <div
      v-if="showConfigModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 id="modal-title" class="text-xl font-semibold text-gray-900 dark:text-white">
            Add New Backup Job
          </h2>
          <button
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close dialog"
            @click="showConfigModal = false"
          >
            ✕
          </button>
        </div>
        <div class="p-6">
          <BackupJobConfigForm @complete="onConfigComplete" @cancel="showConfigModal = false" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { BACKUP_JOB_CONFIGS_QUERY } from './backup-jobs.query'
import BackupJobConfigForm from './BackupJobConfigForm.vue'

const showConfigModal = ref(false)

const { result, loading, error, refetch } = useQuery(BACKUP_JOB_CONFIGS_QUERY)

const backupConfigs = computed(() => result.value?.backup?.configs || [])

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString()
}

function onConfigComplete() {
  showConfigModal.value = false
  refetch()
}
</script>

<style scoped>
.backup-config {
  @apply max-w-7xl mx-auto p-6;
}
</style> 