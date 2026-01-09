import { computed, reactive, ref } from 'vue';
import { useSubscription } from '@vue/apollo-composable';

import { DOCKER_UPDATE_PROGRESS_SUBSCRIPTION } from '@/components/Docker/docker-update-progress.subscription';

import type {
  DockerLayerProgress,
  DockerUpdateEventType,
  DockerUpdateProgress,
} from '@/composables/gql/graphql';

export interface ContainerUpdateState {
  containerId: string;
  containerName: string;
  status: 'pending' | 'in_progress' | 'complete' | 'error';
  overallProgress: number;
  message: string;
  error?: string;
  layers: Map<string, DockerLayerProgress>;
  events: DockerUpdateProgress[];
}

export function useDockerUpdateProgress() {
  const containerUpdates = reactive(new Map<string, ContainerUpdateState>());
  const isModalOpen = ref(false);
  const activeContainerId = ref<string | null>(null);

  const { onResult: onProgressResult, onError: onProgressError } = useSubscription(
    DOCKER_UPDATE_PROGRESS_SUBSCRIPTION,
    null,
    () => ({
      fetchPolicy: 'network-only',
    })
  );

  onProgressResult((result) => {
    const progress = result.data?.dockerUpdateProgress as DockerUpdateProgress | undefined;
    if (!progress || !progress.containerId) return;

    const { containerId, containerName, type, message, overallProgress, error, layers } = progress;

    let state = containerUpdates.get(containerId);
    if (!state) {
      state = {
        containerId,
        containerName,
        status: 'pending',
        overallProgress: 0,
        message: '',
        layers: new Map(),
        events: [],
      };
      containerUpdates.set(containerId, state);
    }

    state.events.push(progress);

    if (message) {
      state.message = message;
    }

    if (overallProgress !== undefined && overallProgress !== null) {
      state.overallProgress = overallProgress;
    }

    if (layers) {
      for (const layer of layers) {
        state.layers.set(layer.layerId, layer);
      }
    }

    const eventType = type as DockerUpdateEventType;
    switch (eventType) {
      case 'STARTED':
        state.status = 'in_progress';
        break;
      case 'COMPLETE':
        state.status = 'complete';
        state.overallProgress = 100;
        break;
      case 'ERROR':
        state.status = 'error';
        state.error = error ?? 'Unknown error';
        break;
    }
  });

  onProgressError((err) => {
    console.error('Docker update progress subscription error:', err);
  });

  function startTracking(containerId: string, containerName: string) {
    const state: ContainerUpdateState = {
      containerId,
      containerName,
      status: 'pending',
      overallProgress: 0,
      message: `Preparing to update ${containerName}...`,
      layers: new Map(),
      events: [],
    };
    containerUpdates.set(containerId, state);
    activeContainerId.value = containerId;
    isModalOpen.value = true;
  }

  function stopTracking(containerId: string) {
    containerUpdates.delete(containerId);
    if (activeContainerId.value === containerId) {
      const remaining = Array.from(containerUpdates.keys());
      activeContainerId.value = remaining.length > 0 ? remaining[0] : null;
      if (!activeContainerId.value) {
        isModalOpen.value = false;
      }
    }
  }

  function clearCompleted() {
    for (const [id, state] of containerUpdates.entries()) {
      if (state.status === 'complete' || state.status === 'error') {
        containerUpdates.delete(id);
      }
    }
    if (activeContainerId.value && !containerUpdates.has(activeContainerId.value)) {
      const remaining = Array.from(containerUpdates.keys());
      activeContainerId.value = remaining.length > 0 ? remaining[0] : null;
    }
    if (containerUpdates.size === 0) {
      isModalOpen.value = false;
    }
  }

  function closeModal() {
    isModalOpen.value = false;
  }

  function openModal(containerId?: string) {
    if (containerId && containerUpdates.has(containerId)) {
      activeContainerId.value = containerId;
    }
    isModalOpen.value = true;
  }

  function setActiveContainer(containerId: string) {
    if (containerUpdates.has(containerId)) {
      activeContainerId.value = containerId;
    }
  }

  const activeContainerState = computed(() => {
    if (!activeContainerId.value) return null;
    return containerUpdates.get(activeContainerId.value) ?? null;
  });

  const hasActiveUpdates = computed(() => {
    return Array.from(containerUpdates.values()).some(
      (s) => s.status === 'pending' || s.status === 'in_progress'
    );
  });

  const updateCount = computed(() => containerUpdates.size);

  const allContainerStates = computed(() => Array.from(containerUpdates.values()));

  return {
    containerUpdates,
    isModalOpen,
    activeContainerId,
    activeContainerState,
    hasActiveUpdates,
    updateCount,
    allContainerStates,
    startTracking,
    stopTracking,
    clearCompleted,
    closeModal,
    openModal,
    setActiveContainer,
  };
}
