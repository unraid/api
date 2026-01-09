<script setup lang="ts">
import { computed, ref } from 'vue';

import { Dialog } from '@unraid/ui';

import SingleLogViewer from '~/components/Logs/SingleLogViewer.vue';

interface Props {
  modelValue: boolean;
  logFilePath: string;
  filter?: string;
  title?: string;
  description?: string;
  lineCount?: number;
  autoScroll?: boolean;
  highlightLanguage?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const props = withDefaults(defineProps<Props>(), {
  lineCount: 100,
  autoScroll: true,
  highlightLanguage: 'plaintext',
  size: 'xl',
  title: 'Log Viewer',
  filter: undefined,
  description: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const _logViewerRef = ref<InstanceType<typeof SingleLogViewer> | null>(null);

const fullLogPath = computed(() => {
  if (props.logFilePath.startsWith('/')) {
    return props.logFilePath;
  }
  return `/var/log/${props.logFilePath}`;
});

const handleOpenChange = (open: boolean) => {
  emit('update:modelValue', open);
};
</script>

<template>
  <Dialog
    :model-value="modelValue"
    :title="title"
    :description="description"
    :size="size"
    :show-footer="false"
    @update:model-value="handleOpenChange"
  >
    <div class="flex h-[600px] flex-col">
      <SingleLogViewer
        ref="_logViewerRef"
        :log-file-path="fullLogPath"
        :line-count="lineCount"
        :auto-scroll="autoScroll"
        :highlight-language="highlightLanguage"
        :filter="filter"
        class="flex-1"
      />
    </div>
  </Dialog>
</template>
