<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/vue/24/outline';
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@unraid/ui';

import { useContentHighlighting } from '~/composables/useContentHighlighting';
import { useThemeStore } from '~/store/theme';

const themeStore = useThemeStore();
const isDarkMode = computed(() => themeStore.darkMode);
const { highlightContent } = useContentHighlighting();
const { t } = useI18n();

interface Props {
  logContent: string;
  loading?: boolean;
  error?: string | null;
  totalLines?: number;
  autoScroll?: boolean;
  highlightLanguage?: string;
  showDownload?: boolean;
  showRefresh?: boolean;
  showSubscriptionIndicator?: boolean;
  additionalInfo?: string;
  loadingMoreContent?: boolean;
  isAtTop?: boolean;
  canLoadMore?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  totalLines: 0,
  autoScroll: true,
  highlightLanguage: 'plaintext',
  showDownload: false,
  showRefresh: true,
  showSubscriptionIndicator: false,
  additionalInfo: '',
  loadingMoreContent: false,
  isAtTop: false,
  canLoadMore: false,
});

const emit = defineEmits<{
  (e: 'refresh'): void;
  (e: 'download'): void;
  (e: 'load-more'): void;
}>();

const scrollViewportRef = ref<HTMLElement | null>(null);

const highlightedContent = computed(() => {
  return highlightContent(props.logContent, props.highlightLanguage);
});

const forceScrollToBottom = () => {
  nextTick(() => {
    if (scrollViewportRef.value) {
      scrollViewportRef.value.scrollTop = scrollViewportRef.value.scrollHeight;
    }
  });
};

watch(
  () => props.logContent,
  () => {
    if (props.autoScroll) {
      forceScrollToBottom();
    }
  }
);

let observer: MutationObserver | null = null;
onMounted(() => {
  if (scrollViewportRef.value && props.autoScroll) {
    observer = new MutationObserver(() => {
      if (props.autoScroll) {
        forceScrollToBottom();
      }
    });
    observer.observe(scrollViewportRef.value as unknown as Node, {
      childList: true,
      subtree: true,
    });
  }
});

onUnmounted(() => {
  observer?.disconnect();
});

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  if (target.scrollTop === 0 && props.canLoadMore) {
    emit('load-more');
  }
};

defineExpose({ forceScrollToBottom, scrollViewportRef });
</script>

<template>
  <div class="log-viewer flex h-full max-h-full flex-col overflow-hidden">
    <div
      class="bg-muted text-muted-foreground flex shrink-0 items-center justify-between px-4 py-2 text-xs"
    >
      <div class="flex items-center gap-2">
        <span>{{ t('logs.singleViewer.totalLines', { count: totalLines }) }}</span>
        <TooltipProvider v-if="showSubscriptionIndicator">
          <Tooltip :delay-duration="300">
            <TooltipTrigger as-child>
              <div
                class="h-2 w-2 animate-pulse cursor-help rounded-full bg-green-500"
                aria-hidden="true"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>{{ t('logs.singleViewer.watchingLogFileTooltip') }}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <span v-if="additionalInfo">{{ additionalInfo }}</span>
      <span v-else-if="isAtTop">{{ t('logs.singleViewer.showingAllLines') }}</span>
      <span v-else-if="canLoadMore">{{ t('logs.singleViewer.scrollUpToLoadMore') }}</span>
      <div class="flex gap-2">
        <Button v-if="showDownload" variant="outline" :disabled="loading" @click="emit('download')">
          <ArrowDownTrayIcon class="mr-1 h-3 w-3" aria-hidden="true" />
          <span class="text-sm">{{ t('logs.singleViewer.download') }}</span>
        </Button>
        <Button v-if="showRefresh" variant="outline" :disabled="loading" @click="emit('refresh')">
          <ArrowPathIcon class="mr-1 h-3 w-3" aria-hidden="true" />
          <span class="text-sm">{{ t('logs.singleViewer.refresh') }}</span>
        </Button>
      </div>
    </div>

    <div
      v-if="loading && !logContent"
      class="text-muted-foreground flex flex-1 items-center justify-center p-4"
    >
      {{ t('logs.singleViewer.loadingLogContent') }}
    </div>

    <div v-else-if="error" class="text-destructive flex flex-1 items-center justify-center p-4">
      {{ t('logs.singleViewer.errorLoadingLogContent', { error }) }}
    </div>

    <div
      v-else
      ref="scrollViewportRef"
      class="flex-1 overflow-y-auto"
      :class="{ 'theme-dark': isDarkMode, 'theme-light': !isDarkMode }"
      @scroll="handleScroll"
    >
      <div
        v-if="loadingMoreContent"
        class="bg-muted/80 border-border sticky top-0 z-10 mx-2 mt-2 rounded-md border-b backdrop-blur-xs"
      >
        <div class="text-primary-foreground flex items-center justify-center p-2 text-xs">
          <ArrowPathIcon class="mr-2 h-3 w-3 animate-spin" aria-hidden="true" />
          {{ t('logs.singleViewer.loadingMoreLines') }}
        </div>
      </div>

      <pre
        class="hljs m-0 p-4 font-mono text-xs leading-6 whitespace-pre"
        :class="{ 'theme-dark': isDarkMode, 'theme-light': !isDarkMode }"
        v-html="highlightedContent"
      />
    </div>
  </div>
