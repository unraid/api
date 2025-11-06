<script setup lang="ts">
import { computed, h, nextTick, ref, resolveComponent, watch } from 'vue';
import { useMutation } from '@vue/apollo-composable';

import BaseTreeTable from '@/components/Common/BaseTreeTable.vue';
import { GET_DOCKER_CONTAINERS } from '@/components/Docker/docker-containers.query';
import { CREATE_DOCKER_FOLDER_WITH_ITEMS } from '@/components/Docker/docker-create-folder-with-items.mutation';
import { CREATE_DOCKER_FOLDER } from '@/components/Docker/docker-create-folder.mutation';
import { DELETE_DOCKER_ENTRIES } from '@/components/Docker/docker-delete-entries.mutation';
import { MOVE_DOCKER_ENTRIES_TO_FOLDER } from '@/components/Docker/docker-move-entries.mutation';
import { MOVE_DOCKER_ITEMS_TO_POSITION } from '@/components/Docker/docker-move-items-to-position.mutation';
import { PAUSE_DOCKER_CONTAINER } from '@/components/Docker/docker-pause-container.mutation';
import { REFRESH_DOCKER_DIGESTS } from '@/components/Docker/docker-refresh-digests.mutation';
import { SET_DOCKER_FOLDER_CHILDREN } from '@/components/Docker/docker-set-folder-children.mutation';
import { START_DOCKER_CONTAINER } from '@/components/Docker/docker-start-container.mutation';
import { STOP_DOCKER_CONTAINER } from '@/components/Docker/docker-stop-container.mutation';
import { UNPAUSE_DOCKER_CONTAINER } from '@/components/Docker/docker-unpause-container.mutation';
import { UPDATE_DOCKER_CONTAINERS } from '@/components/Docker/docker-update-containers.mutation';
import { ContainerState } from '@/composables/gql/graphql';
import { useContainerActions } from '@/composables/useContainerActions';
import { useDockerViewPreferences } from '@/composables/useDockerColumnVisibility';
import { useDockerEditNavigation } from '@/composables/useDockerEditNavigation';
import { useFolderOperations } from '@/composables/useFolderOperations';
import { useFolderTree } from '@/composables/useFolderTree';
import { usePersistentColumnVisibility } from '@/composables/usePersistentColumnVisibility';
import { useTreeData } from '@/composables/useTreeData';

import type { DockerContainer, FlatOrganizerEntry } from '@/composables/gql/graphql';
import type { DropEvent } from '@/composables/useDragDrop';
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
const UPopover = resolveComponent('UPopover');
const rowActionDropdownUi = {
  content: 'overflow-x-hidden z-50',
  item: 'bg-transparent hover:bg-transparent focus:bg-transparent border-0 ring-0 outline-none shadow-none data-[state=checked]:bg-transparent',
};

