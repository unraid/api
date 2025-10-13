<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@vue/apollo-composable';

import { Input, Label, Select, Switch } from '@unraid/ui';
import convert from 'convert';

import { GET_LOG_FILES } from '~/components/Logs/log.query';
import LogViewerToolbar from '~/components/Logs/LogViewerToolbar.vue';
import SingleLogViewer from '~/components/Logs/SingleLogViewer.vue';

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
const { t } = useI18n();

// Preset filter options
const presetFilterOptions = computed(() => [
  { value: 'none', label: t('logs.presets.none') },
  { value: 'OIDC', label: t('logs.presets.oidc') },
  { value: 'ERROR', label: t('logs.presets.error') },
  { value: 'WARNING', label: t('logs.presets.warning') },
  { value: 'AUTH', label: t('logs.presets.auth') },
]);

const highlightLanguageOptions = computed(() => [
  { value: 'plaintext', label: t('logs.viewer.highlightLanguages.plaintext') },
  { value: 'bash', label: t('logs.viewer.highlightLanguages.bash') },
  { value: 'ini', label: t('logs.viewer.highlightLanguages.ini') },
  { value: 'xml', label: t('logs.viewer.highlightLanguages.xml') },
  { value: 'json', label: t('logs.viewer.highlightLanguages.json') },
  { value: 'yaml', label: t('logs.viewer.highlightLanguages.yaml') },
  { value: 'nginx', label: t('logs.viewer.highlightLanguages.nginx') },
  { value: 'apache', label: t('logs.viewer.highlightLanguages.apache') },
  { value: 'javascript', label: t('logs.viewer.highlightLanguages.javascript') },
  { value: 'php', label: t('logs.viewer.highlightLanguages.php') },
]);

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
    label: t('logs.viewer.logFileOptionLabel', {
      name: file.name,
      size: formatFileSize(file.size),
    }),
  }));
});

const unitLabels = computed<Record<string, string>>(() => ({
  B: t('logs.viewer.sizeUnits.bytes'),
  KB: t('logs.viewer.sizeUnits.kilobytes'),
  MB: t('logs.viewer.sizeUnits.megabytes'),
  GB: t('logs.viewer.sizeUnits.gigabytes'),
  TB: t('logs.viewer.sizeUnits.terabytes'),
  PB: t('logs.viewer.sizeUnits.petabytes'),
}));

// Format file size for display
const formatFileSize = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    const unit = unitLabels.value.B;
    return t('logs.viewer.zeroBytes', { unit });
  }

  try {
    const best = convert(bytes, 'B').to('best', 'metric');
    const formattedValue = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(best.quantity as number);

    const unit = unitLabels.value[best.unit] ?? best.unit;
    return t('logs.viewer.formattedSize', { value: formattedValue, unit });
  } catch (error) {
    console.error('[LogViewer] Failed to format file size', error);
    const unit = unitLabels.value.B;
    return t('logs.viewer.zeroBytes', { unit });
  }
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
    class="bg-background text-foreground border-border flex h-[500px] resize-y flex-col overflow-hidden rounded-lg border"
  >
    <LogViewerToolbar
      v-model:filter-text="filterText"
      v-model:preset-filter="presetFilter"
      :title="t('logs.viewer.title')"
      :show-presets="true"
      :preset-filters="presetFilterOptions"
      :show-toggle="false"
      :show-refresh="false"
    />

    <div class="border-border border-b p-4">
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-[200px] flex-1">
          <Label for="log-file-select">{{ t('logs.viewer.logFileLabel') }}</Label>
          <Select
            v-model="selectedLogFile"
            :items="logFileOptions"
            :placeholder="t('logs.viewer.selectLogFilePlaceholder')"
            class="w-full"
          />
        </div>

        <div>
          <Label for="line-count">{{ t('logs.viewer.linesLabel') }}</Label>
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
          <Label for="highlight-language">{{ t('logs.viewer.syntaxLabel') }}</Label>
          <Select
            v-model="highlightLanguage"
            :items="highlightLanguageOptions"
            :placeholder="t('logs.viewer.selectLanguagePlaceholder')"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-2">
          <Label for="auto-scroll">{{ t('logs.viewer.autoScrollLabel') }}</Label>
          <Switch id="auto-scroll" v-model:checked="autoScroll" />
        </div>
      </div>
    </div>

    <div class="relative flex-1 overflow-hidden">
      <div
        v-if="loadingLogFiles"
        class="text-muted-foreground flex h-full items-center justify-center p-4 text-center"
      >
        {{ t('logs.viewer.loadingLogFiles') }}
      </div>

      <div
        v-else-if="logFilesError"
        class="text-destructive flex h-full items-center justify-center p-4 text-center"
      >
        {{ t('logs.viewer.errorLoadingLogFiles', { error: logFilesError.message }) }}
      </div>

      <div
        v-else-if="logFiles.length === 0"
        class="text-muted-foreground flex h-full items-center justify-center p-4 text-center"
      >
        {{ t('logs.viewer.noLogFiles') }}
      </div>

      <div
        v-else-if="!selectedLogFile"
        class="text-muted-foreground flex h-full items-center justify-center p-4 text-center"
      >
        {{ t('logs.viewer.selectLogFilePrompt') }}
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
