<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApolloClient, useQuery } from '@vue/apollo-composable';
import { vInfiniteScroll } from '@vueuse/components';

import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/vue/24/outline';
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@unraid/ui';

import type { LogFileContentQuery, LogFileContentQueryVariables } from '~/composables/gql/graphql';

import { GET_LOG_FILE_CONTENT } from '~/components/Logs/log.query';
import { LOG_FILE_SUBSCRIPTION } from '~/components/Logs/log.subscription';
import { useContentHighlighting } from '~/composables/useContentHighlighting';
import { useThemeStore } from '~/store/theme';

// Get theme information
const themeStore = useThemeStore();
const isDarkMode = computed(() => themeStore.darkMode);

// Use shared highlighting logic
const { highlightContent } = useContentHighlighting();

const { t } = useI18n();

const props = defineProps<{
  logFilePath: string;
  lineCount: number;
  autoScroll: boolean;
  highlightLanguage?: string; // Optional prop to specify the language for highlighting
  clientFilter?: string; // Optional client-side filter to apply to log content
}>();

const DEFAULT_CHUNK_SIZE = 100;
const scrollViewportRef = ref<HTMLElement | null>(null);
const state = reactive({
  loadedContentChunks: [] as { content: string; startLine: number }[],
  currentStartLine: undefined as number | undefined,
  isLoadingMore: false,
  isRefreshing: false,
  isAtTop: false,
  canLoadMore: false,
  initialLoadComplete: false,
  isDownloading: false,
  isSubscriptionActive: false,
});

// Get Apollo client for direct queries
const { client } = useApolloClient();

// Fetch log content
const {
  result: logContentResult,
  loading: loadingLogContent,
  error: logContentError,
  refetch: refetchLogContent,
  subscribeToMore,
} = useQuery<LogFileContentQuery, LogFileContentQueryVariables>(
  GET_LOG_FILE_CONTENT,
  () => ({
    path: props.logFilePath,
    lines: props.lineCount || DEFAULT_CHUNK_SIZE,
    startLine: state.currentStartLine,
  }),
  () => ({
    enabled: !!props.logFilePath,
    fetchPolicy: 'network-only',
  })
);

// Force-scroll to bottom after DOM updates
const forceScrollToBottom = () => {
  nextTick(() => {
    if (scrollViewportRef.value) {
      scrollViewportRef.value.scrollTop = scrollViewportRef.value.scrollHeight;
    }
  });
};

// MutationObserver to detect changes in log content
let observer: MutationObserver | null = null;
onMounted(() => {
  if (scrollViewportRef.value) {
    observer = new MutationObserver(() => {
      if (props.autoScroll) {
        forceScrollToBottom();
      }
    });
    observer.observe(scrollViewportRef.value as unknown as Node, { childList: true, subtree: true });
  }

  // Start the log subscription
  startLogSubscription();
});

// Cleanup observer on unmount
onUnmounted(() => {
  observer?.disconnect();
});

// Handle log content updates
watch(
  logContentResult,
  (newResult) => {
    if (!newResult?.logFile) return;

    const { content, startLine } = newResult.logFile;
    const effectiveStartLine = startLine || 1;

    if (state.isLoadingMore) {
      // Loading more historical content - prepend to existing chunks
      state.loadedContentChunks.unshift({ content, startLine: effectiveStartLine });
      state.isLoadingMore = false;

      nextTick(() => (state.canLoadMore = true));
    } else if (state.isRefreshing) {
      // Refreshing - replace all content and reset state
      state.loadedContentChunks = [{ content, startLine: effectiveStartLine }];
      state.isRefreshing = false;
      state.currentStartLine = undefined;
      state.isAtTop = false;
      state.initialLoadComplete = true;

      nextTick(() => {
        forceScrollToBottom();
        setTimeout(() => (state.canLoadMore = true), 300);
      });
    } else {
      // Initial load - replace all content
      state.loadedContentChunks = [{ content, startLine: effectiveStartLine }];

      nextTick(() => {
        forceScrollToBottom();
        state.initialLoadComplete = true;
        setTimeout(() => (state.canLoadMore = true), 300);
      });
    }

    state.isAtTop = effectiveStartLine === 1;
    if (state.isAtTop) {
      state.canLoadMore = false;
    }
  },
  { deep: true }
);

// Function to highlight log content using shared composable
const highlightLog = (content: string): string => {
  return highlightContent(content, props.highlightLanguage);
};

// Apply client-side filtering
const filteredContent = computed(() => {
  // Join chunks ensuring proper newline handling
  const rawContent = state.loadedContentChunks
    .map((chunk) => chunk.content)
    .filter((content) => content) // Remove empty chunks
    .join(''); // Content should already have proper newlines

  // Apply client-side filter if provided
  if (props.clientFilter && props.clientFilter.trim()) {
    const filterLower = props.clientFilter.toLowerCase();
    const lines = rawContent.split('\n');
    const filtered = lines.filter((line) => line.toLowerCase().includes(filterLower));
    return filtered.join('\n');
  }

  return rawContent;
});

// Computed properties
const logContent = computed(() => {
  return highlightLog(filteredContent.value);
});

