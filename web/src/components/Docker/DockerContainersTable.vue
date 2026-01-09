<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useApolloClient, useMutation } from '@vue/apollo-composable';
import { useStorage } from '@vueuse/core';

import BaseTreeTable from '@/components/Common/BaseTreeTable.vue';
import ConfirmActionsModal from '@/components/Common/ConfirmActionsModal.vue';
import MoveToFolderModal from '@/components/Common/MoveToFolderModal.vue';
import TableColumnMenu from '@/components/Common/TableColumnMenu.vue';
import { GET_DOCKER_CONTAINERS } from '@/components/Docker/docker-containers.query';
import { CREATE_DOCKER_FOLDER_WITH_ITEMS } from '@/components/Docker/docker-create-folder-with-items.mutation';
import { CREATE_DOCKER_FOLDER } from '@/components/Docker/docker-create-folder.mutation';
import { DELETE_DOCKER_ENTRIES } from '@/components/Docker/docker-delete-entries.mutation';
import { MOVE_DOCKER_ENTRIES_TO_FOLDER } from '@/components/Docker/docker-move-entries.mutation';
import { MOVE_DOCKER_ITEMS_TO_POSITION } from '@/components/Docker/docker-move-items-to-position.mutation';
import { PAUSE_DOCKER_CONTAINER } from '@/components/Docker/docker-pause-container.mutation';
import { REMOVE_DOCKER_CONTAINER } from '@/components/Docker/docker-remove-container.mutation';
import { SET_DOCKER_FOLDER_CHILDREN } from '@/components/Docker/docker-set-folder-children.mutation';
import { START_DOCKER_CONTAINER } from '@/components/Docker/docker-start-container.mutation';
import { STOP_DOCKER_CONTAINER } from '@/components/Docker/docker-stop-container.mutation';
import { GET_CONTAINER_TAILSCALE_STATUS } from '@/components/Docker/docker-tailscale-status.query';
import { UNPAUSE_DOCKER_CONTAINER } from '@/components/Docker/docker-unpause-container.mutation';
import DockerLogViewerModal from '@/components/Docker/DockerLogViewerModal.vue';
import RemoveContainerModal from '@/components/Docker/RemoveContainerModal.vue';
import { useContainerActions } from '@/composables/useContainerActions';
import { useContextMenu } from '@/composables/useContextMenu';
import { useDockerBulkActions } from '@/composables/useDockerBulkActions';
import { useDockerViewPreferences } from '@/composables/useDockerColumnVisibility';
import { useDockerConsoleSessions } from '@/composables/useDockerConsoleSessions';
import { useDockerContainerStats } from '@/composables/useDockerContainerStats';
import { useDockerLogSessions } from '@/composables/useDockerLogSessions';
import { useDockerRowActions } from '@/composables/useDockerRowActions';
import {
  DOCKER_SEARCHABLE_KEYS,
  getDefaultColumnVisibility,
  useDockerTableColumns,
} from '@/composables/useDockerTableColumns';
import { useDockerUpdateActions } from '@/composables/useDockerUpdateActions';
import { useEntryReordering } from '@/composables/useEntryReordering';
import { useFolderOperations } from '@/composables/useFolderOperations';
import { useFolderTree } from '@/composables/useFolderTree';
import { usePersistentColumnVisibility } from '@/composables/usePersistentColumnVisibility';
import { getSelectableDescendants } from '@/composables/useRowSelection';
import { useTreeData } from '@/composables/useTreeData';
import { getRowDisplayLabel, stripLeadingSlash, toContainerTreeRow } from '@/utils/docker';

import type {
  DockerContainer,
  FlatOrganizerEntry,
  GetContainerTailscaleStatusQuery,
} from '@/composables/gql/graphql';
import type { DropArea, DropEvent } from '@/composables/useDragDrop';
import type { ColumnVisibilityTableInstance } from '@/composables/usePersistentColumnVisibility';
import type { TreeRow } from '@/composables/useTreeData';

interface Props {
  containers: DockerContainer[];
  flatEntries?: FlatOrganizerEntry[];
  rootFolderId?: string;
  loading?: boolean;
  compact?: boolean;
  activeId?: string | null;
  selectedIds?: string[];
  viewPrefs?: Record<string, unknown> | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  compact: false,
  activeId: null,
  selectedIds: () => [],
  rootFolderId: 'root',
});

