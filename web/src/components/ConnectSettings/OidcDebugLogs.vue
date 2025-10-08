<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import LogViewerToolbar from '@/components/Logs/LogViewerToolbar.vue';
import SingleLogViewer from '@/components/Logs/SingleLogViewer.vue';

const showLogs = ref(false);
const autoScroll = ref(true);
const filterText = ref('OIDC');
const logViewerRef = ref<InstanceType<typeof SingleLogViewer> | null>(null);

const logFilePath = '/var/log/graphql-api.log';

const refreshLogs = () => {
  logViewerRef.value?.refreshLogContent();
};

const { t } = useI18n();
</script>

<template>
  <div class="bg-background border-muted mt-6 rounded-md border-2 border-solid shadow-md">
    <LogViewerToolbar
      v-model:filter-text="filterText"
      v-model:is-expanded="showLogs"
      :title="t('connectSettings.oidcDebugLogsTitle')"
      :description="t('connectSettings.oidcDebugLogsDescription')"
      :show-toggle="true"
      :show-refresh="true"
      :filter-placeholder="t('logs.filterPlaceholder')"
      @refresh="refreshLogs"
    />

    <div v-if="showLogs" class="p-4 pt-0">
      <div class="bg-muted/30 h-[400px] overflow-hidden rounded-lg border">
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
      <div class="text-muted-foreground mt-2 flex items-center justify-between text-xs">
        <span>
          {{
            filterText
              ? t('connectSettings.filteringLogsFor', { filter: filterText })
              : t('connectSettings.showingAllLogEntries')
          }}
        </span>
        <label class="flex cursor-pointer items-center gap-2">
          <input v-model="autoScroll" type="checkbox" class="rounded border-gray-300" />
          <span>{{ t('connectSettings.autoScroll') }}</span>
        </label>
      </div>
    </div>
  </div>
</template>