</template>

<style scoped>
.log-viewer {
  --log-keyword-color: hsl(var(--destructive) / 0.9);
  --log-string-color: hsl(var(--primary) / 0.7);
  --log-comment-color: hsl(var(--muted-foreground));
  --log-number-color: hsl(var(--accent-foreground) / 0.8);
  --log-timestamp-color: hsl(210, 90%, 40%);
  --log-ip-color: hsl(32, 90%, 40%);
  --log-error-color: hsl(var(--destructive) / 0.9);
  --log-warning-color: hsl(40, 90%, 40%);
  --log-success-color: hsl(142, 70%, 35%);
  --log-error-bg: hsl(var(--destructive) / 0.08);
  --log-warning-bg: hsl(40, 90%, 50% / 0.08);
  --log-success-bg: hsl(142, 70%, 40% / 0.08);
}

.theme-dark {
  --log-keyword-color: hsl(var(--destructive) / 0.9);
  --log-string-color: hsl(var(--primary) / 0.9);
  --log-comment-color: hsl(var(--muted-foreground) / 0.9);
  --log-number-color: hsl(var(--accent-foreground) / 0.9);
  --log-timestamp-color: hsl(210, 100%, 66%);
  --log-ip-color: hsl(32, 100%, 56%);
  --log-error-color: hsl(350, 100%, 66%);
  --log-warning-color: hsl(50, 100%, 60%);
  --log-success-color: hsl(120, 100%, 45%);
  --log-error-bg: hsl(350, 100%, 40% / 0.15);
  --log-warning-bg: hsl(50, 100%, 50% / 0.15);
  --log-success-bg: hsl(120, 100%, 40% / 0.15);
}

.hljs .hljs-keyword,
.hljs .hljs-selector-tag,
.hljs .hljs-literal,
.hljs .hljs-section,
.hljs .hljs-link {
  color: var(--log-keyword-color);
}

.hljs .hljs-string,
.hljs .hljs-title,
.hljs .hljs-name,
.hljs .hljs-type,
.hljs .hljs-attribute,
.hljs .hljs-symbol,
.hljs .hljs-bullet,
.hljs .hljs-built_in,
.hljs .hljs-addition,
.hljs .hljs-variable,
.hljs .hljs-template-tag,
.hljs .hljs-template-variable {
  color: var(--log-string-color);
}

.hljs .hljs-comment,
.hljs .hljs-quote,
.hljs .hljs-deletion,
.hljs .hljs-meta {
  color: var(--log-comment-color);
}

.hljs .hljs-number,
.hljs .hljs-regexp,
.hljs .hljs-literal,
.hljs .hljs-variable,
.hljs .hljs-template-variable,
.hljs .hljs-tag .hljs-attr,
.hljs .hljs-tag .hljs-string,
.hljs .hljs-attr,
.hljs .hljs-string {
  color: var(--log-number-color);
}

.hljs .hljs-function .hljs-keyword,
.hljs .hljs-class .hljs-keyword {
  color: var(--log-success-color);
}

.hljs-timestamp {
  color: var(--log-timestamp-color);
  font-weight: bold;
}

.hljs-ip {
  color: var(--log-ip-color);
}

