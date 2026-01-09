import { computed, ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';

import { GET_DOCKER_CONTAINERS } from '@/components/Docker/docker-containers.query';
import { REFRESH_DOCKER_DIGESTS } from '@/components/Docker/docker-refresh-digests.mutation';
import { UPDATE_ALL_DOCKER_CONTAINERS } from '@/components/Docker/docker-update-all-containers.mutation';
import { UPDATE_DOCKER_CONTAINERS } from '@/components/Docker/docker-update-containers.mutation';

import type { DockerContainer } from '@/composables/gql/graphql';
import type { TreeRow } from '@/composables/useTreeData';

interface UpdateActionsOptions {
  setRowsBusy: (ids: string[], busy: boolean) => void;
  showToast: (message: string) => void;
  showError: (message: string, options?: { description?: string }) => void;
  getRowById: (id: string) => TreeRow<DockerContainer> | undefined;
}

export function useDockerUpdateActions({
  setRowsBusy,
  showToast,
  showError,
  getRowById,
}: UpdateActionsOptions) {
  const updatingRowIds = ref<Set<string>>(new Set());

  const isUpdatingContainers = computed(() => updatingRowIds.value.size > 0);

  const activeUpdateSummary = computed(() => {
    if (!updatingRowIds.value.size) return '';
    const names: string[] = [];
    for (const id of updatingRowIds.value) {
      const row = getRowById(id);
      if (row && row.type === 'container') {
        names.push(row.name);
      }
    }
    if (!names.length) return '';
    if (names.length <= 3) return names.join(', ');
    const summary = names.slice(0, 3).join(', ');
    return `${summary}, +${names.length - 3} more`;
  });

  const { mutate: updateContainersMutation } = useMutation(UPDATE_DOCKER_CONTAINERS);
  const { mutate: updateAllContainersMutation, loading: updatingAllContainers } = useMutation(
    UPDATE_ALL_DOCKER_CONTAINERS
  );
  const { mutate: refreshDockerDigestsMutation, loading: checkingForUpdates } =
    useMutation(REFRESH_DOCKER_DIGESTS);

  function setRowsUpdating(rows: TreeRow<DockerContainer>[], updating: boolean) {
    if (!rows.length) return;
    const next = new Set(updatingRowIds.value);
    for (const row of rows) {
      if (!row.id) continue;
      if (updating) next.add(row.id);
      else next.delete(row.id);
    }
    updatingRowIds.value = next;
  }

  // NOTE: Although this function accepts specific rows (e.g., a single container from a context menu),
  // the backend mutation refreshes digests for ALL containers. This matches the webgui behavior where
  // checking for updates always refreshes the entire container list. Scoping to specific containers
  // on the backend is left for a future enhancement.
  async function handleCheckForUpdates(rows: TreeRow<DockerContainer>[]) {
    if (!rows.length) return;

    const entryIds = Array.from(new Set(rows.map((row) => row.id)));
    setRowsBusy(entryIds, true);

    try {
      await refreshDockerDigestsMutation(
        {},
        {
          refetchQueries: [{ query: GET_DOCKER_CONTAINERS, variables: { skipCache: true } }],
          awaitRefetchQueries: true,
        }
      );
      const count = rows.length;
      showToast(`Checked updates for ${count} container${count === 1 ? '' : 's'}`);
    } catch (error) {
      showError('Failed to check for updates', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setRowsBusy(entryIds, false);
    }
  }

  async function handleUpdateContainer(row: TreeRow<DockerContainer>) {
    if (!row.containerId) return;

    setRowsUpdating([row], true);
    setRowsBusy([row.id], true);

    try {
      await updateContainersMutation(
        { ids: [row.containerId] },
        {
          refetchQueries: [{ query: GET_DOCKER_CONTAINERS, variables: { skipCache: true } }],
          awaitRefetchQueries: true,
        }
      );
      showToast(`Successfully updated ${row.name}`);
    } catch (error) {
      showError(`Failed to update ${row.name}`, {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setRowsBusy([row.id], false);
      setRowsUpdating([row], false);
    }
  }

  async function handleBulkUpdateContainers(rows: TreeRow<DockerContainer>[]) {
    if (!rows.length) return;

    const containerIds = Array.from(
      new Set(rows.map((row) => row.containerId).filter((id): id is string => Boolean(id)))
    );
    if (!containerIds.length) return;

    const entryIds = Array.from(new Set(rows.map((row) => row.id)));
    setRowsUpdating(rows, true);
    setRowsBusy(entryIds, true);

    try {
      await updateContainersMutation(
        { ids: containerIds },
        {
          refetchQueries: [{ query: GET_DOCKER_CONTAINERS, variables: { skipCache: true } }],
          awaitRefetchQueries: true,
        }
      );
      const count = containerIds.length;
      showToast(`Successfully updated ${count} container${count === 1 ? '' : 's'}`);
    } catch (error) {
      showError('Failed to update containers', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setRowsBusy(entryIds, false);
      setRowsUpdating(rows, false);
    }
  }

  async function handleUpdateAllContainers(candidateRows: TreeRow<DockerContainer>[]) {
    const rows = candidateRows;
    const entryIds = Array.from(new Set(rows.map((row) => row.id)));
    if (rows.length) {
      setRowsUpdating(rows, true);
      setRowsBusy(entryIds, true);
    }

    try {
      const response = await updateAllContainersMutation(
        {},
        {
          refetchQueries: [{ query: GET_DOCKER_CONTAINERS, variables: { skipCache: true } }],
          awaitRefetchQueries: true,
        }
      );
      const count = response?.data?.docker?.updateAllContainers?.length ?? 0;
      if (count > 0) {
        showToast(`Successfully updated ${count} container${count === 1 ? '' : 's'}`);
      } else {
        showToast('No containers had updates available');
      }
    } catch (error) {
      showError('Failed to update containers', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      if (rows.length) {
        setRowsBusy(entryIds, false);
        setRowsUpdating(rows, false);
      }
    }
  }

  return {
    updatingRowIds,
    isUpdatingContainers,
    activeUpdateSummary,
    checkingForUpdates,
    updatingAllContainers,
    handleCheckForUpdates,
    handleUpdateContainer,
    handleBulkUpdateContainers,
    handleUpdateAllContainers,
  };
}
