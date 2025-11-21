import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useApolloClient } from '@vue/apollo-composable';

import { GET_DOCKER_CONTAINER_LOGS } from '@/components/Docker/docker-logs.query';

import type {
  GetDockerContainerLogsQuery,
  GetDockerContainerLogsQueryVariables,
} from '@/composables/gql/graphql';

export interface LogSessionLine {
  timestamp: string;
  message: string;
}

export interface LogSession {
  id: string;
  label: string;
  lines: LogSessionLine[];
  cursor: string | null;
  isLoading: boolean;
  error: string | null;
  autoFollow: boolean;
}

const LOG_POLL_INTERVAL_MS = 2000;
const DEFAULT_LOG_TAIL = 200;
const MAX_LOG_LINES = 500;

export function useDockerLogSessions() {
  const { client: apolloClient } = useApolloClient();

  const logSessions = ref<LogSession[]>([]);
  const activeLogSessionId = ref<string | null>(null);
  const logsModalOpen = ref(false);
  const logSessionLineKeys = new Map<string, Set<string>>();
  let logsPollTimer: ReturnType<typeof setInterval> | null = null;

  const activeLogSession = computed<LogSession | null>(() => {
    if (!logSessions.value.length) return null;
    const targetId = activeLogSessionId.value;
    if (targetId) {
      const found = logSessions.value.find((session) => session.id === targetId);
      if (found) return found;
    }
    return logSessions.value[0] ?? null;
  });

  function normalizeGraphqlError(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object') {
      const maybeMessage = (error as { message?: unknown }).message;
      if (typeof maybeMessage === 'string') {
        return maybeMessage;
      }
      const graphQLErrors = (error as { graphQLErrors?: Array<{ message?: unknown }> }).graphQLErrors;
      if (Array.isArray(graphQLErrors) && graphQLErrors.length) {
        const graphMessage = graphQLErrors[0]?.message;
        if (typeof graphMessage === 'string') {
          return graphMessage;
        }
      }
    }
    return 'Unable to fetch container logs.';
  }

  function appendLogLines(session: LogSession, lines: LogSessionLine[]) {
    if (!lines.length) return;
    const keySet = logSessionLineKeys.get(session.id) ?? new Set<string>();
    logSessionLineKeys.set(session.id, keySet);
    const nextLines: LogSessionLine[] = [];
    for (const line of lines) {
      const key = `${line.timestamp}|${line.message}`;
      if (keySet.has(key)) continue;
      keySet.add(key);
      nextLines.push(line);
    }
    if (!nextLines.length) return;
    session.lines = [...session.lines, ...nextLines];
    if (session.lines.length > MAX_LOG_LINES) {
      session.lines = session.lines.slice(session.lines.length - MAX_LOG_LINES);
    }
  }

  async function fetchLogsForSession(session: LogSession, options?: { force?: boolean }) {
    if (session.isLoading && !options?.force) return;
    const clientInstance = apolloClient;
    if (!clientInstance) return;
    session.isLoading = true;
    session.error = null;
    const variables: GetDockerContainerLogsQueryVariables = {
      id: session.id,
    };
    if (session.cursor) {
      variables.since = session.cursor;
    } else {
      variables.tail = DEFAULT_LOG_TAIL;
    }

    try {
      const { data } = await clientInstance.query<
        GetDockerContainerLogsQuery,
        GetDockerContainerLogsQueryVariables
      >({
        query: GET_DOCKER_CONTAINER_LOGS,
        variables,
        fetchPolicy: 'network-only',
      });
      const payload = data?.docker?.logs;
      if (payload?.lines?.length) {
        const normalized = payload.lines
          .filter((line): line is NonNullable<typeof line> => Boolean(line))
          .map((line: { timestamp: string; message: string }) => ({
            timestamp: line.timestamp ?? new Date().toISOString(),
            message: line.message ?? '',
          }));
        appendLogLines(session, normalized);
      }
      if (payload?.cursor) {
        session.cursor = payload.cursor;
      }
    } catch (error) {
      session.error = normalizeGraphqlError(error);
    } finally {
      session.isLoading = false;
    }
  }

  function ensureLogSession(containerId: string, label: string, options?: { reset?: boolean }) {
    let session = logSessions.value.find((entry) => entry.id === containerId);
    if (!session) {
      session = reactive<LogSession>({
        id: containerId,
        label,
        lines: [],
        cursor: null,
        isLoading: false,
        error: null,
        autoFollow: true,
      });
      logSessions.value = [...logSessions.value, session];
    } else {
      session.label = label;
    }

    if (options?.reset) {
      session.lines = [];
      session.cursor = null;
      session.error = null;
      logSessionLineKeys.set(containerId, new Set());
    }

    if (!logSessionLineKeys.has(containerId)) {
      logSessionLineKeys.set(containerId, new Set());
    }

    return session;
  }

  function startLogPoller() {
    if (logsPollTimer || !logSessions.value.length) return;
    logsPollTimer = setInterval(() => {
      if (!logsModalOpen.value) return;
      for (const session of logSessions.value) {
        if (!session.autoFollow) continue;
        void fetchLogsForSession(session);
      }
    }, LOG_POLL_INTERVAL_MS);
  }

  function stopLogPoller() {
    if (!logsPollTimer) return;
    clearInterval(logsPollTimer);
    logsPollTimer = null;
  }

  function openLogsForContainers(
    entries: { id: string; label: string }[],
    options?: { reset?: boolean }
  ) {
    const uniqueEntries = new Map<string, { id: string; label: string }>();
    entries.forEach((entry) => {
      if (!entry.id) return;
      uniqueEntries.set(entry.id, {
        id: entry.id,
        label: entry.label || entry.id,
      });
    });
    if (!uniqueEntries.size) return;
    let firstId: string | null = null;
    uniqueEntries.forEach((entry) => {
      const session = ensureLogSession(entry.id, entry.label, { reset: options?.reset });
      session.autoFollow = true;
      session.error = null;
      void fetchLogsForSession(session, { force: true });
      if (!firstId) {
        firstId = session.id;
      }
    });
    if (firstId) {
      activeLogSessionId.value = firstId;
    }
    logsModalOpen.value = true;
  }

  function removeLogSession(sessionId?: string | null) {
    if (!sessionId) return;
    logSessionLineKeys.delete(sessionId);
    logSessions.value = logSessions.value.filter((session) => session.id !== sessionId);
  }

  function handleLogsRefresh() {
    const session = activeLogSession.value;
    if (!session) return;
    void fetchLogsForSession(session, { force: true });
  }

  function toggleActiveLogFollow(value: boolean) {
    const session = activeLogSession.value;
    if (!session) return;
    session.autoFollow = value;
    if (value) {
      void fetchLogsForSession(session, { force: true });
    }
  }

  watch(
    () => logSessions.value.map((session) => session.id),
    (ids) => {
      if (!ids.length) {
        activeLogSessionId.value = null;
        logsModalOpen.value = false;
        stopLogPoller();
        return;
      }
      if (!activeLogSessionId.value || !ids.includes(activeLogSessionId.value)) {
        activeLogSessionId.value = ids[0] ?? null;
      }
    }
  );

  watch(
    () => logsModalOpen.value,
    (open) => {
      if (open && logSessions.value.length) {
        startLogPoller();
      } else if (!open) {
        stopLogPoller();
      }
    }
  );

  onBeforeUnmount(() => {
    stopLogPoller();
  });

  return {
    logSessions,
    activeLogSessionId,
    activeLogSession,
    logsModalOpen,
    openLogsForContainers,
    removeLogSession,
    handleLogsRefresh,
    toggleActiveLogFollow,
    ensureLogSession, // Exposed in case manual updates are needed (e.g. label updates)
  };
}