.hljs-error {
  display: inline-block;
  width: 100%;
  padding-left: 4px;
  margin-left: -4px;
}

.theme-light .hljs-error {
  background-color: hsl(var(--destructive) / 0.05);
  border-left: 2px solid hsl(var(--destructive) / 0.7);
}

.theme-dark .hljs-error {
  background-color: var(--log-error-bg);
}

.hljs-error-keyword {
  color: var(--log-error-color);
  font-weight: bold;
}

.hljs-warning {
  display: inline-block;
  width: 100%;
  padding-left: 4px;
  margin-left: -4px;
}

.theme-light .hljs-warning {
  background-color: hsl(40, 90%, 50% / 0.05);
  border-left: 2px solid hsl(40, 90%, 40% / 0.7);
}

.theme-dark .hljs-warning {
  background-color: var(--log-warning-bg);
}

.hljs-warning-keyword {
  color: var(--log-warning-color);
  font-weight: bold;
}

.hljs-success {
  display: inline-block;
  width: 100%;
  padding-left: 4px;
  margin-left: -4px;
}

.theme-light .hljs-success {
  background-color: hsl(142, 70%, 40% / 0.05);
  border-left: 2px solid hsl(142, 70%, 35% / 0.7);
}

.theme-dark .hljs-success {
  background-color: var(--log-success-bg);
}

.hljs-success-keyword {
  color: var(--log-success-color);
  font-weight: bold;
}

:deep(.ansi-black-fg) {
  color: #000;
}
:deep(.ansi-red-fg) {
  color: #c91b00;
}
:deep(.ansi-green-fg) {
  color: #00c200;
}
:deep(.ansi-yellow-fg) {
  color: #c7c400;
}
:deep(.ansi-blue-fg) {
  color: #0225c7;
}
:deep(.ansi-magenta-fg) {
  color: #c930c7;
}
:deep(.ansi-cyan-fg) {
  color: #00c5c7;
}
:deep(.ansi-white-fg) {
  color: #c7c7c7;
}

:deep(.ansi-bright-black-fg) {
  color: #676767;
}
:deep(.ansi-bright-red-fg) {
  color: #ff6d67;
}
:deep(.ansi-bright-green-fg) {
  color: #5ff967;
}
:deep(.ansi-bright-yellow-fg) {
  color: #fefb67;
}
:deep(.ansi-bright-blue-fg) {
  color: #6871ff;
}
:deep(.ansi-bright-magenta-fg) {
  color: #ff76ff;
}
:deep(.ansi-bright-cyan-fg) {
  color: #5ffdff;
}
:deep(.ansi-bright-white-fg) {
  color: #fff;
}

:deep(.ansi-black-bg) {
  background-color: #000;
}
:deep(.ansi-red-bg) {
  background-color: #c91b00;
}
:deep(.ansi-green-bg) {
  background-color: #00c200;
}
:deep(.ansi-yellow-bg) {
  background-color: #c7c400;
}
:deep(.ansi-blue-bg) {
  background-color: #0225c7;
}
:deep(.ansi-magenta-bg) {
  background-color: #c930c7;
}
:deep(.ansi-cyan-bg) {
  background-color: #00c5c7;
}
:deep(.ansi-white-bg) {
  background-color: #c7c7c7;
}

:deep(.ansi-bright-black-bg) {
  background-color: #676767;
}
:deep(.ansi-bright-red-bg) {
  background-color: #ff6d67;
}
:deep(.ansi-bright-green-bg) {
  background-color: #5ff967;
}
:deep(.ansi-bright-yellow-bg) {
  background-color: #fefb67;
}
:deep(.ansi-bright-blue-bg) {
  background-color: #6871ff;
}
:deep(.ansi-bright-magenta-bg) {
  background-color: #ff76ff;
}
:deep(.ansi-bright-cyan-bg) {
  background-color: #5ffdff;
}
:deep(.ansi-bright-white-bg) {
  background-color: #fff;
}

:deep(.ansi-bold) {
  font-weight: bold;
}
:deep(.ansi-italic) {
  font-style: italic;
}
:deep(.ansi-underline) {
  text-decoration: underline;
}
:deep(.ansi-strike) {
  text-decoration: line-through;
}
</style>