const emit = defineEmits<{
  (e: 'created-folder'): void;
  (
    e: 'row:click',
    payload: {
      id: string;
      type: 'container' | 'folder';
      name: string;
      containerId?: string;
      tab?: 'overview' | 'settings' | 'logs' | 'console';
    }
  ): void;
  (
    e: 'row:select',
    payload: {
      id: string;
      type: 'container' | 'folder';
      name: string;
      containerId?: string;
      selected: boolean;
    }
  ): void;
  (e: 'update:selectedIds', value: string[]): void;
}>();

// Refs
const flatEntriesRef = computed(() => props.flatEntries);
const containersRef = computed(() => props.containers);
const rootFolderId = computed<string>(() => props.rootFolderId || 'root');
const compactRef = computed(() => props.compact);
const selectedIdsRef = computed(() => props.selectedIds);
const hasFlatEntries = computed(() => !!props.flatEntries);

const baseTableRef = ref<
  (ColumnVisibilityTableInstance & { toggleExpanded?: (id: string) => void }) | null
>(null);
const busyRowIds = ref<Set<string>>(new Set());
const columnSizing = useStorage<Record<string, number>>('docker-table-column-sizing', {});
const columnOrder = useStorage<string[]>('docker-table-column-order', []);

// Remove container modal state
const removeContainerModalOpen = ref(false);
const containerToRemove = ref<TreeRow<DockerContainer> | null>(null);

// Composables
const { containerStats } = useDockerContainerStats();
const logs = useDockerLogSessions();
const consoleSessions = useDockerConsoleSessions();
const contextMenu = useContextMenu<DockerContainer>();
const { client: apolloClient } = useApolloClient();
const { mergeServerPreferences, saveColumnVisibility, columnVisibilityRef } = useDockerViewPreferences();

const {
  treeData,
  entryParentById,
  folderChildrenIds,
  parentById,
  positionById,
  getRowById,
  flattenRows,
} = useTreeData<DockerContainer>({
  flatEntries: flatEntriesRef,
  flatData: containersRef,
  buildFlatRow: toContainerTreeRow,
});

const { visibleFolders, expandedFolders, toggleExpandFolder, setExpandedFolders } = useFolderTree({
  flatEntries: flatEntriesRef,
});

// Mutations
const { mutate: createFolderMutation, loading: creating } = useMutation(CREATE_DOCKER_FOLDER);
const { mutate: createFolderWithItemsMutation } = useMutation(CREATE_DOCKER_FOLDER_WITH_ITEMS);
const { mutate: moveEntriesMutation, loading: moving } = useMutation(MOVE_DOCKER_ENTRIES_TO_FOLDER);
const { mutate: moveItemsToPositionMutation } = useMutation(MOVE_DOCKER_ITEMS_TO_POSITION);
const { mutate: deleteEntriesMutation, loading: deleting } = useMutation(DELETE_DOCKER_ENTRIES);
const { mutate: setFolderChildrenMutation } = useMutation(SET_DOCKER_FOLDER_CHILDREN);
const { mutate: startContainerMutation } = useMutation(START_DOCKER_CONTAINER);
const { mutate: stopContainerMutation } = useMutation(STOP_DOCKER_CONTAINER);
const { mutate: pauseContainerMutation } = useMutation(PAUSE_DOCKER_CONTAINER);
const { mutate: unpauseContainerMutation } = useMutation(UNPAUSE_DOCKER_CONTAINER);
const { mutate: removeContainerMutation, loading: removingContainer } =
  useMutation(REMOVE_DOCKER_CONTAINER);

// Helpers

function showToast(message: string) {
  window.toast?.success(message);
}

function showError(message: string, options?: { description?: string }) {
  window.toast?.error?.(message, options);
}

function setRowsBusy(ids: string[], busy: boolean) {
  const next = new Set(busyRowIds.value);
  for (const id of ids) {
    if (busy) next.add(id);
    else next.delete(id);
  }
  busyRowIds.value = next;
}

function getContainerRows(ids: string[]): TreeRow<DockerContainer>[] {
  const rows: TreeRow<DockerContainer>[] = [];
  for (const id of ids) {
    const row = getRowById(id, treeData.value);
    if (row && row.type === 'container') {
      rows.push(row as TreeRow<DockerContainer>);
    }
  }
  return rows;
}

