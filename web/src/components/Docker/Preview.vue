<script setup lang="ts">
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
    <div class="flex flex-col gap-2 sm:mx-4 sm:flex-row sm:items-center sm:justify-between">
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
          <span class="hidden sm:inline">Open in new tab</span>
        </UButton>
        <UButton size="sm" color="primary" variant="outline" icon="i-lucide-refresh-cw">
          <span class="hidden sm:inline">Refresh</span>
        </UButton>
      </div>
    </div>
    <div class="overflow-hidden rounded-lg border border-gray-200 sm:mx-4 dark:border-gray-700">
      <div v-if="previewUrl" class="flex items-center gap-2 bg-gray-100 px-4 py-2 dark:bg-gray-800">
        <UIcon name="i-lucide-lock" class="h-4 w-4 text-gray-500" />
        <span class="text-sm text-gray-600 dark:text-gray-400">{{ previewUrl }}</span>
      </div>
      <div class="flex h-96 items-center justify-center p-8 text-center">
        <div v-if="previewUrl" class="text-gray-500 dark:text-gray-400">
          <UIcon name="i-lucide-globe" class="mx-auto mb-4 h-16 w-16" />
          <p>Web interface preview for {{ item.label }}</p>
          <p class="mt-2 text-sm">Container must be running and accessible on port {{ port }}</p>
        </div>
        <div v-else class="text-gray-500 dark:text-gray-400">
          <UIcon name="i-lucide-alert-circle" class="mx-auto mb-4 h-16 w-16" />
          <p>No web interface available for {{ item.label }}</p>
          <p class="mt-2 text-sm">This container does not expose a web interface</p>
        </div>
      </div>
    </div>
  </div>
</template>
