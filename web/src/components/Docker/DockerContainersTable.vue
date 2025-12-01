<script setup lang="ts">
import { computed, h, reactive, ref, resolveComponent, watch } from 'vue';
import { useMutation, useSubscription } from '@vue/apollo-composable';
import { useStorage } from '@vueuse/core';

import BaseTreeTable from '@/components/Common/BaseTreeTable.vue';
import MultiValueCopyBadges from '@/components/Common/MultiValueCopyBadges.vue';
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
import { DOCKER_STATS_SUBSCRIPTION } from '@/components/Docker/docker-stats.subscription';
import { STOP_DOCKER_CONTAINER } from '@/components/Docker/docker-stop-container.mutation';
import { UNPAUSE_DOCKER_CONTAINER } from '@/components/Docker/docker-unpause-container.mutation';
import DockerContainerStatCell from '@/components/Docker/DockerContainerStatCell.vue';
import DockerLogViewerModal from '@/components/Docker/DockerLogViewerModal.vue';
import DockerNameCell from '@/components/Docker/DockerNameCell.vue';
import { ContainerState } from '@/composables/gql/graphql';
import { useContainerActions } from '@/composables/useContainerActions';
import { useContextMenu } from '@/composables/useContextMenu';
import { useDockerViewPreferences } from '@/composables/useDockerColumnVisibility';
import { useDockerConsoleSessions } from '@/composables/useDockerConsoleSessions';
import { useDockerLogSessions } from '@/composables/useDockerLogSessions';
import { useDockerUpdateActions } from '@/composables/useDockerUpdateActions';
import { useEntryReordering } from '@/composables/useEntryReordering';
import { useFolderOperations } from '@/composables/useFolderOperations';
import { useFolderTree } from '@/composables/useFolderTree';
import { usePersistentColumnVisibility } from '@/composables/usePersistentColumnVisibility';
import { getSelectableDescendants } from '@/composables/useRowSelection';
import { useTreeData } from '@/composables/useTreeData';
import {
  getFirstLanIp,
  normalizeMultiValue,
  openLanIpInNewTab,
  toContainerTreeRow,
} from '@/utils/docker';

import type {
  DockerContainer,
  DockerContainerStats,
  FlatOrganizerEntry,
} from '@/composables/gql/graphql';
import type { DropArea, DropEvent } from '@/composables/useDragDrop';
import type { ColumnVisibilityTableInstance } from '@/composables/usePersistentColumnVisibility';
import type { TreeRow } from '@/composables/useTreeData';
import type { TableColumn } from '@nuxt/ui';
import type { Component } from 'vue';

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

const UButton = resolveComponent('UButton');
const UBadge = resolveComponent('UBadge');
const UInput = resolveComponent('UInput');
const UDropdownMenu = resolveComponent('UDropdownMenu');
const UModal = resolveComponent('UModal');
const USkeleton = resolveComponent('USkeleton') as Component;
const UIcon = resolveComponent('UIcon');
const rowActionDropdownUi = {
  content: 'overflow-x-hidden z-50',
  item: 'bg-transparent hover:bg-transparent focus:bg-transparent border-0 ring-0 outline-none shadow-none data-[state=checked]:bg-transparent',
};