// Update actions
const {
  updatingRowIds,
  isUpdatingContainers,
  activeUpdateSummary,
  checkingForUpdates,
  updatingAllContainers,
  handleCheckForUpdates,
  handleUpdateContainer,
  handleBulkUpdateContainers,
  handleUpdateAllContainers,
} = useDockerUpdateActions({
  setRowsBusy,
  showToast,
  showError,
  getRowById: (id) => getRowById(id, treeData.value),
});

// Container actions
const containerActions = useContainerActions({
  getRowById,
  treeData,
  setRowsBusy,
  startMutation: startContainerMutation,
  stopMutation: stopContainerMutation,
  pauseMutation: pauseContainerMutation,
  unpauseMutation: unpauseContainerMutation,
  refetchQuery: { query: GET_DOCKER_CONTAINERS, variables: { skipCache: true } },
  onSuccess: showToast,
  onWillStartContainers: handleContainersWillStart,
});

// Folder operations
const refetchQuery = { query: GET_DOCKER_CONTAINERS, variables: { skipCache: true } };
const folderOps = reactive(
  useFolderOperations({
    rootFolderId,
    folderChildrenIds,
    parentById,
    visibleFolders,
    expandedFolders,
    setExpandedFolders,
    createFolderMutation,
    deleteFolderMutation: deleteEntriesMutation,
    setFolderChildrenMutation,
    moveEntriesMutation,
    refetchQuery,
    onSuccess: showToast,
  })
);

// Entry reordering
const entryReordering = useEntryReordering({
  rootFolderId,
  entryParentById,
  folderChildrenIds,
  treeData,
  getRowById,
  onMove: ({ rowId, parentId, position }) =>
    moveItemsToPositionMutation(
      { sourceEntryIds: [rowId], destinationFolderId: parentId, position },
      { refetchQueries: [refetchQuery], awaitRefetchQueries: true }
    ),
});

// Derived data
const allContainerRows = computed<TreeRow<DockerContainer>[]>(() => {
  return flattenRows(treeData.value, 'container') as TreeRow<DockerContainer>[];
});

const updateCandidateRows = computed<TreeRow<DockerContainer>[]>(() =>
  allContainerRows.value.filter((row) => Boolean(row.meta?.isUpdateAvailable))
);

// Row actions
async function handleVisitTailscale(containerId: string) {
  try {
    const { data } = await apolloClient.query<GetContainerTailscaleStatusQuery>({
      query: GET_CONTAINER_TAILSCALE_STATUS,
      variables: { id: containerId },
      fetchPolicy: 'network-only',
    });
    const webUiUrl = data?.docker?.container?.tailscaleStatus?.webUiUrl;
    if (webUiUrl) {
      window.open(webUiUrl, '_blank');
    } else {
      showError('Tailscale WebUI not available', {
        description: 'The container may need to authenticate with Tailscale first.',
      });
    }
  } catch {
    showError('Failed to fetch Tailscale status');
  }
}

function handleSelectAllChildren(row: TreeRow<DockerContainer>) {
  const canSelect = (r: TreeRow<DockerContainer>) => r.type === 'container';
  const descendants = getSelectableDescendants(row, canSelect);
  if (descendants.length === 0) return;

  const descendantIds = descendants.map((d) => d.id);
  const currentSelected = new Set(props.selectedIds);
  for (const id of descendantIds) {
    currentSelected.add(id);
  }
  emit('update:selectedIds', Array.from(currentSelected));
}

function handleViewLogs(row: TreeRow<DockerContainer>) {
  const containerName = row.name;
  if (!containerName) return;
  logs.openLogsForContainers([{ containerName, label: getRowDisplayLabel(row, row.name) }]);
}

function handleOpenConsole(row: TreeRow<DockerContainer>) {
  const container = row.meta as DockerContainer | undefined;
  emit('row:click', {
    id: row.id,
    type: 'container',
    name: row.name,
    containerId: container?.id,
    tab: 'console',
  });
}

function handleManageSettings(row: TreeRow<DockerContainer>) {
  const container = row.meta as DockerContainer | undefined;
  emit('row:click', {
    id: row.id,
    type: 'container',
    name: row.name,
    containerId: container?.id,
  });
}