const emit = defineEmits<{
  (e: 'created-folder'): void;
  (
    e: 'row:click',
    payload: { id: string; type: 'container' | 'folder'; name: string; containerId?: string }
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

function formatExternalPorts(container?: DockerContainer | null): string {
  if (!container) return '';
  return container.ports
    .filter((port) => port.publicPort)
    .map((port) => {
      if (port.publicPort && port.privatePort) {
        return `${port.publicPort}:${port.privatePort}/${port.type}`;
      }
      return '';
    })
    .filter(Boolean)
    .join(', ');
}

function formatInternalPorts(container?: DockerContainer | null): string {
  if (!container) return '';
  return container.ports
    .map((port) => {
      if (port.privatePort) {
        return `${port.privatePort}/${port.type}`;
      }
      return '';
    })
    .filter(Boolean)
    .join(', ');
}

function formatImage(container?: DockerContainer | null): string {
  if (!container?.image) return '';
  const parts = container.image.split(':');
  return parts.length > 1 ? parts[parts.length - 1] : 'latest';
}

function formatNetwork(container?: DockerContainer | null): string {
  if (!container) return '';
  return container.hostConfig?.networkMode || '';
}

function formatContainerIp(container?: DockerContainer | null): string {
  if (!container?.networkSettings) return '';
  try {
    const settings = container.networkSettings as Record<string, unknown>;
    if (settings.Networks && typeof settings.Networks === 'object') {
      const networks = Object.values(settings.Networks as Record<string, unknown>);
      const ips = networks.map((net) => (net as Record<string, unknown>).IPAddress).filter(Boolean);
      return ips.join(', ');
    }
    if (settings.IPAddress && typeof settings.IPAddress === 'string') {
      return settings.IPAddress;
    }
  } catch (e) {
    return '';
  }
  return '';
}

function formatVolumes(container?: DockerContainer | null): string {
  if (!container?.mounts) return '';
  try {
    const mounts = container.mounts as unknown[];
    return mounts
      .map((mount) => {
        const m = mount as Record<string, unknown>;
        if (m.Type === 'bind' && m.Source && m.Destination) {
          return `${m.Source} → ${m.Destination}`;
        }
        if (m.Type === 'volume' && m.Name && m.Destination) {
          return `${m.Name} → ${m.Destination}`;
        }
        return '';
      })
      .filter(Boolean)
      .join(', ');
  } catch (e) {
    return '';
  }
}

function formatUptime(container?: DockerContainer | null): string {
  if (!container?.status) return '';
  const match = container.status.match(/Up\s+(.+?)(?:\s+\(|$)/i);
  return match ? match[1] : '';
}

function toContainerTreeRow(
  meta: DockerContainer | null | undefined,
  fallbackName?: string
): TreeRow<DockerContainer> {
  const name = meta?.names?.[0]?.replace(/^\//, '') || fallbackName || 'Unknown';
  const updatesParts: string[] = [];
  if (meta?.isUpdateAvailable) updatesParts.push('Update');
  if (meta?.isRebuildReady) updatesParts.push('Rebuild');
  return {
    id: meta?.id || name,
    type: 'container',
    name,
    state: meta?.state ?? '',
    version: formatImage(meta || undefined),
    network: formatNetwork(meta || undefined),
    containerIp: formatContainerIp(meta || undefined),
    containerPort: formatInternalPorts(meta || undefined),
    lanPort: formatExternalPorts(meta || undefined),
    volumes: formatVolumes(meta || undefined),
    autoStart: meta?.autoStart ? 'On' : 'Off',
    updates: updatesParts.join(' / ') || '—',
    uptime: formatUptime(meta || undefined),
    containerId: meta?.id,
    meta: meta || undefined,
  };
}

const flatEntriesRef = computed(() => props.flatEntries);
const containersRef = computed(() => props.containers);

const rootFolderId = computed<string>(() => props.rootFolderId || 'root');

const baseTableRef = ref<ColumnVisibilityTableInstance | null>(null);

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

const { treeData, entryParentById, folderChildrenIds, parentById, positionById, getRowById } =
  useTreeData<DockerContainer>({
    flatEntries: flatEntriesRef,
    flatData: containersRef,
    buildFlatRow: toContainerTreeRow,
  });

const { visibleFolders, expandedFolders, toggleExpandFolder, setExpandedFolders } = useFolderTree({
  flatEntries: flatEntriesRef,
});
const busyRowIds = ref<Set<string>>(new Set());
const updatePopoverRowId = ref<string | null>(null);
const updatingRowIds = ref<Set<string>>(new Set());
const isUpdatingContainers = computed(() => updatingRowIds.value.size > 0);
const activeUpdateSummary = computed(() => {
  if (!updatingRowIds.value.size) return '';
  const names: string[] = [];
  for (const id of updatingRowIds.value) {
    const row = getRowById(id, treeData.value);
    if (row && row.type === 'container') {
      names.push(row.name);
    }
  }
  if (!names.length) return '';
  if (names.length <= 3) return names.join(', ');
  const summary = names.slice(0, 3).join(', ');
  return `${summary}, +${names.length - 3} more`;
});

const { mergeServerPreferences, saveColumnVisibility, columnVisibilityRef } = useDockerViewPreferences();

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
      cell: ({ row }) => {
        const treeRow = row.original as TreeRow<DockerContainer>;
        const depth = row.depth;
        const indent = h('span', { class: 'inline-block', style: { width: `calc(${depth} * 1rem)` } });
        const isRowUpdating = updatingRowIds.value.has(treeRow.id);

        const iconElement = row.original.icon
          ? h('img', {
              src: row.original.icon,
              class: 'w-5 h-5 mr-2 flex-shrink-0',
              alt: '',
              onError: (e: Event) => {
                (e.target as HTMLImageElement).style.display = 'none';
              },
            })
          : h(UIcon, {
              name: row.original.type === 'folder' ? 'i-lucide-folder' : 'i-lucide-box',
              class: 'w-5 h-5 mr-2 flex-shrink-0 text-gray-500',
            });

        const hasUpdate =
          row.original.type === 'container' &&
          (treeRow.meta?.isUpdateAvailable || treeRow.meta?.isRebuildReady);

        const updateBadge = hasUpdate
          ? h(
              UPopover,
              {
                'data-stop-row-click': 'true',
                open: updatePopoverRowId.value === treeRow.id,
                'onUpdate:open': (value: boolean) => {
                  updatePopoverRowId.value = value ? treeRow.id : null;
                },
              },
              {
                default: () =>
                  h(
                    UBadge,
                    {
                      color: 'warning',
                      variant: 'subtle',
                      size: 'sm',
                      class: [
                        'ml-2 cursor-pointer',
                        isRowUpdating ? 'pointer-events-none opacity-60' : '',
                      ],
                      'data-stop-row-click': 'true',
                    },
                    () => 'Update'
                  ),
                content: () =>
                  h('div', { class: 'p-3 space-y-3' }, [
                    h(
                      'p',
                      { class: 'text-sm' },
                      row.original.meta?.isUpdateAvailable
                        ? 'Update available. Update container?'
                        : 'Rebuild ready. Update container?'
                    ),
                    h('div', { class: 'flex gap-2 justify-end' }, [
                      h(
                        UButton,
                        {
                          color: 'neutral',
                          variant: 'outline',
                          size: 'sm',
                          onClick: (e: Event) => {
                            e.stopPropagation();
                            updatePopoverRowId.value = null;
                          },
                        },
                        () => 'Cancel'
                      ),
                      h(
                        UButton,
                        {
                          size: 'sm',
                          loading: isRowUpdating,
                          disabled: isRowUpdating,
                          onClick: async (e: Event) => {
                            e.stopPropagation();
                            if (isRowUpdating) return;
                            updatePopoverRowId.value = null;
                            await handleUpdateContainer(treeRow);
                          },
                        },
                        () => 'Confirm'
                      ),
                    ]),
                  ]),
              }
            )
          : null;

        const updateSpinner = isRowUpdating
          ? h(UIcon, {
              name: 'i-lucide-loader-2',
              class: 'ml-2 h-4 w-4 animate-spin text-primary-500',
            })
          : null;

        return h('div', { class: 'truncate flex items-center', 'data-row-id': treeRow.id }, [
          indent,
          iconElement,
          h('span', { class: 'max-w-[40ch] truncate font-medium' }, treeRow.name),
          updateBadge,
          updateSpinner,
        ]);
      },
      meta: { class: { td: 'w-[40ch] truncate', th: 'w-[45ch]' } },
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
      accessorKey: 'version',
      header: 'Version',
      cell: ({ row }) =>
        row.original.type === 'folder' ? '' : h('span', null, String(row.getValue('version') || '')),
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
      cell: ({ row }) =>
        row.original.type === 'folder' ? '' : h('span', null, String(row.getValue('containerIp') || '')),
    },
    {
      accessorKey: 'containerPort',
      header: 'Container Port',
      cell: ({ row }) =>
        row.original.type === 'folder'
          ? ''
          : h('span', null, String(row.getValue('containerPort') || '')),
    },
    {
      accessorKey: 'lanPort',
      header: 'LAN IP:Port',
      cell: ({ row }) =>
        row.original.type === 'folder' ? '' : h('span', null, String(row.getValue('lanPort') || '')),
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
      meta: { class: { th: 'w-8', td: 'w-8 text-right' } },
    },
  ];
  return cols;
});

