<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApolloClient, useQuery } from '@vue/apollo-composable';

import type { LogFileContentQuery, LogFileContentQueryVariables } from '~/composables/gql/graphql';

import BaseLogViewer from '~/components/Logs/BaseLogViewer.vue';
import { GET_LOG_FILE_CONTENT } from '~/components/Logs/log.query';
import { LOG_FILE_SUBSCRIPTION } from '~/components/Logs/log.subscription';

const { t } = useI18n();

const props = defineProps<{
  logFilePath: string;
  lineCount: number;
  autoScroll: boolean;
  highlightLanguage?: string; // Optional prop to specify the language for highlighting
  clientFilter?: string; // Optional client-side filter to apply to log content
}>();

const DEFAULT_CHUNK_SIZE = 100;
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

const baseLogViewerRef = ref<InstanceType<typeof BaseLogViewer> | null>(null);

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
        baseLogViewerRef.value?.forceScrollToBottom();
        setTimeout(() => (state.canLoadMore = true), 300);
      });
    } else {
      // Initial load - replace all content
      state.loadedContentChunks = [{ content, startLine: effectiveStartLine }];

      nextTick(() => {
        baseLogViewerRef.value?.forceScrollToBottom();
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
  return filteredContent.value;
});

const totalLines = computed(() => logContentResult.value?.logFile?.totalLines || 0);

// Load older log content
const loadMoreContent = async () => {
  if (state.isLoadingMore || state.isAtTop || !state.canLoadMore) return;

  state.isLoadingMore = true;
  state.canLoadMore = false;

  const firstChunk = state.loadedContentChunks[0];
  if (firstChunk) {
    const newStartLine = Math.max(1, firstChunk.startLine - DEFAULT_CHUNK_SIZE);
    state.currentStartLine = newStartLine;

    const prevScrollHeight = baseLogViewerRef.value?.scrollViewportRef?.scrollHeight || 0;

    await refetchLogContent();

    nextTick(() => {
      if (baseLogViewerRef.value?.scrollViewportRef) {
        baseLogViewerRef.value.scrollViewportRef.scrollTop +=
          baseLogViewerRef.value.scrollViewportRef.scrollHeight - prevScrollHeight;
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
            nextTick(() => baseLogViewerRef.value?.forceScrollToBottom());
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

watch(() => props.logFilePath, refreshLogContent, { immediate: true });
defineExpose({ refreshLogContent });
</script>

<template>
  <BaseLogViewer
    ref="baseLogViewerRef"
    :log-content="logContent"
    :loading="loadingLogContent"
    :error="logContentError?.message ?? null"
    :total-lines="totalLines"
    :auto-scroll="autoScroll"
    :highlight-language="highlightLanguage"
    :show-download="true"
    :show-refresh="true"
    :show-subscription-indicator="state.isSubscriptionActive"
    :loading-more-content="state.isLoadingMore"
    :is-at-top="state.isAtTop"
    :can-load-more="state.canLoadMore"
    @refresh="refreshLogContent"
    @download="downloadLogFile"
    @load-more="loadMoreContent"
  />
</template>