function openRemoveContainerModal(row: TreeRow<DockerContainer>) {
  containerToRemove.value = row;
  removeContainerModalOpen.value = true;
}

async function handleConfirmRemoveContainer(withImage: boolean) {
  const row = containerToRemove.value;
  if (!row || !row.containerId) return;

  const containerName = stripLeadingSlash(row.meta?.names?.[0]) || row.name || '';
  setRowsBusy([row.id], true);

  try {
    await removeContainerMutation(
      { id: row.containerId, withImage },
      { refetchQueries: [refetchQuery], awaitRefetchQueries: true }
    );
    const imageMsg = withImage ? ' and image' : '';
    showToast(`Removed container${imageMsg}: ${containerName}`);
  } catch (error) {
    showError(`Failed to remove container: ${containerName}`, {
      description: error instanceof Error ? error.message : undefined,
    });
  } finally {
    setRowsBusy([row.id], false);
    containerToRemove.value = null;
    removeContainerModalOpen.value = false;
  }
}

const { getRowActionItems } = useDockerRowActions({
  updatingRowIds,
  checkingForUpdates,
  hasFlatEntries,
  hasActiveConsoleSession: (name) => consoleSessions.hasActiveSession(name),
  canMoveUp: (id) => entryReordering.canMoveUp(id),
  canMoveDown: (id) => entryReordering.canMoveDown(id),
  onMoveUp: (id) => entryReordering.moveUp(id),
  onMoveDown: (id) => entryReordering.moveDown(id),
  onSelectAllChildren: handleSelectAllChildren,
  onRenameFolder: (id, name) => folderOps.renameFolderInteractive(id, name),
  onDeleteFolder: (id) => folderOps.deleteFolderById(id),
  onMoveToFolder: (ids) => folderOps.openMoveModal(ids),
  onStartStop: (row) => containerActions.handleRowStartStop(row),
  onPauseResume: (row) => containerActions.handleRowPauseResume(row),
  onViewLogs: handleViewLogs,
  onOpenConsole: handleOpenConsole,
  onManageSettings: handleManageSettings,
  onCheckForUpdates: (row) => void handleCheckForUpdates([row]),
  onUpdateContainer: handleUpdateContainer,
  onRemoveContainer: openRemoveContainerModal,
  onVisitTailscale: handleVisitTailscale,
});

// Columns
const { columns } = useDockerTableColumns({
  compact: compactRef,
  busyRowIds,
  updatingRowIds,
  containerStats,
  onUpdateContainer: handleUpdateContainer,
  getRowActionItems,
});

// Bulk actions
const { bulkItems } = useDockerBulkActions({
  selectedIds: selectedIdsRef,
  allContainerRows,
  updateCandidateRows,
  checkingForUpdates,
  updatingAllContainers,
  getContainerRows,
  onCheckForUpdates: (rows) => void handleCheckForUpdates(rows),
  onUpdateAllContainers: (rows) => void handleUpdateAllContainers(rows),
  onMoveToFolder: (ids) => folderOps.openMoveModal(ids),
  onBulkUpdate: (rows) => void handleBulkUpdateContainers(rows),
  onStartStop: (ids) => containerActions.openStartStop(ids),
  onPauseResume: (ids) => containerActions.openPauseResume(ids),
});

// Column visibility
const defaultColumnVisibility = computed(() => getDefaultColumnVisibility(props.compact));
const resolvedColumnVisibility = computed<Record<string, boolean>>(() => ({
  ...defaultColumnVisibility.value,
  ...(columnVisibilityRef.value ?? {}),
}));

const { persistCurrentColumnVisibility } = usePersistentColumnVisibility({
  tableRef: baseTableRef,
  resolvedVisibility: resolvedColumnVisibility,
  fallbackVisibility: defaultColumnVisibility,
  onPersist: (visibility) => saveColumnVisibility({ ...visibility }),
  isPersistenceEnabled: () => !props.compact,
});

watch(
  () => props.viewPrefs,
  (prefs) => {
    if (prefs) {
      mergeServerPreferences(prefs);
    }
  },
  { immediate: true }
);

