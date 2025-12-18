import { computed, reactive, ref, watch } from 'vue';

export interface LogSession {
  id: string;
  containerName: string;
  label: string;
  autoFollow: boolean;
}

export function useDockerLogSessions() {
  const logSessions = ref<LogSession[]>([]);
  const activeLogSessionId = ref<string | null>(null);
  const logsModalOpen = ref(false);

  const activeLogSession = computed<LogSession | null>(() => {
    if (!logSessions.value.length) return null;
    const targetId = activeLogSessionId.value;
    if (targetId) {
      const found = logSessions.value.find((session) => session.id === targetId);
      if (found) return found;
    }
    return logSessions.value[0] ?? null;
  });

  function ensureLogSession(containerName: string, label: string) {
    let session = logSessions.value.find((entry) => entry.containerName === containerName);
    if (!session) {
      session = reactive<LogSession>({
        id: containerName,
        containerName,
        label,
        autoFollow: true,
      });
      logSessions.value = [...logSessions.value, session];
    } else {
      session.label = label;
    }
    return session;
  }

  function openLogsForContainers(entries: { containerName: string; label: string }[]) {
    const uniqueEntries = new Map<string, { containerName: string; label: string }>();
    entries.forEach((entry) => {
      if (!entry.containerName) return;
      uniqueEntries.set(entry.containerName, {
        containerName: entry.containerName,
        label: entry.label || entry.containerName,
      });
    });
    if (!uniqueEntries.size) return;
    let firstId: string | null = null;
    uniqueEntries.forEach((entry) => {
      const session = ensureLogSession(entry.containerName, entry.label);
      session.autoFollow = true;
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
    logSessions.value = logSessions.value.filter((session) => session.id !== sessionId);
  }

  function toggleActiveLogFollow(value: boolean) {
    const session = activeLogSession.value;
    if (!session) return;
    session.autoFollow = value;
  }

  watch(
    () => logSessions.value.map((session) => session.id),
    (ids) => {
      if (!ids.length) {
        activeLogSessionId.value = null;
        logsModalOpen.value = false;
        return;
      }
      if (!activeLogSessionId.value || !ids.includes(activeLogSessionId.value)) {
        activeLogSessionId.value = ids[0] ?? null;
      }
    }
  );

  return {
    logSessions,
    activeLogSessionId,
    activeLogSession,
    logsModalOpen,
    openLogsForContainers,
    removeLogSession,
    toggleActiveLogFollow,
    ensureLogSession,
  };
}