const emit = defineEmits<{
  (e: 'created-folder'): void;
  (
    e: 'row:click',
    payload: {
      id: string;
      type: 'container' | 'folder';
      name: string;
      containerId?: string;
      tab?: 'management' | 'logs' | 'console';
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

const containerStats = reactive(new Map<string, DockerContainerStats>());

const { onResult: onStatsResult } = useSubscription(DOCKER_STATS_SUBSCRIPTION, null, () => ({
  fetchPolicy: 'network-only',
}));

onStatsResult((result) => {
  const stat = result.data?.dockerContainerStats as DockerContainerStats | undefined;
  if (stat && stat.id) {
    containerStats.set(stat.id, stat);
  }
});

const MULTI_VALUE_INLINE_LIMIT = 1;

type MultiValueKey = 'containerIp' | 'containerPort' | 'lanPort';

const MULTI_VALUE_LABELS: Record<MultiValueKey, string> = {
  containerIp: 'Container IP',
  containerPort: 'Container port',
  lanPort: 'LAN IP:Port',
};

function makeMultiValueCell(accessor: MultiValueKey) {
  return ({
    row,
  }: {
    row: { original: TreeRow<DockerContainer>; getValue: (key: string) => unknown };
  }) => {
    if (row.original.type === 'folder') return '';
    const values = normalizeMultiValue(row.getValue(accessor));
    return h(MultiValueCopyBadges, {
      values,
      label: MULTI_VALUE_LABELS[accessor],
      inlineLimit: MULTI_VALUE_INLINE_LIMIT,
      idPrefix: `${row.original.id}-${accessor}`,
    });
  };
}

const flatEntriesRef = computed(() => props.flatEntries);
const containersRef = computed(() => props.containers);

const rootFolderId = computed<string>(() => props.rootFolderId || 'root');

const baseTableRef = ref<
  (ColumnVisibilityTableInstance & { toggleExpanded?: (id: string) => void }) | null
>(null);

const searchableKeys = [
  'name',
  'state',
  'version',
  'network',
  'containerIp',
  'containerPort',
  'lanPort',
  'volumes',
  'autoStart',
  'updates',
  'uptime',
  'containerId',
];

const dockerSearchAccessor = (row: TreeRow<DockerContainer>): unknown[] => {
  const meta = row.meta;
  if (!meta) return [];

  const names = Array.isArray(meta.names)
    ? meta.names.map((name) => (typeof name === 'string' ? name.replace(/^\//, '') : name))
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

const dockerFilterHelpText = `Filter by ${searchableKeys.join(', ')}`;

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
const busyRowIds = ref<Set<string>>(new Set());
const columnSizing = useStorage<Record<string, number>>('docker-table-column-sizing', {});
const columnOrder = useStorage<string[]>('docker-table-column-order', []);

const logs = useDockerLogSessions();
const consoleSessions = useDockerConsoleSessions();
const contextMenu = useContextMenu<DockerContainer>();

const { mergeServerPreferences, saveColumnVisibility, columnVisibilityRef } = useDockerViewPreferences();

function showError(message: string, options?: { description?: string }) {
  window.toast?.error?.(message, options);
}

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

function setRowsBusy(ids: string[], busy: boolean) {
  const next = new Set(busyRowIds.value);
  for (const id of ids) {
    if (busy) next.add(id);
    else next.delete(id);
  }
  busyRowIds.value = next;
}

const columns = computed<TableColumn<TreeRow<DockerContainer>>[]>(() => {
  const cols: TableColumn<TreeRow<DockerContainer>>[] = [
    {
      accessorKey: 'name',
      header: props.compact ? '' : 'Name',
      cell: ({
        row,
      }: {
        row: {
          original: TreeRow<DockerContainer>;
          depth: number;
          getIsExpanded?: () => boolean;
          toggleExpanded?: () => void;
        };
      }) => {
        const treeRow = row.original as TreeRow<DockerContainer>;
        const isRowUpdating = updatingRowIds.value.has(treeRow.id);
        const canExpand = treeRow.type === 'folder' && !!(treeRow.children && treeRow.children.length);
        const isExpanded = row.getIsExpanded?.() ?? false;

        return h(DockerNameCell, {
          row: treeRow,
          depth: row.depth,
          isUpdating: isRowUpdating,
          canExpand,
          isExpanded,
          onToggleExpand: () => {
            row.toggleExpanded?.();
          },
        });
      },
      meta: { class: { td: 'truncate', th: '' } },
    },
    {
      accessorKey: 'state',
      header: 'State',
      cell: ({ row }) => {
        if (row.original.type === 'folder') return '';
        const state = row.original.state ?? '';
        const isBusy = busyRowIds.value.has(row.original.id);
        const colorMap: Record<string, 'success' | 'warning' | 'neutral'> = {
          [ContainerState.RUNNING]: 'success',
          [ContainerState.PAUSED]: 'warning',
          [ContainerState.EXITED]: 'neutral',
        };
        const color = colorMap[state] || 'neutral';
        if (isBusy) {
          return h(USkeleton, { class: 'h-5 w-20' });
        }
        return h(UBadge, { color }, () => state);
      },
    },
    {
      accessorKey: 'cpu',
      header: 'CPU',
      cell: ({ row }) => {
        if (row.original.type === 'folder' || !row.original.containerId) return '';
        return h(DockerContainerStatCell, {
          containerId: row.original.containerId,
          statsMap: containerStats,
          type: 'cpu',
        });
      },
    },
    {
      accessorKey: 'memory',
      header: 'Memory',
      cell: ({ row }) => {
        if (row.original.type === 'folder' || !row.original.containerId) return '';
        return h(DockerContainerStatCell, {
          containerId: row.original.containerId,
          statsMap: containerStats,
          type: 'memory',
        });
      },
    },
    {
      accessorKey: 'version',
      header: 'Version',
      cell: ({ row }) => {
        if (row.original.type === 'folder') return '';
        const treeRow = row.original as TreeRow<DockerContainer>;
        const version = String(row.getValue('version') || '');
        const hasUpdate = treeRow.meta?.isUpdateAvailable || treeRow.meta?.isRebuildReady;
        const isRowUpdating = updatingRowIds.value.has(treeRow.id);

        if (hasUpdate && !isRowUpdating) {
          return h('div', { class: 'flex items-center gap-2' }, [
            h('span', null, version),
            h(
              UBadge,
              {
                color: 'warning',
                variant: 'subtle',
                size: 'sm',
                class: 'cursor-pointer',
                'data-stop-row-click': 'true',
                onClick: (e: Event) => {
                  e.stopPropagation();
                  handleUpdateContainer(treeRow);
                },
              },
              () => 'Update'
            ),
          ]);
        }
        return h('span', null, version);
      },
    },
    {
      accessorKey: 'links',
      header: 'Links',
      cell: ({ row }) => {
        if (row.original.type === 'folder') return '';
        const meta = row.original.meta;
        const projectUrl = meta?.projectUrl;
        const registryUrl = meta?.registryUrl;
        const supportUrl = meta?.supportUrl;

        if (!projectUrl && !registryUrl && !supportUrl) return '';

        return h('div', { class: 'flex gap-2 items-center' }, [
          projectUrl
            ? h(
                'a',
                {
                  href: projectUrl,
                  target: '_blank',
                  title: 'Project Page',
                  class:
                    'text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400',
                },
                h(UIcon, { name: 'i-lucide-globe', class: 'w-4 h-4' })
              )
            : null,
          registryUrl
            ? h(
                'a',
                {
                  href: registryUrl,
                  target: '_blank',
                  title: 'Registry',
                  class:
                    'text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400',
                },
                h(UIcon, { name: 'i-lucide-external-link', class: 'w-4 h-4' })
              )
            : null,
          supportUrl
            ? h(
                'a',
                {
                  href: supportUrl,
                  target: '_blank',
                  title: 'Support',
                  class:
                    'text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400',
                },
                h(UIcon, { name: 'i-lucide-life-buoy', class: 'w-4 h-4' })
              )
            : null,
        ]);
      },
    },
    {
      accessorKey: 'network',
      header: 'Network',
      cell: ({ row }) =>
        row.original.type === 'folder' ? '' : h('span', null, String(row.getValue('network') || '')),
    },
    {
      accessorKey: 'containerIp',
      header: 'Container IP',
      cell: makeMultiValueCell('containerIp'),
    },
    {
      accessorKey: 'containerPort',
      header: 'Container Port',
      cell: makeMultiValueCell('containerPort'),
    },
    {
      accessorKey: 'lanPort',
      header: 'LAN IP:Port',
      cell: makeMultiValueCell('lanPort'),
    },
    {
      accessorKey: 'volumes',
      header: 'Volume Mappings',
      cell: ({ row }) =>
        row.original.type === 'folder' ? '' : h('span', null, String(row.getValue('volumes') || '')),
    },
    {
      accessorKey: 'autoStart',
      header: 'Auto Start',
      cell: ({ row }) =>
        row.original.type === 'folder' ? '' : h('span', null, String(row.getValue('autoStart') || '')),
    },
    {
      accessorKey: 'uptime',
      header: 'Uptime',
      cell: ({ row }) =>
        row.original.type === 'folder' ? '' : h('span', null, String(row.getValue('uptime') || '')),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const items = getRowActionItems(row.original as TreeRow<DockerContainer>);
        return h(
          UDropdownMenu,
          {
            items,
            size: 'md',
            ui: rowActionDropdownUi,
          },
          {
            default: () =>
              h(UButton, {
                color: 'neutral',
                variant: 'ghost',
                icon: 'i-lucide-more-vertical',
                square: true,
                'aria-label': 'Row actions',
              }),
          }
        );
      },
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      meta: { class: { th: 'w-8', td: 'w-8 text-right' } },
    },
  ];
  return cols;
});

function getDefaultColumnVisibility(isCompact: boolean): Record<string, boolean> {
  if (isCompact) {
    return {
      state: false,
      cpu: false,
      memory: false,
      version: false,
      links: true,
      network: false,
      containerIp: false,
      containerPort: false,
      lanPort: false,
      volumes: false,
      autoStart: false,
      uptime: false,
      actions: false,
    };
  } else {
    return {
      state: true,
      cpu: true,
      memory: true,
      version: false,
      links: true,
      network: false,
      containerIp: false,
      containerPort: false,
      lanPort: true,
      volumes: false,
      autoStart: true,
      uptime: false,
    };
  }
}

const defaultColumnVisibility = computed(() => getDefaultColumnVisibility(props.compact));

const resolvedColumnVisibility = computed<Record<string, boolean>>(() => ({
  ...defaultColumnVisibility.value,
  ...(columnVisibilityRef.value ?? {}),
}));

// Keep table visibility in sync with saved preferences and persist optimistic user toggles.
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

type ActionDropdownItem = {
  label: string;
  icon?: string;
  onSelect?: (e?: Event) => void;
  as?: string;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral';
};
type DropdownMenuItems = ActionDropdownItem[][];

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

const removeContainerModalOpen = ref(false);
const containerToRemove = ref<TreeRow<DockerContainer> | null>(null);
const removeWithImage = ref(true);

declare global {
  interface Window {
    toast?: {
      success: (title: string, options: { description?: string }) => void;
      error?: (title: string, options: { description?: string }) => void;
    };
  }
}

function showToast(message: string) {
  window.toast?.success(message);
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

function getRowDisplayLabel(row?: TreeRow<DockerContainer> | null, fallback?: string) {
  if (!row) return fallback || '';
  const meta = row.meta as DockerContainer | undefined;
  const metaName = meta?.names?.[0]?.replace(/^\//, '') || '';
  return metaName || row.name || fallback || '';
}

function getContainerNameFromRow(row: TreeRow<DockerContainer>): string {
  const meta = row.meta as DockerContainer | undefined;
  return meta?.names?.[0]?.replace(/^\//, '') || row.name || '';
}

const allContainerRows = computed<TreeRow<DockerContainer>[]>(() => {
  return flattenRows(treeData.value, 'container') as TreeRow<DockerContainer>[];
});

const updateCandidateRows = computed<TreeRow<DockerContainer>[]>(() =>
  allContainerRows.value.filter((row) => Boolean(row.meta?.isUpdateAvailable))
);

const selectedContainerRows = computed(() => getContainerRows(props.selectedIds));
const hasSelectedContainers = computed(() => selectedContainerRows.value.length > 0);
const hasSelectedEntries = computed(() => props.selectedIds.length > 0);
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
    refetchQuery: { query: GET_DOCKER_CONTAINERS, variables: { skipCache: true } },
    onSuccess: showToast,
  })
);

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

const entryReordering = useEntryReordering({
  rootFolderId,
  entryParentById,
  folderChildrenIds,
  treeData,
  getRowById,
  onMove: ({ rowId, parentId, position }) =>
    moveItemsToPositionMutation(
      { sourceEntryIds: [rowId], destinationFolderId: parentId, position },
      {
        refetchQueries: [{ query: GET_DOCKER_CONTAINERS, variables: { skipCache: true } }],
        awaitRefetchQueries: true,
      }
    ),
});

const canCreateFolder = computed(() => (folderOps.newTreeFolderName || '').trim().length > 0);
const canDeleteFolder = computed(
  () => folderOps.selectedFolderId && folderOps.selectedFolderId !== rootFolderId.value
);

const confirmToStop = computed(() => containerActions.confirmToStop.value || []);
const confirmToStart = computed(() => containerActions.confirmToStart.value || []);
const confirmToPause = computed(() => containerActions.confirmToPause.value || []);
const confirmToResume = computed(() => containerActions.confirmToResume.value || []);

async function moveIntoFolder(destinationFolderId: string, movingIds: string[]) {
  await moveEntriesMutation(
    { destinationFolderId, sourceEntryIds: movingIds },
    {
      refetchQueries: [{ query: GET_DOCKER_CONTAINERS, variables: { skipCache: true } }],
      awaitRefetchQueries: true,
    }
  );
}

async function createFolderFromDrop(containerEntryId: string, movingIds: string[]) {
  const parentId = entryParentById.value[containerEntryId] || rootFolderId.value;
  const targetPosition = positionById.value[containerEntryId] ?? 0;
  const name = window.prompt('New folder name?')?.trim();
  if (!name) return;

  const toMove = [containerEntryId, ...movingIds.filter((id) => id !== containerEntryId)];
  await createFolderWithItemsMutation(
    {
      name,
      parentId,
      sourceEntryIds: toMove,
      position: targetPosition,
    },
    {
      refetchQueries: [{ query: GET_DOCKER_CONTAINERS, variables: { skipCache: true } }],
      awaitRefetchQueries: true,
    }
  );
  showToast('Folder created');
}

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
    // If the target isn't found in the filtered list, default to the end.
    insertIndex = filtered.length;
  } else if (area === 'after') {
    insertIndex += 1;
  }

  return Math.max(0, Math.min(insertIndex, filtered.length));
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

  // Logic for Reordering ("before" / "after")
  // We need to calculate the correct `position` index for the mutation.
  // The mutation `dockerMoveItemsToPosition` typically expects a position index within the parent folder.

  // 1. Identify the parent folder of the target
  const parentId = entryParentById.value[target.id] || rootFolderId.value;

  // 2. Get the target's position in the flat list? No, we need its position in the folder's children list.
  const siblings = getSiblingIds(parentId);
  const insertIndex = computeInsertionIndex(siblings, movingIds, target.id, area);
  const position = insertIndex;

  await moveItemsToPositionMutation(
    {
      sourceEntryIds: movingIds,
      destinationFolderId: parentId,
      position,
    },
    {
      refetchQueries: [{ query: GET_DOCKER_CONTAINERS, variables: { skipCache: true } }],
      awaitRefetchQueries: true,
    }
  );
}

function getSelectedEntryIds(): string[] {
  return props.selectedIds;
}

async function handleCreateFolderInTree() {
  await folderOps.handleCreateFolderInTree();
  emit('created-folder');
}

function handleBulkAction(action: string) {
  const ids = getSelectedEntryIds();
  if (ids.length === 0) return;
  if (action === 'Start / Stop') {
    containerActions.openStartStop(ids);
    return;
  }
  if (action === 'Pause / Resume') {
    containerActions.openPauseResume(ids);
    return;
  }
  if (action === 'Update containers') {
    const containerRows = getContainerRows(ids);
    if (!containerRows.length) return;
    void handleBulkUpdateContainers(containerRows);
    return;
  }
  showToast(`${action} (${ids.length})`);
}

function handleContainersWillStart(entries: { id: string; containerId: string; name: string }[]) {
  if (!entries.length) return;
  const targets = entries
    .map((entry) => {
      const rawRow = getRowById(entry.id, treeData.value);
      const row = rawRow && rawRow.type === 'container' ? (rawRow as TreeRow<DockerContainer>) : null;
      const label = getRowDisplayLabel(row, entry.name);
      const containerName = entry.name;
      return {
        containerName,
        label,
      };
    })
    .filter((entry): entry is { containerName: string; label: string } => Boolean(entry.containerName));
  if (!targets.length) return;
  logs.openLogsForContainers(targets);
}

function handleRowAction(row: TreeRow<DockerContainer>, action: string) {
  if (row.type !== 'container') return;
  if (action === 'Start / Stop') {
    containerActions.handleRowStartStop(row);
    return;
  }
  if (action === 'Pause / Resume') {
    containerActions.handleRowPauseResume(row);
    return;
  }
  if (action === 'View logs') {
    const containerName = row.name;
    if (!containerName) return;
    logs.openLogsForContainers([{ containerName, label: getRowDisplayLabel(row, row.name) }]);
    return;
  }
  if (action === 'Console') {
    const container = row.meta as DockerContainer | undefined;
    emit('row:click', {
      id: row.id,
      type: 'container',
      name: row.name,
      containerId: container?.id,
      tab: 'console',
    });
    return;
  }
  if (action === 'Manage Settings') {
    const container = row.meta as DockerContainer | undefined;
    emit('row:click', {
      id: row.id,
      type: 'container',
      name: row.name,
      containerId: container?.id,
    });
    return;
  }
  showToast(`${action}: ${row.name}`);
}

function openRemoveContainerModal(row: TreeRow<DockerContainer>) {
  containerToRemove.value = row;
  removeWithImage.value = true;
  removeContainerModalOpen.value = true;
}

async function confirmRemoveContainer(close: () => void) {
  const row = containerToRemove.value;
  if (!row || !row.containerId) return;

  const containerName = getContainerNameFromRow(row);
  setRowsBusy([row.id], true);

  try {
    await removeContainerMutation(
      { id: row.containerId, withImage: removeWithImage.value },
      {
        refetchQueries: [{ query: GET_DOCKER_CONTAINERS, variables: { skipCache: true } }],
        awaitRefetchQueries: true,
      }
    );
    const imageMsg = removeWithImage.value ? ' and image' : '';
    showToast(`Removed container${imageMsg}: ${containerName}`);
  } catch (error) {
    showError(`Failed to remove container: ${containerName}`, {
      description: error instanceof Error ? error.message : undefined,
    });
  } finally {
    setRowsBusy([row.id], false);
    containerToRemove.value = null;
    close();
  }
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

const bulkItems = computed<DropdownMenuItems>(() => [
  [
    {
      label: 'Check for updates',
      icon: 'i-lucide-refresh-cw',
      as: 'button',
      disabled: checkingForUpdates.value,
      onSelect: () => void handleCheckForUpdates(allContainerRows.value),
    },
    {
      label: 'Update all',
      icon: 'i-lucide-rotate-ccw',
      as: 'button',
      disabled: updatingAllContainers.value,
      onSelect: () => void handleUpdateAllContainers(updateCandidateRows.value),
    },
  ],
  [
    {
      label: 'Move to folder',
      icon: 'i-lucide-folder',
      as: 'button',
      disabled: !hasSelectedEntries.value,
      onSelect: () => folderOps.openMoveModal(getSelectedEntryIds()),
    },
    {
      label: 'Update containers',
      icon: 'i-lucide-rotate-ccw',
      as: 'button',
      disabled: !hasSelectedContainers.value,
      onSelect: () => handleBulkAction('Update containers'),
    },
    {
      label: 'Start / Stop',
      icon: 'i-lucide-power',
      as: 'button',
      disabled: !hasSelectedContainers.value,
      onSelect: () => handleBulkAction('Start / Stop'),
    },
    {
      label: 'Pause / Resume',
      icon: 'i-lucide-pause',
      as: 'button',
      disabled: !hasSelectedContainers.value,
      onSelect: () => handleBulkAction('Pause / Resume'),
    },
  ],
]);

function getRowActionItems(row: TreeRow<DockerContainer>): DropdownMenuItems {
  const reorderActions: ActionDropdownItem[] = [];
  if (props.flatEntries) {
    reorderActions.push(
      {
        label: 'Move up',
        icon: 'i-lucide-arrow-up',
        as: 'button',
        disabled: !entryReordering.canMoveUp(row.id),
        onSelect: () => entryReordering.moveUp(row.id),
      },
      {
        label: 'Move down',
        icon: 'i-lucide-arrow-down',
        as: 'button',
        disabled: !entryReordering.canMoveDown(row.id),
        onSelect: () => entryReordering.moveDown(row.id),
      }
    );
  }

  if (row.type === 'folder') {
    const items: DropdownMenuItems = [
      [
        {
          label: 'Select all children',
          icon: 'i-lucide-check-square',
          as: 'button',
          onSelect: () => handleSelectAllChildren(row),
        },
      ],
    ];
    if (reorderActions.length > 0) {
      items.push(reorderActions);
    }
    items.push([
      {
        label: 'Rename',
        icon: 'i-lucide-pencil',
        as: 'button',
        onSelect: () => folderOps.renameFolderInteractive(row.id, row.name),
      },
      {
        label: 'Delete',
        icon: 'i-lucide-trash',
        as: 'button',
        onSelect: () => folderOps.deleteFolderById(row.id),
      },
    ]);
    return items;
  }

  const lanIp = getFirstLanIp(row.meta);
  const canVisit = Boolean(lanIp) && row.meta?.state === ContainerState.RUNNING;
  const hasUpdate = row.meta?.isUpdateAvailable || row.meta?.isRebuildReady;
  const isRowUpdating = updatingRowIds.value.has(row.id);

  const quickActions: ActionDropdownItem[] = [];
  if (canVisit && lanIp) {
    quickActions.push({
      label: 'Visit',
      icon: 'i-lucide-external-link',
      as: 'button',
      onSelect: () => openLanIpInNewTab(lanIp),
    });
  }
  if (hasUpdate && !isRowUpdating) {
    quickActions.push({
      label: 'Update',
      icon: 'i-lucide-circle-arrow-up',
      as: 'button',
      onSelect: () => handleUpdateContainer(row),
    });
  }

  const items: DropdownMenuItems = [];

  if (quickActions.length > 0) {
    items.push(quickActions);
  }

  if (reorderActions.length > 0) {
    items.push(reorderActions);
  }

  items.push([
    {
      label: 'Move to folder',
      icon: 'i-lucide-folder',
      as: 'button',
      onSelect: () => folderOps.openMoveModal([row.id]),
    },
    {
      label: 'Start / Stop',
      icon: 'i-lucide-power',
      as: 'button',
      onSelect: () => handleRowAction(row, 'Start / Stop'),
    },
    {
      label: 'Pause / Resume',
      icon: 'i-lucide-pause',
      as: 'button',
      onSelect: () => handleRowAction(row, 'Pause / Resume'),
    },
  ]);

  const containerName = getContainerNameFromRow(row);
  const hasConsoleSession = containerName ? consoleSessions.hasActiveSession(containerName) : false;

  items.push([
    {
      label: 'View logs',
      icon: 'i-lucide-scroll-text',
      as: 'button',
      onSelect: () => handleRowAction(row, 'View logs'),
    },
    {
      label: hasConsoleSession ? 'Console (active)' : 'Console',
      icon: 'i-lucide-terminal',
      as: 'button',
      color: hasConsoleSession ? 'success' : undefined,
      onSelect: () => handleRowAction(row, 'Console'),
    },
    {
      label: 'Manage Settings',
      icon: 'i-lucide-settings',
      as: 'button',
      onSelect: () => handleRowAction(row, 'Manage Settings'),
    },
  ]);

  items.push([
    {
      label: 'Remove',
      icon: 'i-lucide-trash-2',
      as: 'button',
      color: 'error',
      onSelect: () => openRemoveContainerModal(row),
    },
  ]);

  return items;
}

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
      :searchable-keys="searchableKeys"
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
              color="primary"
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
          class="border-primary/30 text-primary-700 dark:border-primary/40 dark:text-primary-200 bg-primary/5 dark:bg-primary/10 my-2 flex items-center gap-2 rounded border px-3 py-2 text-sm"
        >
          <span class="i-lucide-loader-2 text-primary-500 dark:text-primary-300 animate-spin" />
          <span>Updating {{ activeUpdateSummary }}...</span>
        </div>
      </template>
    </BaseTreeTable>

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

    <DockerLogViewerModal
      v-model:open="logs.logsModalOpen.value"
      v-model:active-session-id="logs.activeLogSessionId.value"
      :sessions="logs.logSessions.value"
      :active-session="logs.activeLogSession.value"
      @remove-session="logs.removeLogSession"
      @toggle-follow="logs.toggleActiveLogFollow"
    />

    <UModal
      v-model:open="folderOps.moveOpen"
      title="Move to folder"
      :ui="{ footer: 'justify-end', overlay: 'z-50', content: 'z-50' }"
    >
      <template #body>
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <UInput v-model="folderOps.newTreeFolderName" placeholder="New folder name" class="flex-1" />
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              :disabled="!canCreateFolder"
              @click="handleCreateFolderInTree"
              >Create</UButton
            >
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              :disabled="!canDeleteFolder"
              @click="folderOps.handleDeleteFolder"
              >Delete</UButton
            >
          </div>

          <div class="border-default rounded border">
            <div
              v-for="row in visibleFolders"
              :key="row.id"
              :data-id="row.id"
              class="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <UButton
                v-if="row.hasChildren"
                color="neutral"
                size="xs"
                variant="ghost"
                icon="i-lucide-chevron-right"
                :class="expandedFolders.has(row.id) ? 'rotate-90' : ''"
                square
                @click="toggleExpandFolder(row.id)"
              />
              <span v-else class="inline-block w-5" />

              <input
                type="radio"
                :value="row.id"
                v-model="folderOps.selectedFolderId"
                class="accent-primary"
              />

              <div
                :style="{ paddingLeft: `calc(${row.depth} * 0.75rem)` }"
                class="flex min-w-0 flex-1 items-center gap-2"
              >
                <span class="i-lucide-folder text-gray-500" />
                <template v-if="folderOps.renamingFolderId === row.id">
                  <input
                    v-model="folderOps.renameValue"
                    class="border-default bg-default flex-1 rounded border px-2 py-1"
                    @keydown.enter.prevent="folderOps.commitRenameFolder(row.id)"
                    @keydown.esc.prevent="folderOps.cancelRename()"
                    @blur="folderOps.commitRenameFolder(row.id)"
                    autofocus
                  />
                </template>
                <template v-else>
                  <span class="truncate">{{ row.name }}</span>
                </template>
              </div>

              <UDropdownMenu
                :items="[
                  [
                    {
                      label: 'Rename',
                      icon: 'i-lucide-pencil',
                      as: 'button',
                      onSelect: () => folderOps.startRenameFolder(row.id, row.name),
                    },
                  ],
                ]"
                :ui="{ content: 'z-50' }"
              >
                <UButton color="neutral" variant="ghost" icon="i-lucide-more-vertical" square />
              </UDropdownMenu>
            </div>
          </div>
        </div>
      </template>
      <template #footer="{ close }">
        <UButton color="neutral" variant="outline" @click="close">Cancel</UButton>
        <UButton
          :loading="moving || creating || deleting"
          :disabled="!folderOps.selectedFolderId"
          @click="folderOps.confirmMove(close)"
        >
          Confirm
        </UButton>
      </template>
    </UModal>

    <UModal
      v-model:open="containerActions.confirmStartStopOpen"
      title="Confirm actions"
      :ui="{ footer: 'justify-end', overlay: 'z-50', content: 'z-50' }"
    >
      <template #body>
        <div class="space-y-3">
          <div v-if="confirmToStop.length" class="space-y-1">
            <div class="text-sm font-medium">Will stop</div>
            <ul class="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300">
              <li v-for="item in confirmToStop" :key="item.name" class="truncate">{{ item.name }}</li>
            </ul>
          </div>
          <div v-if="confirmToStart.length" class="space-y-1">
            <div class="text-sm font-medium">Will start</div>
            <ul class="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300">
              <li v-for="item in confirmToStart" :key="item.name" class="truncate">{{ item.name }}</li>
            </ul>
          </div>
        </div>
      </template>
      <template #footer="{ close }">
        <UButton color="neutral" variant="outline" @click="close">Cancel</UButton>
        <UButton @click="containerActions.confirmStartStop(close)">Confirm</UButton>
      </template>
    </UModal>

    <UModal
      v-model:open="containerActions.confirmPauseResumeOpen"
      title="Confirm actions"
      :ui="{ footer: 'justify-end', overlay: 'z-50', content: 'z-50' }"
    >
      <template #body>
        <div class="space-y-3">
          <div v-if="confirmToPause.length" class="space-y-1">
            <div class="text-sm font-medium">Will pause</div>
            <ul class="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300">
              <li v-for="item in confirmToPause" :key="item.name" class="truncate">{{ item.name }}</li>
            </ul>
          </div>
          <div v-if="confirmToResume.length" class="space-y-1">
            <div class="text-sm font-medium">Will resume</div>
            <ul class="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300">
              <li v-for="item in confirmToResume" :key="item.name" class="truncate">{{ item.name }}</li>
            </ul>
          </div>
        </div>
      </template>
      <template #footer="{ close }">
        <UButton color="neutral" variant="outline" @click="close">Cancel</UButton>
        <UButton @click="containerActions.confirmPauseResume(close)">Confirm</UButton>
      </template>
    </UModal>

    <UModal
      v-model:open="removeContainerModalOpen"
      title="Remove container"
      :ui="{ footer: 'justify-end', overlay: 'z-50', content: 'z-50' }"
    >
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to remove
            <strong>{{ containerToRemove?.name }}</strong
            >?
          </p>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="removeWithImage" type="checkbox" class="accent-primary h-4 w-4 rounded" />
            <span>Also remove image</span>
          </label>
        </div>
      </template>
      <template #footer="{ close }">
        <UButton color="neutral" variant="outline" @click="close">Cancel</UButton>
        <UButton color="error" :loading="removingContainer" @click="confirmRemoveContainer(close)"
          >Remove</UButton
        >
      </template>
    </UModal>
  </div>
</template>