// Search
const dockerFilterHelpText = `Filter by ${DOCKER_SEARCHABLE_KEYS.join(', ')}`;

const dockerSearchAccessor = (row: TreeRow<DockerContainer>): unknown[] => {
  const meta = row.meta;
  if (!meta) return [];

  const names = Array.isArray(meta.names)
    ? meta.names.map((name) => (typeof name === 'string' ? stripLeadingSlash(name) : name))
    : [];
  const image = meta.image ? [meta.image] : [];
  const status = meta.status ? [meta.status] : [];
  const networkMode = meta.hostConfig?.networkMode ? [meta.hostConfig.networkMode] : [];
  const labels =
    meta.labels && typeof meta.labels === 'object'
      ? Object.entries(meta.labels).flatMap(([key, value]) => [key, String(value)])
      : [];

  return [...names, ...image, ...status, ...networkMode, ...labels];
};

// Logs on container start
function handleContainersWillStart(entries: { id: string; containerId: string; name: string }[]) {
  if (!entries.length) return;
  const targets = entries
    .map((entry) => {
      const rawRow = getRowById(entry.id, treeData.value);
      const row = rawRow && rawRow.type === 'container' ? (rawRow as TreeRow<DockerContainer>) : null;
      const label = getRowDisplayLabel(row, entry.name);
      return { containerName: entry.name, label };
    })
    .filter((entry): entry is { containerName: string; label: string } => Boolean(entry.containerName));
  if (!targets.length) return;
  logs.openLogsForContainers(targets);
}

// Drag and drop
function getSiblingIds(parentId: string): string[] {
  const folderChildren = folderChildrenIds.value[parentId];
  if (folderChildren && folderChildren.length) {
    return [...folderChildren];
  }
  if (parentId === rootFolderId.value && treeData.value.length) {
    return treeData.value.map((row) => row.id);
  }
  const parentRow = getRowById(parentId, treeData.value);
  if (parentRow?.children?.length) {
    return parentRow.children.map((child) => child.id);
  }
  return [];
}

function computeInsertionIndex(
  siblings: string[],
  movingIds: string[],
  targetId: string,
  area: DropArea
): number {
  if (!siblings.length) return 0;
  const filtered = siblings.filter((id) => !movingIds.includes(id));
  let insertIndex = filtered.findIndex((id) => id === targetId);
  if (insertIndex === -1) {
    insertIndex = filtered.length;
  } else if (area === 'after') {
    insertIndex += 1;
  }
  return Math.max(0, Math.min(insertIndex, filtered.length));
}

async function moveIntoFolder(destinationFolderId: string, movingIds: string[]) {
  await moveEntriesMutation(
    { destinationFolderId, sourceEntryIds: movingIds },
    { refetchQueries: [refetchQuery], awaitRefetchQueries: true }
  );
}

async function createFolderFromDrop(containerEntryId: string, movingIds: string[]) {
  const parentId = entryParentById.value[containerEntryId] || rootFolderId.value;
  const targetPosition = positionById.value[containerEntryId] ?? 0;
  const name = window.prompt('New folder name?')?.trim();
  if (!name) return;

  const toMove = [containerEntryId, ...movingIds.filter((id) => id !== containerEntryId)];
  await createFolderWithItemsMutation(
    { name, parentId, sourceEntryIds: toMove, position: targetPosition },
    { refetchQueries: [refetchQuery], awaitRefetchQueries: true }
  );
  showToast('Folder created');
}

async function handleDropOnRow(event: DropEvent<DockerContainer>) {
  if (!props.flatEntries) return;
  const { target, area, sourceIds: movingIds } = event;

  if (!movingIds.length) return;
  if (movingIds.includes(target.id)) return;

  if (target.type === 'folder' && area === 'inside') {
    await moveIntoFolder(target.id, movingIds);
    return;
  }
  if (target.type === 'container' && area === 'inside') {
    await createFolderFromDrop(target.id, movingIds);
    return;
  }

  const parentId = entryParentById.value[target.id] || rootFolderId.value;
  const siblings = getSiblingIds(parentId);
  const position = computeInsertionIndex(siblings, movingIds, target.id, area);

  await moveItemsToPositionMutation(
    { sourceEntryIds: movingIds, destinationFolderId: parentId, position },
    { refetchQueries: [refetchQuery], awaitRefetchQueries: true }
  );
}

