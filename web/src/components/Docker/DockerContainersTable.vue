<script setup lang="ts">
import { computed, h, ref, resolveComponent } from 'vue';
import { useMutation } from '@vue/apollo-composable';

// removed unused Button import
import { GET_DOCKER_CONTAINERS } from '@/components/Docker/docker-containers.query';
import { CREATE_DOCKER_FOLDER } from '@/components/Docker/docker-create-folder.mutation';
import { DELETE_DOCKER_ENTRIES } from '@/components/Docker/docker-delete-entries.mutation';
import { MOVE_DOCKER_ENTRIES_TO_FOLDER } from '@/components/Docker/docker-move-entries.mutation';
import { SET_DOCKER_FOLDER_CHILDREN } from '@/components/Docker/docker-set-folder-children.mutation';
import { ContainerState } from '@/composables/gql/graphql';

import type {
  DockerContainer,
  ResolvedOrganizerEntry,
  ResolvedOrganizerFolder,
} from '@/composables/gql/graphql';
import type { TableColumn } from '@nuxt/ui';
import type { VNode } from 'vue';

interface Props {
  containers: DockerContainer[];
  organizerRoot?: ResolvedOrganizerFolder;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const UButton = resolveComponent('UButton');
const UCheckbox = resolveComponent('UCheckbox');
const UBadge = resolveComponent('UBadge');
const UInput = resolveComponent('UInput');
const UDropdownMenu = resolveComponent('UDropdownMenu');
const UContextMenu = resolveComponent('UContextMenu');
const UModal = resolveComponent('UModal');

function formatPorts(container?: DockerContainer | null): string {
  if (!container) return '';
  return container.ports
    .map((port) => {
      if (port.publicPort && port.privatePort) {
        return `${port.publicPort}:${port.privatePort}/${port.type}`;
      }
      if (port.privatePort) {
        return `${port.privatePort}/${port.type}`;
      }
      return '';
    })
    .filter(Boolean)
    .join(', ');
}

type TreeRow = {
  id: string;
  type: 'folder' | 'container';
  name: string;
  state?: string;
  ports?: string;
  autoStart?: string;
  updates?: string;
  children?: TreeRow[];
};

function toContainerTreeRow(meta: DockerContainer | null | undefined, fallbackName?: string): TreeRow {
  const name = meta?.names?.[0]?.replace(/^\//, '') || fallbackName || 'Unknown';
  const updatesParts: string[] = [];
  if (meta?.isUpdateAvailable) updatesParts.push('Update');
  if (meta?.isRebuildReady) updatesParts.push('Rebuild');
  return {
    id: meta?.id || name,
    type: 'container',
    name,
    state: meta?.state ?? '',
    ports: formatPorts(meta || undefined),
    autoStart: meta?.autoStart ? 'On' : 'Off',
    updates: updatesParts.join(' / ') || '—',
  };
}

function buildTree(entry: ResolvedOrganizerEntry): TreeRow | null {
  if (entry.__typename === 'ResolvedOrganizerFolder') {
    const folder = entry as ResolvedOrganizerFolder;
    return {
      id: folder.id,
      type: 'folder',
      name: folder.name,
      children: (folder.children || []).map((child) => buildTree(child)).filter(Boolean) as TreeRow[],
    };
  }
  if (entry.__typename === 'OrganizerContainerResource') {
    const meta = entry.meta as DockerContainer | null | undefined;
    const row = toContainerTreeRow(meta, entry.name || undefined);
    row.id = entry.id;
    return row;
  }
  return {
    id: entry.id as string,
    type: 'container',
    name: (entry as unknown as { name?: string }).name || 'Unknown',
    state: '',
    ports: '',
    autoStart: 'Off',
    updates: '—',
  };
}

const treeData = computed<TreeRow[]>(() => {
  if (props.organizerRoot) {
    const root = props.organizerRoot;
    return (root.children || []).map((child) => buildTree(child)).filter(Boolean) as TreeRow[];
  }
  return props.containers.map((container) => toContainerTreeRow(container));
});

type DropdownMenuItem = { label: string; icon: string; onSelect: (e?: Event) => void; as?: string };
type DropdownMenuItems = DropdownMenuItem[][];

function wrapCell(row: { original: TreeRow }, child: VNode) {
  const content = h('div', { 'data-row-id': row.original.id, class: 'block w-full h-full px-3 py-2' }, [
    child,
  ]);
  if ((row.original as TreeRow).type === 'container') {
    return h(
      UContextMenu,
      {
        items: getRowActionItems(row.original as TreeRow),
        size: 'md',
        ui: {
          content: 'overflow-x-hidden z-50',
          item: 'bg-transparent hover:bg-transparent focus:bg-transparent border-0 ring-0 outline-none shadow-none data-[state=checked]:bg-transparent',
        },
      },
      { default: () => content }
    );
  }
  return content;
}

const columns = computed<TableColumn<TreeRow>[]>(() => {
  const cols: TableColumn<TreeRow>[] = [
    {
      id: 'select',
      header: ({ table }) =>
        h(UCheckbox, {
          modelValue: table.getIsSomePageRowsSelected()
            ? 'indeterminate'
            : table.getIsAllPageRowsSelected(),
          'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
            table.toggleAllPageRowsSelected(!!value),
          'aria-label': 'Select all',
        }),
      cell: ({ row }) => {
        switch ((row.original as TreeRow).type) {
          case 'container':
            return wrapCell(
              row,
              h(UCheckbox, {
                modelValue: row.getIsSelected(),
                'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
                'aria-label': 'Select row',
              })
            );
          case 'folder':
            return wrapCell(
              row,
              h(UButton, {
                color: 'neutral',
                size: 'md',
                variant: 'ghost',
                icon: 'i-lucide-chevron-down',
                square: true,
                'aria-label': 'Expand',
                class: 'p-0',
                ui: {
                  leadingIcon: [
                    'transition-transform mt-0.5 -rotate-90',
                    row.getIsExpanded() ? 'duration-200 rotate-0' : '',
                  ],
                },
                onClick: () => row.toggleExpanded(),
              })
            );
          default:
            return h('span');
        }
      },
      enableSorting: false,
      enableHiding: false,
      meta: { class: { th: 'w-10', td: 'w-10' } },
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const depth = row.depth;
        const indent = h('span', { class: 'inline-block', style: { width: `calc(${depth} * 1rem)` } });
        const isFolder = (row.original as TreeRow).type === 'folder';
        const content = h(
          'div',
          { class: 'truncate flex items-center', 'data-row-id': row.original.id },
          [
            indent,
            h('span', { class: 'max-w-[40ch] truncate font-medium' }, row.original.name),
            isFolder ? h('span') : null,
          ]
        );
        return wrapCell(row, content);
      },
      meta: { class: { td: 'w-[40ch] truncate', th: 'w-[45ch]' } },
    },
    {
      accessorKey: 'state',
      header: 'State',
      cell: ({ row }) => {
        if (row.original.type === 'folder') return '';
        const state = row.original.state ?? '';
        const color = {
          [ContainerState.RUNNING]: 'success' as const,
          [ContainerState.EXITED]: 'neutral' as const,
        }[state];
        return wrapCell(
          row,
          h(
            UBadge,
            {
              color,
            },
            () => state
          )
        );
      },
    },
    {
      accessorKey: 'ports',
      header: 'Ports',
      cell: ({ row }) =>
        row.original.type === 'folder'
          ? ''
          : wrapCell(row, h('span', null, String(row.getValue('ports') || ''))),
    },
    {
      accessorKey: 'autoStart',
      header: 'Auto Start',
      cell: ({ row }) =>
        row.original.type === 'folder'
          ? ''
          : wrapCell(row, h('span', null, String(row.getValue('autoStart') || ''))),
    },
    {
      accessorKey: 'updates',
      header: 'Updates',
      cell: ({ row }) =>
        row.original.type === 'folder'
          ? ''
          : wrapCell(row, h('span', null, String(row.getValue('updates') || ''))),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        if ((row.original as TreeRow).type === 'folder') return '';
        const items = getRowActionItems(row.original as TreeRow);
        return wrapCell(
          row,
          h(
            UDropdownMenu,
            {
              items,
              size: 'md',
              ui: {
                content: 'overflow-x-hidden z-50',
                item: 'bg-transparent hover:bg-transparent focus:bg-transparent border-0 ring-0 outline-none shadow-none data-[state=checked]:bg-transparent',
              },
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
          )
        );
      },
      enableSorting: false,
      enableHiding: false,
      meta: { class: { th: 'w-8', td: 'w-8 text-right' } },
    },
  ];
  return cols;
});

const rowSelection = ref<Record<string, boolean>>({});
type NuxtUITableRef = { table?: { getSelectedRowModel: () => { rows: unknown[] } } } | null;
const tableRef = ref<NuxtUITableRef>(null);
const selectedCount = computed<number>(() => {
  return Object.values(rowSelection.value).filter(Boolean).length;
});

const globalFilter = ref('');

const emit = defineEmits<{
  (e: 'created-folder'): void;
}>();

const { mutate: createFolderMutation, loading: creating } = useMutation(CREATE_DOCKER_FOLDER);
const { mutate: moveEntriesMutation, loading: moving } = useMutation(MOVE_DOCKER_ENTRIES_TO_FOLDER);
const { mutate: deleteEntriesMutation, loading: deleting } = useMutation(DELETE_DOCKER_ENTRIES);
const { mutate: setFolderChildrenMutation } = useMutation(SET_DOCKER_FOLDER_CHILDREN);

const moveOpen = ref(false);
const selectedFolderId = ref<string>('');
const pendingMoveSourceIds = ref<string[]>([]);
const expandedFolders = ref<Set<string>>(new Set());
const renamingFolderId = ref<string>('');
const renameValue = ref<string>('');
const newTreeFolderName = ref<string>('');

const rootFolderId = computed<string>(() => props.organizerRoot?.id || '');

type FolderNode = { id: string; name: string; children: FolderNode[] };

function buildFolderOnlyTree(entry?: ResolvedOrganizerFolder | null): FolderNode | null {
  if (!entry) return null;
  const folders: FolderNode[] = [];
  for (const child of entry.children || []) {
    if ((child as ResolvedOrganizerEntry).__typename === 'ResolvedOrganizerFolder') {
      const sub = buildFolderOnlyTree(child as ResolvedOrganizerFolder);
      if (sub) folders.push(sub);
    }
  }
  return { id: entry.id, name: entry.name, children: folders };
}

const folderTree = computed<FolderNode | null>(() => buildFolderOnlyTree(props.organizerRoot));

type FlatFolderRow = { id: string; name: string; depth: number; hasChildren: boolean };

function flattenVisibleFolders(
  node: FolderNode | null,
  depth = 0,
  out: FlatFolderRow[] = []
): FlatFolderRow[] {
  if (!node) return out;
  out.push({ id: node.id, name: node.name, depth, hasChildren: node.children.length > 0 });
  if (expandedFolders.value.has(node.id)) {
    for (const child of node.children) flattenVisibleFolders(child, depth + 1, out);
  }
  return out;
}

const visibleFolders = computed<FlatFolderRow[]>(() => flattenVisibleFolders(folderTree.value));

const parentById = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {};
  function walk(node?: ResolvedOrganizerFolder | null, parentId?: string) {
    if (!node) return;
    if (parentId) map[node.id] = parentId;
    for (const child of node.children || []) {
      if ((child as ResolvedOrganizerEntry).__typename === 'ResolvedOrganizerFolder') {
        walk(child as ResolvedOrganizerFolder, node.id);
      }
    }
  }
  walk(props.organizerRoot, undefined);
  return map;
});

