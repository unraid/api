<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';

import { GET_DOCKER_CONTAINER_LOGS } from '@/components/Docker/docker-logs.query';

import type {
  GetDockerContainerLogsQuery,
  GetDockerContainerLogsQueryVariables,
} from '@/composables/gql/graphql';

import BaseLogViewer from '~/components/Logs/BaseLogViewer.vue';

const props = withDefaults(
  defineProps<{
    containerName: string;
    autoScroll: boolean;
    clientFilter?: string;
  }>(),
  {
    clientFilter: '',
  }
);

const DEFAULT_TAIL = 200;
const MAX_LOG_LINES = 500;
const POLL_INTERVAL_MS = 2000;

const state = reactive({
  lines: [] as Array<{ timestamp: string; message: string }>,
  cursor: null as string | null,
  isRefreshing: false,
  lineKeys: new Set<string>(),
});

let pollTimer: ReturnType<typeof setInterval> | null = null;

const {
  result: logResult,
  loading: loadingLogs,
  error: logError,
  refetch: refetchLogs,
} = useQuery<GetDockerContainerLogsQuery, GetDockerContainerLogsQueryVariables>(
  GET_DOCKER_CONTAINER_LOGS,
  () => ({
    id: props.containerName,
    since: state.cursor,
    tail: state.cursor ? null : DEFAULT_TAIL,
  }),
  () => ({
    enabled: !!props.containerName,
    fetchPolicy: 'network-only',
  })
);

function appendLogLines(newLines: Array<{ timestamp: string; message: string }>) {
  if (!newLines.length) return;

  const added: Array<{ timestamp: string; message: string }> = [];
  for (const line of newLines) {
    const key = `${line.timestamp}|${line.message}`;
    if (state.lineKeys.has(key)) continue;
    state.lineKeys.add(key);
    added.push(line);
  }

  if (!added.length) return;

  state.lines = [...state.lines, ...added];
  if (state.lines.length > MAX_LOG_LINES) {
    const removed = state.lines.slice(0, state.lines.length - MAX_LOG_LINES);
    for (const line of removed) {
      state.lineKeys.delete(`${line.timestamp}|${line.message}`);
    }
    state.lines = state.lines.slice(state.lines.length - MAX_LOG_LINES);
  }
}

watch(
  logResult,
  (result) => {
    if (!result?.docker?.logs) return;

    const payload = result.docker.logs;
    if (payload.lines?.length) {
      const normalized = payload.lines
        .filter((line): line is NonNullable<typeof line> => Boolean(line))
        .map((line) => ({
          timestamp: line.timestamp ?? new Date().toISOString(),
          message: line.message ?? '',
        }));

      if (state.isRefreshing) {
        state.lines = normalized;
        state.lineKeys.clear();
        normalized.forEach((line) => {
          const key = `${line.timestamp}|${line.message}`;
          state.lineKeys.add(key);
        });
        state.isRefreshing = false;
      } else {
        appendLogLines(normalized);
      }
    }

    if (payload.cursor) {
      state.cursor = payload.cursor;
    }
  },
  { deep: true }
);

const logContent = computed(() => {
  let linesToDisplay = state.lines;

  if (props.clientFilter && props.clientFilter.trim()) {
    const filterLower = props.clientFilter.toLowerCase();
    linesToDisplay = state.lines.filter(
      (line) =>
        line.message.toLowerCase().includes(filterLower) ||
        line.timestamp.toLowerCase().includes(filterLower)
    );
  }

  const lines = linesToDisplay.map((line) => {
    const date = new Date(line.timestamp);
    const time = !Number.isNaN(date.getTime())
      ? date.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : line.timestamp;
    return `[${time}] ${line.message}`;
  });
  return lines.join('\n');
});

const filteredLineCount = computed(() => {
  if (!props.clientFilter || !props.clientFilter.trim()) {
    return state.lines.length;
  }
  const filterLower = props.clientFilter.toLowerCase();
  return state.lines.filter(
    (line) =>
      line.message.toLowerCase().includes(filterLower) ||
      line.timestamp.toLowerCase().includes(filterLower)
  ).length;
});

const refreshLogContent = async () => {
  state.isRefreshing = true;
  state.cursor = null;
  state.lines = [];
  state.lineKeys.clear();
  await refetchLogs();
};

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    if (props.autoScroll) {
      void refetchLogs();
    }
  }, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

watch(
  () => props.containerName,
  async () => {
    stopPolling();
    await refreshLogContent();
    startPolling();
  }
);

onMounted(() => {
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});

defineExpose({ refreshLogContent });
</script>

<template>
  <BaseLogViewer
    :log-content="logContent"
    :loading="loadingLogs"
    :error="logError?.message ?? null"
    :total-lines="filteredLineCount"
    :auto-scroll="autoScroll"
    :show-refresh="true"
    :show-download="false"
    @refresh="refreshLogContent"
  />
</template>