// Event handlers
function handleRowClick(payload: { id: string; type: string; name: string; meta?: DockerContainer }) {
  if (payload.type === 'folder') {
    baseTableRef.value?.toggleExpanded?.(payload.id);
  }
  emit('row:click', {
    id: payload.id,
    type: payload.type as 'container' | 'folder',
    name: payload.name,
    containerId: payload.meta?.id,
  });
}

async function handleRowContextMenu(payload: {
  id: string;
  type: string;
  name: string;
  meta?: DockerContainer;
  event: MouseEvent;
}) {
  payload.event.preventDefault();
  payload.event.stopPropagation();
  const row = getRowById(payload.id, treeData.value);
  if (!row) return;
  if (busyRowIds.value.has(row.id)) return;

  const items = getRowActionItems(row as TreeRow<DockerContainer>);
  if (!items.length) return;

  await contextMenu.openContextMenu({
    x: payload.event.clientX,
    y: payload.event.clientY,
    items,
    rowId: row.id,
  });
}

function handleRowSelect(payload: {
  id: string;
  type: string;
  name: string;
  meta?: DockerContainer;
  selected: boolean;
}) {
  emit('row:select', {
    id: payload.id,
    type: payload.type as 'container' | 'folder',
    name: payload.name,
    containerId: payload.meta?.id,
    selected: payload.selected,
  });
}

function handleUpdateSelectedIds(ids: string[]) {
  emit('update:selectedIds', ids);
}

async function handleCreateFolderInMoveModal() {
  await folderOps.handleCreateFolderInTree();
  emit('created-folder');
}

// Confirm modal data
const confirmStartStopGroups = computed(() => [
  { label: 'Will stop', items: containerActions.confirmToStop.value || [] },
  { label: 'Will start', items: containerActions.confirmToStart.value || [] },
]);

const confirmPauseResumeGroups = computed(() => [
  { label: 'Will pause', items: containerActions.confirmToPause.value || [] },
  { label: 'Will resume', items: containerActions.confirmToResume.value || [] },
]);

const containerToRemoveName = computed(() =>
  containerToRemove.value ? stripLeadingSlash(containerToRemove.value?.name) : ''
);

const rowActionDropdownUi = {
  content: 'overflow-x-hidden z-50',
  item: 'bg-transparent hover:bg-transparent focus:bg-transparent border-0 ring-0 outline-none shadow-none data-[state=checked]:bg-transparent',
};
</script>

