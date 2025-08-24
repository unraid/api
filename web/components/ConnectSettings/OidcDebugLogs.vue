<script setup lang="ts">
import { ref, computed } from 'vue';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@unraid/ui';
import { ArrowPathIcon, EyeIcon, EyeSlashIcon, FunnelIcon } from '@heroicons/vue/24/outline';
import SingleLogViewer from '../Logs/SingleLogViewer.vue';

withDefaults(defineProps<{
  enabled?: boolean;
}>(), {
  enabled: true
});

const showLogs = ref(false);
const autoScroll = ref(true);
const filterEnabled = ref(true);
const logViewerRef = ref<InstanceType<typeof SingleLogViewer> | null>(null);

const logFilePath = computed(() => '/var/log/graphql-api.log');
const filter = computed(() => filterEnabled.value ? 'OIDC' : undefined);

const refreshLogs = () => {
  logViewerRef.value?.refreshLogContent();
};

const toggleLogVisibility = () => {
  showLogs.value = !showLogs.value;
};

const toggleFilter = () => {
  filterEnabled.value = !filterEnabled.value;
  if (logViewerRef.value) {
    refreshLogs();
  }
};
</script>

<template>
  <Card v-if="enabled" class="mt-6">
    <CardHeader class="pb-3">
      <div class="flex justify-between items-center">
        <div>
          <CardTitle class="text-base">OIDC Debug Logs</CardTitle>
          <CardDescription class="text-sm mt-1">
            View real-time OIDC authentication and configuration logs
          </CardDescription>
        </div>
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            :title="filterEnabled ? 'Show all logs' : 'Show only OIDC logs'"
            @click="toggleFilter"
          >
            <FunnelIcon class="h-4 w-4" :class="{ 'text-primary': filterEnabled }" />
            <span class="ml-2">{{ filterEnabled ? 'OIDC Only' : 'All Logs' }}</span>
          </Button>
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
    </CardHeader>
    
    <CardContent v-if="showLogs" class="pt-0">
      <div class="border rounded-lg bg-muted/30 h-[400px] overflow-hidden">
        <SingleLogViewer
          ref="logViewerRef"
          :log-file-path="logFilePath"
          :line-count="100"
          :auto-scroll="autoScroll"
          :filter="filter"
          highlight-language="plaintext"
          class="h-full"
        />
      </div>
      <div class="mt-2 flex justify-between items-center text-xs text-muted-foreground">
        <span>
          {{ filterEnabled ? 'Showing OIDC-related entries only' : 'Showing all log entries' }}
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
    </CardContent>
  </Card>
</template>
