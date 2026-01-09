import { ref } from 'vue';

import { ContainerState } from '@/composables/gql/graphql';

import type { TreeRow } from '@/composables/useTreeData';
import type { MutateFunction } from '@vue/apollo-composable';
import type { DocumentNode } from 'graphql';
import type { Ref } from 'vue';

type ContainerMutationFn = MutateFunction<unknown, { id: string }>;

export interface ContainerActionOptions<T = unknown> {
  getRowById: (id: string, rows: TreeRow<T>[]) => TreeRow<T> | undefined;
  treeData: Ref<TreeRow<T>[]>;
  setRowsBusy: (ids: string[], busy: boolean) => void;
  startMutation: ContainerMutationFn;
  stopMutation: ContainerMutationFn;
  pauseMutation: ContainerMutationFn;
  unpauseMutation: ContainerMutationFn;
  refetchQuery: { query: DocumentNode; variables: { skipCache: boolean } };
  onSuccess?: (message: string) => void;
  onWillStartContainers?: (entries: { id: string; containerId: string; name: string }[]) => void;
}

export function useContainerActions<T = unknown>(options: ContainerActionOptions<T>) {
  const {
    getRowById,
    treeData,
    setRowsBusy,
    startMutation,
    stopMutation,
    pauseMutation,
    unpauseMutation,
    refetchQuery,
    onSuccess,
    onWillStartContainers,
  } = options;

  const confirmStartStopOpen = ref(false);
  const confirmToStart = ref<{ name: string }[]>([]);
  const confirmToStop = ref<{ name: string }[]>([]);
  const pendingStartStopIds = ref<string[]>([]);

  const confirmPauseResumeOpen = ref(false);
  const confirmToPause = ref<{ name: string }[]>([]);
  const confirmToResume = ref<{ name: string }[]>([]);
  const pendingPauseResumeIds = ref<string[]>([]);

  function classifyStartStop(ids: string[]) {
    const toStart: { id: string; containerId: string; name: string }[] = [];
    const toStop: { id: string; containerId: string; name: string }[] = [];
    for (const id of ids) {
      const row = getRowById(id, treeData.value);
      if (!row || row.type !== 'container') continue;
      const containerId = (row as { containerId?: string }).containerId || row.id;
      const state = (row as { state?: string }).state;
      const name = row.name;
      if (state === ContainerState.RUNNING) toStop.push({ id, containerId, name });
      else toStart.push({ id, containerId, name });
    }
    return { toStart, toStop };
  }

  function classifyPauseResume(ids: string[]) {
    const toPause: { id: string; containerId: string; name: string }[] = [];
    const toResume: { id: string; containerId: string; name: string }[] = [];
    for (const id of ids) {
      const row = getRowById(id, treeData.value);
      if (!row || row.type !== 'container') continue;
      const containerId = (row as { containerId?: string }).containerId || row.id;
      const state = (row as { state?: string }).state;
      const name = row.name;
      if (state === ContainerState.PAUSED) toResume.push({ id, containerId, name });
      else if (state === ContainerState.RUNNING) toPause.push({ id, containerId, name });
    }
    return { toPause, toResume };
  }

  async function runStartStopBatch(
    toStart: { id: string; containerId: string; name: string }[],
    toStop: { id: string; containerId: string; name: string }[]
  ) {
    if (toStart.length) {
      onWillStartContainers?.(toStart);
    }
    const totalOps = toStop.length + toStart.length;
    let completed = 0;
    for (const item of toStop) {
      completed++;
      const isLast = completed === totalOps;
      await stopMutation(
        { id: item.containerId },
        isLast
          ? {
              refetchQueries: [refetchQuery],
              awaitRefetchQueries: true,
            }
          : { awaitRefetchQueries: false }
      );
    }
    for (const item of toStart) {
      completed++;
      const isLast = completed === totalOps;
      await startMutation(
        { id: item.containerId },
        isLast
          ? {
              refetchQueries: [refetchQuery],
              awaitRefetchQueries: true,
            }
          : { awaitRefetchQueries: false }
      );
    }
  }

  async function runPauseResumeBatch(
    toPause: { id: string; containerId: string; name: string }[],
    toResume: { id: string; containerId: string; name: string }[]
  ) {
    const totalOps = toPause.length + toResume.length;
    let completed = 0;
    for (const item of toPause) {
      completed++;
      const isLast = completed === totalOps;
      await pauseMutation(
        { id: item.containerId },
        isLast
          ? {
              refetchQueries: [refetchQuery],
              awaitRefetchQueries: true,
            }
          : { awaitRefetchQueries: false }
      );
    }
    for (const item of toResume) {
      completed++;
      const isLast = completed === totalOps;
      await unpauseMutation(
        { id: item.containerId },
        isLast
          ? {
              refetchQueries: [refetchQuery],
              awaitRefetchQueries: true,
            }
          : { awaitRefetchQueries: false }
      );
    }
  }

  async function handleRowStartStop(row: TreeRow<T>) {
    if (row.type !== 'container') return;
    const containerId = (row as { containerId?: string }).containerId || row.id;
    if (!containerId) return;
    setRowsBusy([row.id], true);
    const isRunning = (row as { state?: string }).state === ContainerState.RUNNING;
    const isStarting = !isRunning;
    try {
      const mutate = isRunning ? stopMutation : startMutation;
      if (isStarting) {
        onWillStartContainers?.([
          {
            id: row.id,
            containerId,
            name: row.name,
          },
        ]);
      }
      await mutate(
        { id: containerId },
        {
          refetchQueries: [refetchQuery],
          awaitRefetchQueries: true,
        }
      );
    } finally {
      setRowsBusy([row.id], false);
    }
  }

  async function handleRowPauseResume(row: TreeRow<T>) {
    if (row.type !== 'container') return;
    const containerId = (row as { containerId?: string }).containerId || row.id;
    if (!containerId) return;
    setRowsBusy([row.id], true);
    try {
      const isPaused = (row as { state?: string }).state === ContainerState.PAUSED;
      const mutate = isPaused ? unpauseMutation : pauseMutation;
      await mutate(
        { id: containerId },
        {
          refetchQueries: [refetchQuery],
          awaitRefetchQueries: true,
        }
      );
    } finally {
      setRowsBusy([row.id], false);
    }
  }

  function openStartStop(ids: string[]) {
    if (ids.length === 0) return;
    const { toStart, toStop } = classifyStartStop(ids);
    const isMixed = toStart.length > 0 && toStop.length > 0;
    if (isMixed) {
      pendingStartStopIds.value = ids;
      confirmToStart.value = toStart.map((i) => ({ name: i.name }));
      confirmToStop.value = toStop.map((i) => ({ name: i.name }));
      confirmStartStopOpen.value = true;
      return;
    }
    setRowsBusy(ids, true);
    runStartStopBatch(toStart, toStop)
      .then(() => onSuccess?.('Action completed'))
      .finally(() => {
        setRowsBusy(ids, false);
      });
  }

  async function confirmStartStop(close: () => void) {
    const { toStart, toStop } = classifyStartStop(pendingStartStopIds.value);
    setRowsBusy(pendingStartStopIds.value, true);
    try {
      await runStartStopBatch(toStart, toStop);
      onSuccess?.('Action completed');
    } finally {
      setRowsBusy(pendingStartStopIds.value, false);
      confirmStartStopOpen.value = false;
      pendingStartStopIds.value = [];
      close();
    }
  }

  function openPauseResume(ids: string[]) {
    if (ids.length === 0) return;
    const { toPause, toResume } = classifyPauseResume(ids);
    const isMixed = toPause.length > 0 && toResume.length > 0;
    if (isMixed) {
      pendingPauseResumeIds.value = ids;
      confirmToPause.value = toPause.map((i) => ({ name: i.name }));
      confirmToResume.value = toResume.map((i) => ({ name: i.name }));
      confirmPauseResumeOpen.value = true;
      return;
    }
    setRowsBusy(ids, true);
    runPauseResumeBatch(toPause, toResume)
      .then(() => onSuccess?.('Action completed'))
      .finally(() => {
        setRowsBusy(ids, false);
      });
  }

  async function confirmPauseResume(close: () => void) {
    const { toPause, toResume } = classifyPauseResume(pendingPauseResumeIds.value);
    setRowsBusy(pendingPauseResumeIds.value, true);
    try {
      await runPauseResumeBatch(toPause, toResume);
      onSuccess?.('Action completed');
    } finally {
      setRowsBusy(pendingPauseResumeIds.value, false);
      confirmPauseResumeOpen.value = false;
      pendingPauseResumeIds.value = [];
      close();
    }
  }

  return {
    // State
    confirmStartStopOpen,
    confirmToStart,
    confirmToStop,
    confirmPauseResumeOpen,
    confirmToPause,
    confirmToResume,

    // Actions
    handleRowStartStop,
    handleRowPauseResume,
    openStartStop,
    confirmStartStop,
    openPauseResume,
    confirmPauseResume,
  };
}
