<script setup lang="ts">
import { ref } from 'vue';
import SingleLogViewer from '../Logs/SingleLogViewer.vue';
import LogViewerToolbar from '../Logs/LogViewerToolbar.vue';

const showLogs = ref(false);
const autoScroll = ref(true);
const filterText = ref('OIDC');
const logViewerRef = ref<InstanceType<typeof SingleLogViewer> | null>(null);

const logFilePath = '/var/log/graphql-api.log';

const refreshLogs = () => {
  logViewerRef.value?.refreshLogContent();
};

</script>

<template>
  <div class="mt-6 border-2 border-solid rounded-md shadow-md bg-background border-muted">
    <LogViewerToolbar
      v-model:filter-text="filterText"
      v-model:is-expanded="showLogs"
      title="OIDC Debug Logs"
      description="View real-time OIDC authentication and configuration logs"
      :show-toggle="true"
      :show-refresh="true"
      filter-placeholder="Filter logs..."
      @refresh="refreshLogs"
    />
    
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
