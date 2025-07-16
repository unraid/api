<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useApolloClient, useQuery } from '@vue/apollo-composable';
import { vInfiniteScroll } from '@vueuse/components';

import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/vue/24/outline';
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@unraid/ui';
import hljs from 'highlight.js/lib/core';
import DOMPurify from 'isomorphic-dompurify';

import 'highlight.js/styles/github-dark.css'; // You can choose a different style

import apache from 'highlight.js/lib/languages/apache';
import bash from 'highlight.js/lib/languages/bash';
import ini from 'highlight.js/lib/languages/ini';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import nginx from 'highlight.js/lib/languages/nginx';
import php from 'highlight.js/lib/languages/php';
// Register the languages you want to support
import plaintext from 'highlight.js/lib/languages/plaintext';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

import type { LogFileContentQuery, LogFileContentQueryVariables } from '~/composables/gql/graphql';

import { useThemeStore } from '~/store/theme';
import { GET_LOG_FILE_CONTENT } from './log.query';
import { LOG_FILE_SUBSCRIPTION } from './log.subscription';

// Get theme information
const themeStore = useThemeStore();
const isDarkMode = computed(() => themeStore.darkMode);

// Register the languages
hljs.registerLanguage('plaintext', plaintext);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('ini', ini);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('nginx', nginx);
hljs.registerLanguage('apache', apache);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('php', php);

const props = defineProps<{
  logFilePath: string;
  lineCount: number;
  autoScroll: boolean;
  highlightLanguage?: string; // Optional prop to specify the language for highlighting
}>();

// Default language for highlighting
const defaultLanguage = 'plaintext';