const folderChildrenIds = computed<Record<string, string[]>>(() => {
  const map: Record<string, string[]> = {};
  function walk(node?: ResolvedOrganizerFolder | null) {
    if (!node) return;
    map[node.id] = (node.children || []).map((c) => {
      const entry = c as ResolvedOrganizerEntry;
      return (entry as { id: string }).id;
    });
    for (const child of node.children || []) {
      if ((child as ResolvedOrganizerEntry).__typename === 'ResolvedOrganizerFolder') {
        walk(child as ResolvedOrganizerFolder);
      }
    }
  }
  walk(props.organizerRoot);
  return map;
});

function getSelectedEntryIds(): string[] {
  return Object.entries(rowSelection.value)
    .filter(([, selected]) => !!selected)
    .map(([id]) => id);
}

function openMoveModal(ids?: string[]) {
  const sources = ids ?? getSelectedEntryIds();
  console.log('sources', sources);
  if (sources.length === 0) return;
  pendingMoveSourceIds.value = sources;
  selectedFolderId.value = rootFolderId.value || '';
  expandedFolders.value = new Set([rootFolderId.value]);
  renamingFolderId.value = '';
  renameValue.value = '';
  newTreeFolderName.value = '';
  moveOpen.value = true;
}

async function confirmMove(close: () => void) {
  const ids = pendingMoveSourceIds.value;
  if (ids.length === 0) return;
  if (!selectedFolderId.value) return;
  await moveEntriesMutation(
    { destinationFolderId: selectedFolderId.value, sourceEntryIds: ids },
    {
      refetchQueries: [{ query: GET_DOCKER_CONTAINERS, variables: { skipCache: true } }],
      awaitRefetchQueries: true,
    }
  );
  rowSelection.value = {};
  showToast('Moved to folder');
  close();
}

