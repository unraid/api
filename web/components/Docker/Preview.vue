<script setup lang="ts">
import { UButton, UIcon } from '#components';

interface Props {
  item: {
    id: string;
    label: string;
    icon?: string;
    badge?: string | number;
  };
  port?: string;
}

const props = defineProps<Props>();
const previewUrl = props.port ? `http://localhost:${props.port}` : null;
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-medium">Web Preview</h3>
      <div class="flex gap-2">
        <UButton
          v-if="previewUrl"
          size="sm"
          color="primary"
          variant="outline"
          icon="i-lucide-external-link"
          :to="previewUrl"
          target="_blank"
        >
          Open in new tab
        </UButton>
        <UButton size="sm" color="primary" variant="outline" icon="i-lucide-refresh-cw"> Refresh </UButton>
      </div>
    </div>
    <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div v-if="previewUrl" class="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex items-center gap-2">
        <UIcon name="i-lucide-lock" class="w-4 h-4 text-gray-500" />
        <span class="text-sm text-gray-600 dark:text-gray-400">{{ previewUrl }}</span>
      </div>
      <div class="p-8 text-center h-96 flex items-center justify-center">
        <div v-if="previewUrl" class="text-gray-500 dark:text-gray-400">
          <UIcon name="i-lucide-globe" class="w-16 h-16 mx-auto mb-4" />
          <p>Web interface preview for {{ item.label }}</p>
          <p class="text-sm mt-2">Container must be running and accessible on port {{ port }}</p>
        </div>
        <div v-else class="text-gray-500 dark:text-gray-400">
          <UIcon name="i-lucide-alert-circle" class="w-16 h-16 mx-auto mb-4" />
          <p>No web interface available for {{ item.label }}</p>
          <p class="text-sm mt-2">This container does not expose a web interface</p>
        </div>
      </div>
    </div>
  </div>
</template>