const DEFAULT_CHUNK_SIZE = 100;
const scrollViewportRef = ref<HTMLElement | null>(null);
const state = reactive({
  loadedContentChunks: [] as { content: string; startLine: number }[],
  currentStartLine: undefined as number | undefined,
  isLoadingMore: false,
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

  if (props.logFilePath) {
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
          lastChunk.content += newContent;

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
  }
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
      state.loadedContentChunks.unshift({ content, startLine: effectiveStartLine });
      state.isLoadingMore = false;

      nextTick(() => (state.canLoadMore = true));
    } else {
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

// Function to highlight log content
const highlightLog = (content: string): string => {
  try {
    // Determine which language to use for highlighting
    const language = props.highlightLanguage || defaultLanguage;

    // Apply syntax highlighting
    let highlighted = hljs.highlight(content, { language }).value;

    // Apply additional custom highlighting for common log patterns

    // Highlight timestamps (various formats)
    highlighted = highlighted.replace(
      /\b(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\b/g,
      '<span class="hljs-timestamp">$1</span>'
    );

    // Highlight IP addresses
    highlighted = highlighted.replace(
      /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g,
      '<span class="hljs-ip">$1</span>'
    );

    // Split the content into lines
    let lines = highlighted.split('\n');

    // Process each line to add error, warning, and success highlighting
    lines = lines.map((line) => {
      if (/(error|exception|fail|failed|failure)/i.test(line)) {
        // Highlight error keywords
        line = line.replace(
          /\b(error|exception|fail|failed|failure)\b/gi,
          '<span class="hljs-error-keyword">$1</span>'
        );
        // Wrap the entire line
        return `<span class="hljs-error">${line}</span>`;
      } else if (/(warning|warn)/i.test(line)) {
        // Highlight warning keywords
        line = line.replace(/\b(warning|warn)\b/gi, '<span class="hljs-warning-keyword">$1</span>');
        // Wrap the entire line
        return `<span class="hljs-warning">${line}</span>`;
      } else if (/(success|successful|completed|done)/i.test(line)) {
        // Highlight success keywords
        line = line.replace(
          /\b(success|successful|completed|done)\b/gi,
          '<span class="hljs-success-keyword">$1</span>'
        );
        // Wrap the entire line
        return `<span class="hljs-success">${line}</span>`;
      }
      return line;
    });

    // Join the lines back together
    highlighted = lines.join('\n');

    // Sanitize the highlighted HTML
    return DOMPurify.sanitize(highlighted);
  } catch (error) {
    console.error('Error highlighting log content:', error);
    // Fallback to sanitized but not highlighted content
    return DOMPurify.sanitize(content);
  }
};

// Computed properties
const logContent = computed(() => {
  const rawContent = state.loadedContentChunks.map((chunk) => chunk.content).join('');
  return highlightLog(rawContent);
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
      throw new Error('Failed to fetch log content');
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
    alert(`Error downloading log file: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    state.isDownloading = false;
  }
};

// Refresh logs
const refreshLogContent = () => {
  state.loadedContentChunks = [];
  state.currentStartLine = undefined;
  state.isAtTop = false;
  state.canLoadMore = false;
  state.initialLoadComplete = false;
  state.isLoadingMore = false;
  refetchLogContent();

  nextTick(() => {
    forceScrollToBottom();
  });
};

watch(() => props.logFilePath, refreshLogContent);
defineExpose({ refreshLogContent });
</script>

<template>
  <div class="flex flex-col h-full max-h-full overflow-hidden">
    <div
      class="flex justify-between px-4 py-2 bg-muted text-xs text-muted-foreground shrink-0 items-center"
    >
      <div class="flex items-center gap-2">
        <span>Total lines: {{ totalLines }}</span>
        <TooltipProvider v-if="state.isSubscriptionActive">
          <Tooltip :delay-duration="300">
            <TooltipTrigger as-child>
              <div
                class="w-2 h-2 rounded-full bg-green-500 animate-pulse cursor-help"
                aria-hidden="true"
              ></div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Watching log file</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <span>{{ state.isAtTop ? 'Showing all available lines' : 'Scroll up to load more' }}</span>
      <div class="flex gap-2">
        <Button
          variant="outline"
          :disabled="loadingLogContent || state.isDownloading"
          @click="downloadLogFile"
        >
          <ArrowDownTrayIcon
            class="h-3 w-3 mr-1"
            :class="{ 'animate-pulse': state.isDownloading }"
            aria-hidden="true"
          />
          <span class="text-sm">{{ state.isDownloading ? 'Downloading...' : 'Download' }}</span>
        </Button>
        <Button variant="outline" :disabled="loadingLogContent" @click="refreshLogContent">
          <ArrowPathIcon class="h-3 w-3 mr-1" aria-hidden="true" />
          <span class="text-sm">Refresh</span>
        </Button>
      </div>
    </div>

    <div
      v-if="loadingLogContent && !state.isLoadingMore"
      class="flex items-center justify-center flex-1 p-4 text-muted-foreground"
    >
      Loading log content...
    </div>

    <div
      v-else-if="logContentError"
      class="flex items-center justify-center flex-1 p-4 text-destructive"
    >
      Error loading log content: {{ logContentError.message }}
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
        class="sticky top-0 z-10 bg-muted/80 backdrop-blur-xs border-b border-border rounded-md mx-2 mt-2"
      >
        <div class="flex items-center justify-center p-2 text-xs text-primary-foreground">
          <ArrowPathIcon class="h-3 w-3 mr-2 animate-spin" aria-hidden="true" />
          Loading more lines...
        </div>
      </div>

      <pre
        class="font-mono whitespace-pre-wrap p-4 m-0 text-xs leading-6 hljs"
        :class="{ 'theme-dark': isDarkMode, 'theme-light': !isDarkMode }"
        v-html="logContent"
      ></pre>
    </div>
  </div>
</template>

<style>
/* Define CSS variables for both light and dark themes */
:root {
  /* Light theme colors (default) - adjusted for better readability */
  --log-background: transparent;
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
  --log-background: transparent;
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

/* Add some basic styling for the highlighted logs */
.hljs {
  background: var(--log-background);
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
</style>