async function handleCreateFolderInTree() {
  const name = newTreeFolderName.value.trim();
  if (!name) return;
  await createFolderMutation(
    {
      name,
      parentId: selectedFolderId.value || rootFolderId.value,
      childrenIds: pendingMoveSourceIds.value,
    },
    {
      refetchQueries: [{ query: GET_DOCKER_CONTAINERS, variables: { skipCache: true } }],
      awaitRefetchQueries: true,
    }
  );
  emit('created-folder');
  showToast('Folder created');
  newTreeFolderName.value = '';
  expandedFolders.value.add(selectedFolderId.value || rootFolderId.value);
}

function startRenameFolder(id: string, currentName: string) {
  if (!id || id === rootFolderId.value) return;
  renamingFolderId.value = id;
  renameValue.value = currentName;
}

async function commitRenameFolder(id: string) {
  const newName = renameValue.value.trim();
  if (!id || !newName || newName === id) {
    renamingFolderId.value = '';
    renameValue.value = '';
    return;
  }
  const parentId = parentById.value[id] || rootFolderId.value;
  const children = folderChildrenIds.value[id] || [];
  // 1) Create new folder with same children under same parent
  await createFolderMutation(
    { name: newName, parentId, childrenIds: children },
    { awaitRefetchQueries: true }
  );
  // 2) Clear old folder children to avoid cascading deletion of descendants
  await setFolderChildrenMutation({ folderId: id, childrenIds: [] }, { awaitRefetchQueries: true });
  // 3) Delete the now-empty old folder
  await deleteEntriesMutation(
    { entryIds: [id] },
    {
      refetchQueries: [{ query: GET_DOCKER_CONTAINERS, variables: { skipCache: true } }],
      awaitRefetchQueries: true,
    }
  );
  renamingFolderId.value = '';
  renameValue.value = '';
  selectedFolderId.value = newName;
  showToast('Folder renamed');
}

