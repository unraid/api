<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';

import {
  Input,
  Label,
  Select,
  Switch,
} from '@unraid/ui';

import { GET_LOG_FILES } from './log.query';
import SingleLogViewer from './SingleLogViewer.vue';
import LogViewerToolbar from './LogViewerToolbar.vue';

// Types
interface LogFile {
  path: string;
  name: string;
  size: number;
}

// Component state
const selectedLogFile = ref<string | null>(null);
const lineCount = ref<number>(100);
const autoScroll = ref<boolean>(true);
const highlightLanguage = ref<string>('plaintext');
const filterText = ref<string>('');
const presetFilter = ref<string>('none');

// Available highlight languages
const highlightLanguages = [
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'bash', label: 'Bash/Shell' },
  { value: 'ini', label: 'INI/Config' },
  { value: 'xml', label: 'XML/HTML' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'nginx', label: 'Nginx' },
  { value: 'apache', label: 'Apache' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'php', label: 'PHP' },
];

// Preset filter options
const presetFilters = [
  { value: 'none', label: 'No Filter' },
  { value: 'OIDC', label: 'OIDC Logs' },
  { value: 'ERROR', label: 'Errors' },
  { value: 'WARNING', label: 'Warnings' },
  { value: 'AUTH', label: 'Authentication' },
];

// Fetch log files
const {
  result: logFilesResult,
  loading: loadingLogFiles,
  error: logFilesError,
} = useQuery(GET_LOG_FILES);

const logFiles = computed(() => {
  return logFilesResult.value?.logFiles || [];
});

// Transform log files for the Select component
const logFileOptions = computed(() => {
  return logFiles.value.map((file: LogFile) => ({
    value: file.path,
    label: `${file.name} (${formatFileSize(file.size)})`
  }));
});

// Format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Auto-detect language based on file extension
const autoDetectLanguage = (filePath: string): string => {
  const fileName = filePath.split('/').pop() || '';

  if (fileName.endsWith('.sh') || fileName.endsWith('.bash') || fileName.includes('syslog')) {
    return 'bash';
  } else if (fileName.endsWith('.conf') || fileName.endsWith('.ini') || fileName.endsWith('.cfg')) {
    return 'ini';
  } else if (fileName.endsWith('.xml') || fileName.endsWith('.html')) {
    return 'xml';
  } else if (fileName.endsWith('.json')) {
    return 'json';
  } else if (fileName.endsWith('.yml') || fileName.endsWith('.yaml')) {
    return 'yaml';
  } else if (fileName.includes('nginx')) {
    return 'nginx';
  } else if (fileName.includes('apache') || fileName.includes('httpd')) {
    return 'apache';
  } else if (fileName.endsWith('.js')) {
    return 'javascript';
  } else if (fileName.endsWith('.php')) {
    return 'php';
  }

  return 'plaintext';
};

// Watch for file selection changes to auto-detect language
watch(selectedLogFile, (newValue) => {
  if (newValue) {
    highlightLanguage.value = autoDetectLanguage(newValue);
  }
});

// Watch for preset filter changes to update the filter text
watch(presetFilter, (newValue) => {
  if (newValue && newValue !== 'none') {
    filterText.value = newValue;
  } else if (newValue === 'none') {
    filterText.value = '';
  }
});
</script>

<template>
  <div
    class="flex flex-col h-[500px] resize-y bg-background text-foreground rounded-lg border border-border overflow-hidden"
  >
    <LogViewerToolbar
      v-model:filter-text="filterText"
      v-model:preset-filter="presetFilter"
      title="Log Viewer"
      :show-presets="true"
      :preset-filters="presetFilters"
      :show-toggle="false"
      :show-refresh="false"
    />
    
    <div class="p-4 border-b border-border">
      <div class="flex flex-wrap gap-4 items-end">
        <div class="flex-1 min-w-[200px]">
          <Label for="log-file-select">Log File</Label>
          <Select
            v-model="selectedLogFile"
            :items="logFileOptions"
            placeholder="Select a log file"
            class="w-full"
          />
        </div>

        <div>
          <Label for="line-count">Lines</Label>
          <Input
            id="line-count"
            v-model.number="lineCount"
            type="number"
            min="10"
            max="1000"
            class="w-24"
          />
        </div>

        <div>
          <Label for="highlight-language">Syntax</Label>
          <Select
            v-model="highlightLanguage"
            :items="highlightLanguages"
            placeholder="Select language"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-2">
          <Label for="auto-scroll">Auto-scroll</Label>
          <Switch id="auto-scroll" v-model:checked="autoScroll" />
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-hidden relative">
      <div
        v-if="loadingLogFiles"
        class="flex items-center justify-center h-full p-4 text-center text-muted-foreground"
      >
        Loading log files...
      </div>

      <div
        v-else-if="logFilesError"
        class="flex items-center justify-center h-full p-4 text-center text-destructive"
      >
        Error loading log files: {{ logFilesError.message }}
      </div>

      <div
        v-else-if="logFiles.length === 0"
        class="flex items-center justify-center h-full p-4 text-center text-muted-foreground"
      >
        No log files found.
      </div>

      <div
        v-else-if="!selectedLogFile"
        class="flex items-center justify-center h-full p-4 text-center text-muted-foreground"
      >
        Please select a log file to view.
      </div>

      <SingleLogViewer
        v-else
        :log-file-path="selectedLogFile"
        :line-count="lineCount"
        :auto-scroll="autoScroll"
        :highlight-language="highlightLanguage"
        :client-filter="filterText"
        class="h-full"
      />
    </div>
  </div>
</template>