const totalLines = computed(() => logContentResult.value?.logFile?.totalLines || 0);
const shouldLoadMore = computed(() => state.canLoadMore && !state.isLoadingMore && !state.isAtTop);

// Load older log content
const loadMoreContent = async () => {
  if (state.isLoadingMore || state.isAtTop || !state.canLoadMore) return;

  state.isLoadingMore = true;
  state.canLoadMore = false;

  const firstChunk = state.loadedContentChunks[0];
  if (firstChunk) {
    const newStartLine = Math.max(1, firstChunk.startLine - DEFAULT_CHUNK_SIZE);
    state.currentStartLine = newStartLine;

    const prevScrollHeight = scrollViewportRef.value?.scrollHeight || 0;

    await refetchLogContent();

    nextTick(() => {
      if (scrollViewportRef.value) {
        scrollViewportRef.value.scrollTop += scrollViewportRef.value.scrollHeight - prevScrollHeight;
      }
    });

    if (newStartLine === 1) {
      state.isAtTop = true;
      state.canLoadMore = false;
    }
  }
};

// Download log file
const downloadLogFile = async () => {
  if (!props.logFilePath || state.isDownloading) return;

  try {
    state.isDownloading = true;

    // Get the filename from the path
    const fileName = props.logFilePath.split('/').pop() || 'log.txt';

    // Query for the entire log file content
    const result = await client.query({
      query: GET_LOG_FILE_CONTENT,
      variables: {
        path: props.logFilePath,
        // Don't specify lines or startLine to get the entire file
      },
      fetchPolicy: 'network-only',
    });

    if (!result.data?.logFile?.content) {
      throw new Error(t('logs.singleViewer.fetchLogContentFailure'));
    }

    // Create a blob with the content
    const blob = new Blob([result.data.logFile.content], { type: 'text/plain' });

    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    // Trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading log file:', error);
    alert(
      t('logs.singleViewer.errorDownloadingLogFile', {
        error: error instanceof Error ? error.message : String(error),
      })
    );
  } finally {
    state.isDownloading = false;
  }
};

// Helper function to start log subscription
const startLogSubscription = () => {
  if (!props.logFilePath) return;

  try {
    subscribeToMore({
      document: LOG_FILE_SUBSCRIPTION,
      variables: { path: props.logFilePath },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data || !prev) return prev;

        // Set subscription as active when we receive data
        state.isSubscriptionActive = true;

        const existingContent = prev.logFile?.content || '';
        const newContent = subscriptionData.data.logFile.content;

        // Update the local state with the new content
        if (newContent && state.loadedContentChunks.length > 0) {
          const lastChunk = state.loadedContentChunks[state.loadedContentChunks.length - 1];
          // Ensure there's a newline between the existing content and new content if needed
          if (lastChunk.content && !lastChunk.content.endsWith('\n') && newContent) {
            lastChunk.content += '\n' + newContent;
          } else {
            lastChunk.content += newContent;
          }

          // Force scroll to bottom if auto-scroll is enabled
          if (props.autoScroll) {
            nextTick(() => forceScrollToBottom());
          }
        }

        return {
          ...prev,
          logFile: {
            ...prev.logFile,
            content: existingContent + newContent,
            totalLines: (prev.logFile?.totalLines || 0) + (newContent.split('\n').length - 1),
          },
        };
      },
    });

    // Set subscription as active
    state.isSubscriptionActive = true;
  } catch (error) {
    console.error('Error starting log subscription:', error);
    state.isSubscriptionActive = false;
  }
};

// Refresh logs with full reset
const refreshLogContent = async () => {
  // Set refresh flag to indicate we're refreshing
  state.isRefreshing = true;
  state.isLoadingMore = false;
  state.canLoadMore = false;

  // Refetch with explicit variables to ensure we get the latest logs
  await refetchLogContent({
    path: props.logFilePath,
    lines: props.lineCount || DEFAULT_CHUNK_SIZE,
    startLine: undefined, // Explicitly pass undefined to get the latest lines
  });

  // Restart the subscription with the same variables used for refetch
  startLogSubscription();
};

watch(() => props.logFilePath, refreshLogContent);
defineExpose({ refreshLogContent });
</script>