async function handleDeleteFolder() {
  const id = selectedFolderId.value;
  if (!id || id === rootFolderId.value) return;
  if (!confirm('Delete this folder? Contents will move to root.')) return;
  await deleteEntriesMutation(
    { entryIds: [id] },
    {
      refetchQueries: [{ query: GET_DOCKER_CONTAINERS, variables: { skipCache: true } }],
      awaitRefetchQueries: true,
    }
  );
  selectedFolderId.value = rootFolderId.value;
  showToast('Folder deleted');
}

function toggleExpandFolder(id: string) {
  const set = new Set(expandedFolders.value);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  expandedFolders.value = set;
}

// removed unused handleCreateFolder; creation handled in modal

function getSelectedContainerIds(): string[] {
  const collected = new Set<string>();

  function collectContainers(row: TreeRow, includeAll: boolean): void {
    const isSelected = !!rowSelection.value[row.id];
    const shouldInclude = includeAll || isSelected;

    if (row.type === 'container') {
      if (shouldInclude) collected.add(row.id);
      return;
    }
    // folder
    const children = row.children || [];
    const propagate = shouldInclude; // selecting a folder selects all descendants
    for (const child of children) collectContainers(child as TreeRow, propagate);
  }

  for (const root of treeData.value) collectContainers(root, false);
  return Array.from(collected);
}

