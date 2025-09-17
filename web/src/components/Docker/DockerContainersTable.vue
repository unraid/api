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
const UDropdownMenu = resolveComponent('UDropdownMenu');

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
            return h(UCheckbox, {
              modelValue: row.getIsSelected(),
              'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
              'aria-label': 'Select row',
            });
          case 'folder':
            return h(UButton, {
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
            });
          default:
            return h('span');
        }
      },
      enableSorting: false,
      enableHiding: false,
      meta: { class: { th: 'w-10', td: 'w-10' } },
    },
    {
      id: 'title',
      header: 'Name',
      cell: ({ row }) => {
        const depth = row.depth;
        const indent = h('span', { class: 'inline-block', style: { width: `calc(${depth} * 1rem)` } });
        const isFolder = (row.original as TreeRow).type === 'folder';
        return h('div', { class: 'truncate flex items-center' }, [
          indent,
          h('span', { class: 'max-w-[40ch] truncate font-medium' }, row.original.name),
          isFolder ? h('span') : null,
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
        const color = {
          [ContainerState.RUNNING]: 'success' as const,
          [ContainerState.EXITED]: 'neutral' as const,
        }[state];
        return h(
          UBadge,
          {
            color,
          },
          () => state
        );
      },
    },
    {
      accessorKey: 'ports',
      header: 'Ports',
      cell: ({ row }) => (row.original.type === 'folder' ? '' : String(row.getValue('ports') || '')),
    },
    {
      accessorKey: 'autoStart',
      header: 'Auto Start',
      cell: ({ row }) => (row.original.type === 'folder' ? '' : String(row.getValue('autoStart') || '')),
    },
    {
      accessorKey: 'updates',
      header: 'Updates',
      cell: ({ row }) => (row.original.type === 'folder' ? '' : String(row.getValue('updates') || '')),
    },
  ];
  return cols;
});

const rowSelection = ref<Record<string, boolean>>({});
const selectedCount = computed<number>(() => {
  const containerIds: string[] = treeData.value
    .flatMap(function collect(row): TreeRow[] {
      if (row.type === 'container') return [row];
      return (row.children || []).flatMap(collect);
    })
    .map((r) => r.id);
  return containerIds.filter((id) => !!rowSelection.value[id]).length;
});

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
</script>

<template>
  <div class="w-full">
    <div class="mb-3 flex items-center gap-2">
      <Button size="sm" :disabled="selectedCount === 0 || creating" @click="handleCreateFolder">
        Create folder ({{ selectedCount }})
      </Button>
    </div>
    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      :data="treeData"
      :columns="columns"
      :get-sub-rows="(row: any) => row.children"
      :loading="loading"
      :ui="{ td: 'empty:p-0' }"
      sticky
      class="flex-1"
    />
    <div v-if="!loading && treeData.length === 0" class="py-8 text-center text-gray-500">
      No containers found
    </div>
  </div>
</template>