function getDefaultColumnVisibility(isCompact: boolean): Record<string, boolean> {
  if (isCompact) {
    return {
      state: false,
      version: false,
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
      version: false,
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
};
type DropdownMenuItems = ActionDropdownItem[][];

const contextMenuState = ref<{
  open: boolean;
  x: number;
  y: number;
  items: DropdownMenuItems;
  rowId: string | null;
}>({
  open: false,
  x: 0,
  y: 0,
  items: [] as DropdownMenuItems,
  rowId: null,
});

const contextMenuPopper = {
  strategy: 'fixed' as const,
  placement: 'bottom-start' as const,
  offset: 4,
};

const columnsMenuItems = computed<DropdownMenuItems>(() => {
  if (!baseTableRef.value?.tableApi) return [[]];

  const availableColumns = baseTableRef.value.tableApi
    .getAllColumns()
    .filter((column) => column.getCanHide());

  const list = availableColumns.map((column) => {
    return {
      label: column.id,
      type: 'checkbox' as const,
      checked: column.getIsVisible(),
      onUpdateChecked(checked: boolean) {
        baseTableRef.value?.tableApi?.getColumn?.(column.id)?.toggleVisibility(!!checked);
        void persistCurrentColumnVisibility();
      },
      onSelect(e: Event) {
        e.preventDefault();
      },
    } as ActionDropdownItem & {
      type: 'checkbox';
      checked: boolean;
      onUpdateChecked: (v: boolean) => void;
    };
  });

  return [list];
});

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
const { mutate: updateContainersMutation } = useMutation(UPDATE_DOCKER_CONTAINERS);
const { mutate: refreshDockerDigestsMutation, loading: checkingForUpdates } =
  useMutation(REFRESH_DOCKER_DIGESTS);

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

const selectedContainerRows = computed(() => getContainerRows(props.selectedIds));
const hasSelectedContainers = computed(() => selectedContainerRows.value.length > 0);
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
    window.toast?.error?.('Failed to check for updates', {
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
    window.toast?.error?.(`Failed to update ${row.name}`, {
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
    window.toast?.error?.('Failed to update containers', {
      description: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    setRowsBusy(entryIds, false);
    setRowsUpdating(rows, false);
  }
}

const folderOps = useFolderOperations({
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
});

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
});

const canCreateFolder = computed(() => (folderOps.newTreeFolderName.value || '').trim().length > 0);
const canDeleteFolder = computed(
  () => folderOps.selectedFolderId.value && folderOps.selectedFolderId.value !== rootFolderId.value
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
  const targetPosition = positionById.value[target.id] ?? 0;
  const position = area === 'before' ? targetPosition : targetPosition + 1;

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
  if (action === 'Check for updates') {
    const containerRows = getContainerRows(ids);
    if (!containerRows.length) return;
    void handleCheckForUpdates(containerRows);
    return;
  }
  showToast(`${action} (${ids.length})`);
}

const { navigateToEditPage } = useDockerEditNavigation();

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
  if (action === 'Manage Settings') {
    const container = row.meta as DockerContainer | undefined;
    if (navigateToEditPage(container)) {
      return;
    }
  }
  showToast(`${action}: ${row.name}`);
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

  contextMenuState.value = {
    open: false,
    x: payload.event.clientX,
    y: payload.event.clientY,
    items,
    rowId: row.id,
  };

  await nextTick();
  if (contextMenuState.value.rowId === row.id) {
    contextMenuState.value.open = true;
  }
}

const bulkItems = computed<DropdownMenuItems>(() => [
  [
    {
      label: 'Move to folder',
      icon: 'i-lucide-folder',
      as: 'button',
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
      label: 'Check for updates',
      icon: 'i-lucide-refresh-cw',
      as: 'button',
      disabled: checkingForUpdates.value || !hasSelectedContainers.value,
      onSelect: () => handleBulkAction('Check for updates'),
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
  if (row.type === 'folder') {
    return [
      [
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
      ],
    ];
  }
  return [
    [
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
    ],
    [
      {
        label: 'Manage Settings',
        icon: 'i-lucide-settings',
        as: 'button',
        onSelect: () => handleRowAction(row, 'Manage Settings'),
      },
    ],
  ];
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
      :searchable-keys="searchableKeys"
      :search-accessor="dockerSearchAccessor"
      @row:click="
        (payload) =>
          emit('row:click', {
            id: payload.id,
            type: payload.type as 'container' | 'folder',
            name: payload.name,
            containerId: payload.meta?.id,
          })
      "
      @row:contextmenu="handleRowContextMenu"
      @row:select="
        (payload) =>
          emit('row:select', {
            id: payload.id,
            type: payload.type as 'container' | 'folder',
            name: payload.name,
            containerId: payload.meta?.id,
            selected: payload.selected,
          })
      "
      @row:drop="handleDropOnRow"
      @update:selected-ids="(ids) => emit('update:selectedIds', ids)"
    >
      <template #toolbar="{ selectedCount: count, globalFilter: filterText, setGlobalFilter }">
        <div :class="['flex flex-wrap items-center gap-2', compact ? 'mb-2 px-2 pt-2' : 'mb-3']">
          <UInput
            :model-value="filterText"
            :size="compact ? 'sm' : 'md'"
            :class="['max-w-sm flex-1', compact ? 'min-w-[8ch]' : 'min-w-[12ch]']"
            placeholder="Filter..."
            @update:model-value="setGlobalFilter"
          />
          <UDropdownMenu v-if="!compact" :items="columnsMenuItems" size="md" :ui="{ content: 'z-40' }">
            <UButton color="neutral" variant="outline" size="md" trailing-icon="i-lucide-chevron-down">
              Columns
            </UButton>
          </UDropdownMenu>
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
              :disabled="count === 0"
            >
              Actions ({{ count }})
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
      v-model:open="contextMenuState.open"
      :items="contextMenuState.items"
      size="md"
      :popper="contextMenuPopper"
      :ui="rowActionDropdownUi"
    >
      <div
        class="fixed h-px w-px"
        :style="{ top: `${contextMenuState.y}px`, left: `${contextMenuState.x}px` }"
      />
    </UDropdownMenu>

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
                <!-- @vue-expect-error - Vue auto-unwraps refs in templates -->
                <template v-if="folderOps.renamingFolderId === row.id">
                  <input
                    v-model="folderOps.renameValue"
                    class="border-default bg-default flex-1 rounded border px-2 py-1"
                    @keydown.enter.prevent="folderOps.commitRenameFolder(row.id)"
                    @keydown.esc.prevent="
                      () => {
                        folderOps.renamingFolderId = '';
                        folderOps.renameValue = '';
                      }
                    "
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
  </div>
</template>
