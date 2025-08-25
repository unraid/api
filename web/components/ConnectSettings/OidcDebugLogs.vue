<script setup lang="ts">
import { ref, computed } from 'vue';
import { Button, Input } from '@unraid/ui';
import { ArrowPathIcon, EyeIcon, EyeSlashIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline';
import SingleLogViewer from '../Logs/SingleLogViewer.vue';

// No props needed anymore

const showLogs = ref(false);
const autoScroll = ref(true);
const filterText = ref('OIDC');
const logViewerRef = ref<InstanceType<typeof SingleLogViewer> | null>(null);

const logFilePath = computed(() => '/var/log/graphql-api.log');

const refreshLogs = () => {
  logViewerRef.value?.refreshLogContent();
};

const toggleLogVisibility = () => {
  showLogs.value = !showLogs.value;
};

</script>

<template>
  <div class="mt-6 border-2 border-solid rounded-md shadow-md bg-background border-muted">
    <div class="p-4 pb-3 border-b border-muted">
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-base font-semibold">OIDC Debug Logs</h3>
          <p class="text-sm mt-1 text-muted-foreground">
            View real-time OIDC authentication and configuration logs
          </p>
        </div>
        <div class="flex gap-2 items-center">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="filterText"
              type="text"
              placeholder="Filter logs..."
              class="pl-8 pr-2 py-1 h-8 w-48 text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            title="Refresh logs"
            @click="refreshLogs"
          >
            <ArrowPathIcon class="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="toggleLogVisibility"
          >
            <component :is="showLogs ? EyeSlashIcon : EyeIcon" class="h-4 w-4" />
            <span class="ml-2">{{ showLogs ? 'Hide' : 'Show' }} Logs</span>
          </Button>
        </div>
      </div>
    </div>
    
    <div v-if="showLogs" class="p-4 pt-0">
      <div class="border rounded-lg bg-muted/30 h-[400px] overflow-hidden">
        <SingleLogViewer
          ref="logViewerRef"
          :log-file-path="logFilePath"
          :line-count="100"
          :auto-scroll="autoScroll"
          :client-filter="filterText"
          highlight-language="plaintext"
          class="h-full"
        />
      </div>
      <div class="mt-2 flex justify-between items-center text-xs text-muted-foreground">
        <span>
          {{ filterText ? `Filtering logs for: "${filterText}"` : 'Showing all log entries' }}
        </span>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="autoScroll"
            type="checkbox"
            class="rounded border-gray-300"
          >
          <span>Auto-scroll</span>
        </label>
      </div>
    </div>
  </div>
</template>