<template>
  <div class="w-full">
    <BaseTreeTable
      ref="baseTableRef"
      :data="treeData"
      :columns="columns"
      :loading="loading"
      :compact="compact"
      :active-id="activeId"
      :selected-ids="selectedIds"
      :busy-row-ids="busyRowIds"
      :enable-drag-drop="!!flatEntries"
      enable-resizing
      v-model:column-sizing="columnSizing"
      v-model:column-order="columnOrder"
      :searchable-keys="DOCKER_SEARCHABLE_KEYS"
      :search-accessor="dockerSearchAccessor"
      :can-expand="(row: TreeRow<DockerContainer>) => row.type === 'folder'"
      :can-select="(row: TreeRow<DockerContainer>) => row.type === 'container'"
      :can-drag="(row: TreeRow<DockerContainer>) => row.type === 'container' || row.type === 'folder'"
      :can-drop-inside="
        (row: TreeRow<DockerContainer>) => row.type === 'container' || row.type === 'folder'
      "
      @row:click="handleRowClick"
      @row:contextmenu="handleRowContextMenu"
      @row:select="handleRowSelect"
      @row:drop="handleDropOnRow"
      @update:selected-ids="handleUpdateSelectedIds"
    >
      <template
        #toolbar="{
          selectedCount: count,
          globalFilter: filterText,
          setGlobalFilter,
          columnOrder: tableColumnOrder,
        }"
      >
        <div :class="['mb-4 flex flex-wrap items-center gap-2', compact ? 'sm:px-0.5' : '']">
          <UInput
            :model-value="filterText"
            :size="compact ? 'sm' : 'md'"
            :class="['max-w-sm flex-1', compact ? 'min-w-[8ch]' : 'min-w-[12ch]']"
            :placeholder="dockerFilterHelpText"
            :title="dockerFilterHelpText"
            @update:model-value="setGlobalFilter"
          />
          <TableColumnMenu
            v-if="!compact"
            :table="baseTableRef"
            :column-order="tableColumnOrder"
            @change="persistCurrentColumnVisibility"
            @update:column-order="(order) => (columnOrder = order)"
          />
          <UDropdownMenu
            :items="bulkItems"
            size="md"
            :ui="{
              content: 'overflow-x-hidden z-40',
              item: 'bg-transparent hover:bg-transparent focus:bg-transparent border-0 ring-0 outline-none shadow-none data-[state=checked]:bg-transparent',
            }"
          >
            <UButton
              color="neutral"
              variant="outline"
              :size="compact ? 'sm' : 'md'"
              trailing-icon="i-lucide-chevron-down"
            >
              Actions{{ count > 0 ? ` (${count})` : '' }}
            </UButton>
          </UDropdownMenu>
        </div>
        <div
          v-if="isUpdatingContainers && activeUpdateSummary"
          class="border-primary/30 bg-primary/5 text-primary my-2 flex items-center gap-2 rounded border px-3 py-2 text-sm"
        >
          <span class="i-lucide-loader-2 text-primary animate-spin" />
          <span>Updating {{ activeUpdateSummary }}...</span>
        </div>
      </template>
    </BaseTreeTable>

    <!-- Context Menu -->
    <UDropdownMenu
      v-model:open="contextMenu.isOpen.value"
      :items="contextMenu.items.value"
      size="md"
      :popper="contextMenu.popperOptions"
      :ui="rowActionDropdownUi"
    >
      <div
        class="fixed h-px w-px"
        :style="{ top: `${contextMenu.position.value.y}px`, left: `${contextMenu.position.value.x}px` }"
      />
    </UDropdownMenu>

    <!-- Logs Modal -->
    <DockerLogViewerModal
      v-model:open="logs.logsModalOpen.value"
      v-model:active-session-id="logs.activeLogSessionId.value"
      :sessions="logs.logSessions.value"
      :active-session="logs.activeLogSession.value"
      @remove-session="logs.removeLogSession"
      @toggle-follow="logs.toggleActiveLogFollow"
    />

    <!-- Move to Folder Modal -->
    <MoveToFolderModal
      :open="folderOps.moveOpen"
      :loading="moving || creating || deleting"
      :folders="visibleFolders"
      :expanded-folders="expandedFolders"
      :selected-folder-id="folderOps.selectedFolderId"
      :root-folder-id="rootFolderId"
      :renaming-folder-id="folderOps.renamingFolderId"
      :rename-value="folderOps.renameValue"
      @update:open="folderOps.moveOpen = $event"
      @update:selected-folder-id="folderOps.selectedFolderId = $event"
      @update:rename-value="folderOps.renameValue = $event"
      @toggle-expand="toggleExpandFolder"
      @create-folder="handleCreateFolderInMoveModal"
      @delete-folder="folderOps.handleDeleteFolder"
      @start-rename="folderOps.startRenameFolder"
      @commit-rename="folderOps.commitRenameFolder"
      @cancel-rename="folderOps.cancelRename"
      @confirm="folderOps.confirmMove(() => (folderOps.moveOpen = false))"
    />

    <!-- Start/Stop Confirm Modal -->
    <ConfirmActionsModal
      :open="containerActions.confirmStartStopOpen.value"
      :groups="confirmStartStopGroups"
      @update:open="containerActions.confirmStartStopOpen.value = $event"
      @confirm="containerActions.confirmStartStop(() => {})"
    />

    <!-- Pause/Resume Confirm Modal -->
    <ConfirmActionsModal
      :open="containerActions.confirmPauseResumeOpen.value"
      :groups="confirmPauseResumeGroups"
      @update:open="containerActions.confirmPauseResumeOpen.value = $event"
      @confirm="containerActions.confirmPauseResume(() => {})"
    />

    <!-- Remove Container Modal -->
    <RemoveContainerModal
      :open="removeContainerModalOpen"
      :container-name="containerToRemoveName"
      :loading="removingContainer"
      @update:open="removeContainerModalOpen = $event"
      @confirm="handleConfirmRemoveContainer"
    />
  </div>
</template>
