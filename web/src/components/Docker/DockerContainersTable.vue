<script setup lang="ts">
import { computed, h, ref, resolveComponent } from 'vue';
import { useMutation } from '@vue/apollo-composable';

import { Button } from '@unraid/ui';
import { GET_DOCKER_CONTAINERS } from '@/components/Docker/docker-containers.query';
import { CREATE_DOCKER_FOLDER } from '@/components/Docker/docker-create-folder.mutation';
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
                content: 'overflow-x-hidden z-10',
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

async function handleCreateFolder() {
  const name = window.prompt('New folder name');
  if (!name) return;
  const childrenIds = treeData.value
    .flatMap(function collect(row): TreeRow[] {
      if (row.type === 'container') return [row];
      return (row.children || []).flatMap(collect);
    })
    .filter((r) => rowSelection.value[r.id])
    .map((r) => r.id);
  if (childrenIds.length === 0) return;
  await createFolderMutation(
    { name, childrenIds },
    {
      refetchQueries: [{ query: GET_DOCKER_CONTAINERS, variables: { skipCache: true } }],
      awaitRefetchQueries: true,
    }
  );
  rowSelection.value = {};
  emit('created-folder');
}

function getSelectedContainerIds(): string[] {
  return treeData.value
    .flatMap(function collect(row): TreeRow[] {
      if (row.type === 'container') return [row];
      return (row.children || []).flatMap(collect);
    })
    .filter((r) => rowSelection.value[r.id])
    .map((r) => r.id);
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
      onSelect: () => handleBulkAction('Move to folder'),
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
        onSelect: () => handleRowAction(row, 'Move to folder'),
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
          content: 'overflow-x-hidden z-10',
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
  </div>
</template>