declare global {
  interface Window {
    toast?: {
      success: (title: string, options?: { description?: string }) => void;
      error?: (title: string, options?: { description?: string }) => void;
    };
  }
}

function showToast(message: string) {
  window.toast?.success(message);
}

function handleBulkAction(action: string) {
  const ids = getSelectedContainerIds();
  if (ids.length === 0) return;
  showToast(`${action} (${ids.length})`);
}

// helper removed; no longer used

// removed unused types
// ContextRef type removed; no longer used

// no-op: replaced by row-wrapped UContextMenu

// Removed programmatic context menu open logic in favor of wrapping row with UContextMenu

function handleRowAction(row: TreeRow, action: string) {
  if (row.type !== 'container') return;
  showToast(`${action}: ${row.name}`);
}

const bulkItems = computed<DropdownMenuItems>(() => [
  [
    {
      label: 'Move to folder',
      icon: 'i-lucide-folder',
      as: 'button',
      onSelect: () => openMoveModal(),
    },
    {
      label: 'Start / Stop',
      icon: 'i-lucide-power',
      as: 'button',
      onSelect: () => handleBulkAction('Start / Stop'),
    },
    {
      label: 'Pause / Resume',
      icon: 'i-lucide-pause',
      as: 'button',
      onSelect: () => handleBulkAction('Pause / Resume'),
    },
  ],
]);

function getRowActionItems(row: TreeRow): DropdownMenuItems {
  return [
    [
      {
        label: 'Move to folder',
        icon: 'i-lucide-folder',
        as: 'button',
        onSelect: () => openMoveModal([row.id]),
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
    <div class="mb-3 flex items-center gap-2">
      <UInput v-model="globalFilter" class="max-w-sm min-w-[12ch]" placeholder="Filter..." />
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
          size="md"
          trailing-icon="i-lucide-chevron-down"
          :disabled="selectedCount === 0"
        >
          Actions ({{ selectedCount }})
        </UButton>
      </UDropdownMenu>
    </div>
    <UTable
      ref="tableRef"
      v-model:row-selection="rowSelection"
      v-model:global-filter="globalFilter"
      :data="treeData"
      :columns="columns"
      :get-sub-rows="(row: any) => row.children"
      :column-filters-options="{ filterFromLeafRows: true }"
      :loading="loading"
      :ui="{ td: 'p-0 empty:p-0' }"
      sticky
      class="flex-1"
    />
    <div v-if="!loading && treeData.length === 0" class="py-8 text-center text-gray-500">
      No containers found
    </div>

    <UModal
      v-model:open="moveOpen"
      title="Move to folder"
      :ui="{ footer: 'justify-end', overlay: 'z-50', content: 'z-50' }"
    >
      <template #body>
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <UInput v-model="newTreeFolderName" placeholder="New folder name" class="flex-1" />
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              :disabled="!newTreeFolderName.trim()"
              @click="handleCreateFolderInTree"
              >Create</UButton
            >
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              :disabled="!selectedFolderId || selectedFolderId === rootFolderId"
              @click="handleDeleteFolder"
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

              <input type="radio" :value="row.id" v-model="selectedFolderId" class="accent-primary" />

              <div
                :style="{ paddingLeft: `calc(${row.depth} * 0.75rem)` }"
                class="flex min-w-0 flex-1 items-center gap-2"
              >
                <span class="i-lucide-folder text-gray-500" />
                <template v-if="renamingFolderId === row.id">
                  <input
                    v-model="renameValue"
                    class="border-default bg-default flex-1 rounded border px-2 py-1"
                    @keydown.enter.prevent="commitRenameFolder(row.id)"
                    @keydown.esc.prevent="
                      renamingFolderId = '';
                      renameValue = '';
                    "
                    @blur="commitRenameFolder(row.id)"
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
                      onSelect: () => startRenameFolder(row.id, row.name),
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
          :disabled="!selectedFolderId"
          @click="confirmMove(close)"
        >
          Confirm
        </UButton>
      </template>
    </UModal>
  </div>
</template>
