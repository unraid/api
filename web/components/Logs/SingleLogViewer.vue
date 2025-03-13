<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { vInfiniteScroll } from '@vueuse/components';
import { ArrowPathIcon } from '@heroicons/vue/24/outline';
import { Button } from '@unraid/ui';
import DOMPurify from 'isomorphic-dompurify';

import type { LogFileContentQuery, LogFileContentQueryVariables } from '~/composables/gql/graphql';
import { GET_LOG_FILE_CONTENT } from './log.query';
import { LOG_FILE_SUBSCRIPTION } from './log.subscription';

const props = defineProps<{
  logFilePath: string;
  lineCount: number;
  autoScroll: boolean;
}>();

const DEFAULT_CHUNK_SIZE = 100;
const scrollViewportRef = ref<HTMLElement | null>(null);
const state = reactive({
  loadedContentChunks: [] as { content: string; startLine: number }[],
  currentStartLine: undefined as number | undefined,
  isLoadingMore: false,
  isAtTop: false,
  canLoadMore: false,
  initialLoadComplete: false
});

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
    observer.observe(scrollViewportRef.value, { childList: true, subtree: true });
  }

  if (props.logFilePath) {
    subscribeToMore({
      document: LOG_FILE_SUBSCRIPTION,
      variables: { path: props.logFilePath },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data || !prev) return prev;

        const existingContent = prev.logFile?.content || '';
        const newContent = subscriptionData.data.logFile.content;

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

      nextTick(() => state.canLoadMore = true);
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

// Computed properties
const logContent = computed(() => {
  return DOMPurify.sanitize(state.loadedContentChunks.map(chunk => chunk.content).join(''));
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
    <div class="flex justify-between px-4 py-2 bg-muted text-xs text-muted-foreground shrink-0">
      <span>Total lines: {{ totalLines }}</span>
      <span>{{ state.isAtTop ? 'Showing all available lines' : 'Scroll up to load more' }}</span>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" :disabled="loadingLogContent" @click="refreshLogContent">
          <ArrowPathIcon class="h-3 w-3 mr-1" aria-hidden="true" />
          <span>Refresh</span>
        </Button>
      </div>
    </div>

    <div v-if="loadingLogContent && !state.isLoadingMore" class="flex items-center justify-center flex-1 p-4 text-muted-foreground">
      Loading log content...
    </div>

    <div v-else-if="logContentError" class="flex items-center justify-center flex-1 p-4 text-destructive">
      Error loading log content: {{ logContentError.message }}
    </div>

    <div
      v-else
      ref="scrollViewportRef"
      v-infinite-scroll="[loadMoreContent, { direction: 'top', distance: 200, canLoadMore: () => shouldLoadMore }]"
      class="flex-1 overflow-y-auto max-h-[500px]"
    >
      <pre class="font-mono whitespace-pre-wrap p-4 m-0 text-xs leading-6" v-html="logContent"></pre>
    </div>
  </div>
</template>