<template>
  <div class="log-viewer flex h-full max-h-full flex-col overflow-hidden">
    <div
      class="bg-muted text-muted-foreground flex shrink-0 items-center justify-between px-4 py-2 text-xs"
    >
      <div class="flex items-center gap-2">
        <span>{{ t('logs.singleViewer.totalLines', { count: totalLines }) }}</span>
        <TooltipProvider v-if="state.isSubscriptionActive">
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
      <span>
        {{
          state.isAtTop
            ? t('logs.singleViewer.showingAllLines')
            : t('logs.singleViewer.scrollUpToLoadMore')
        }}
      </span>
      <div class="flex gap-2">
        <Button
          variant="outline"
          :disabled="loadingLogContent || state.isDownloading"
          @click="downloadLogFile"
        >
          <ArrowDownTrayIcon
            class="mr-1 h-3 w-3"
            :class="{ 'animate-pulse': state.isDownloading }"
            aria-hidden="true"
          />
          <span class="text-sm">
            {{
              state.isDownloading ? t('logs.singleViewer.downloading') : t('logs.singleViewer.download')
            }}
          </span>
        </Button>
        <Button variant="outline" :disabled="loadingLogContent" @click="refreshLogContent">
          <ArrowPathIcon class="mr-1 h-3 w-3" aria-hidden="true" />
          <span class="text-sm">{{ t('logs.singleViewer.refresh') }}</span>
        </Button>
      </div>
    </div>

    <div
      v-if="loadingLogContent && !state.isLoadingMore"
      class="text-muted-foreground flex flex-1 items-center justify-center p-4"
    >
      {{ t('logs.singleViewer.loadingLogContent') }}
    </div>

    <div
      v-else-if="logContentError"
      class="text-destructive flex flex-1 items-center justify-center p-4"
    >
      {{ t('logs.singleViewer.errorLoadingLogContent', { error: logContentError.message }) }}
    </div>

    <div
      v-else
      ref="scrollViewportRef"
      v-infinite-scroll="[
        loadMoreContent,
        { direction: 'top', distance: 200, canLoadMore: () => shouldLoadMore },
      ]"
      class="flex-1 overflow-y-auto"
      :class="{ 'theme-dark': isDarkMode, 'theme-light': !isDarkMode }"
    >
      <!-- Loading indicator for loading more content -->
      <div
        v-if="state.isLoadingMore"
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
        v-html="logContent"
      />
    </div>
  </div>
</template>

<style scoped>
/* Define CSS variables for both light and dark themes */
.log-viewer {
  /* Light theme colors (default) - adjusted for better readability */
  --log-keyword-color: hsl(var(--destructive) / 0.9); /* Slightly dimmed */
  --log-string-color: hsl(var(--primary) / 0.7); /* Dimmed primary color */
  --log-comment-color: hsl(var(--muted-foreground));
  --log-number-color: hsl(var(--accent-foreground) / 0.8); /* Slightly dimmed */
  --log-timestamp-color: hsl(210, 90%, 40%); /* Darker blue for timestamps */
  --log-ip-color: hsl(32, 90%, 40%); /* Darker orange for IPs */
  --log-error-color: hsl(var(--destructive) / 0.9); /* Slightly dimmed */
  --log-warning-color: hsl(40, 90%, 40%); /* Darker yellow for warnings */
  --log-success-color: hsl(142, 70%, 35%); /* Darker green for success */
  --log-error-bg: hsl(var(--destructive) / 0.08); /* Lighter background */
  --log-warning-bg: hsl(40, 90%, 50% / 0.08); /* Lighter background */
  --log-success-bg: hsl(142, 70%, 40% / 0.08); /* Lighter background */
}

/* Dark theme colors - use slightly different color combinations for better visibility */
.theme-dark {
  --log-keyword-color: hsl(var(--destructive) / 0.9);
  --log-string-color: hsl(var(--primary) / 0.9);
  --log-comment-color: hsl(var(--muted-foreground) / 0.9);
  --log-number-color: hsl(var(--accent-foreground) / 0.9);
  --log-timestamp-color: hsl(210, 100%, 66%); /* Brighter blue for timestamps in dark mode */
  --log-ip-color: hsl(32, 100%, 56%); /* Brighter orange for IPs in dark mode */
  --log-error-color: hsl(350, 100%, 66%); /* Brighter red for errors in dark mode */
  --log-warning-color: hsl(50, 100%, 60%); /* Brighter yellow for warnings in dark mode */
  --log-success-color: hsl(120, 100%, 45%); /* Brighter green for success in dark mode */
  --log-error-bg: hsl(350, 100%, 40% / 0.15);
  --log-warning-bg: hsl(50, 100%, 50% / 0.15);
  --log-success-bg: hsl(120, 100%, 40% / 0.15);
}

/* Style for error messages */
.hljs .hljs-keyword,
.hljs .hljs-selector-tag,
.hljs .hljs-literal,
.hljs .hljs-section,
.hljs .hljs-link {
  color: var(--log-keyword-color);
}

/* Style for warnings */
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

/* Style for info messages */
.hljs .hljs-comment,
.hljs .hljs-quote,
.hljs .hljs-deletion,
.hljs .hljs-meta {
  color: var(--log-comment-color);
}

/* Style for timestamps and IDs */
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

/* Style for success messages */
.hljs .hljs-function .hljs-keyword,
.hljs .hljs-class .hljs-keyword {
  color: var(--log-success-color);
}

/* Custom log pattern styles */
.hljs-timestamp {
  color: var(--log-timestamp-color);
  font-weight: bold;
}

.hljs-ip {
  color: var(--log-ip-color);
}

/* Error line and keyword styling */
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

/* Warning line and keyword styling */
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

/* Success line and keyword styling */
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

/* ANSI color styles for ansi_up output - using format: ansi-{color}-fg/bg */
/* Foreground colors */
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

/* Bright foreground colors */
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

/* Background colors */
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

/* Bright background colors */
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

/* Additional ansi_up classes */
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
