import { computed, h, resolveComponent } from 'vue';

import MultiValueCopyBadges from '@/components/Common/MultiValueCopyBadges.vue';
import DockerContainerStatCell from '@/components/Docker/DockerContainerStatCell.vue';
import DockerNameCell from '@/components/Docker/DockerNameCell.vue';
import DockerTailscaleIndicator from '@/components/Docker/DockerTailscaleIndicator.vue';
import { ContainerState } from '@/composables/gql/graphql';
import { normalizeMultiValue } from '@/utils/docker';

import type { DockerContainer, DockerContainerStats } from '@/composables/gql/graphql';
import type { TreeRow } from '@/composables/useTreeData';
import type { TableColumn } from '@nuxt/ui';
import type { Component, Ref } from 'vue';

type MultiValueKey = 'containerIp' | 'containerPort' | 'lanPort' | 'volumes';

const MULTI_VALUE_LABELS: Record<MultiValueKey, string> = {
  containerIp: 'Container IP',
  containerPort: 'Container port',
  lanPort: 'LAN IP:Port',
  volumes: 'Volume mapping',
};

const MULTI_VALUE_INLINE_LIMIT = 1;

export interface DockerTableColumnsOptions {
  compact: Ref<boolean>;
  busyRowIds: Ref<Set<string>>;
  updatingRowIds: Ref<Set<string>>;
  containerStats: Map<string, DockerContainerStats>;
  onUpdateContainer: (row: TreeRow<DockerContainer>) => void;
  getRowActionItems: (row: TreeRow<DockerContainer>) => unknown[][];
}

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

export function useDockerTableColumns(options: DockerTableColumnsOptions) {
  const { compact, busyRowIds, updatingRowIds, containerStats, onUpdateContainer, getRowActionItems } =
    options;

  const UButton = resolveComponent('UButton');
  const UBadge = resolveComponent('UBadge');
  const UDropdownMenu = resolveComponent('UDropdownMenu');
  const USkeleton = resolveComponent('USkeleton') as Component;
  const UIcon = resolveComponent('UIcon');

  const rowActionDropdownUi = {
    content: 'overflow-x-hidden z-50',
    item: 'bg-transparent hover:bg-transparent focus:bg-transparent border-0 ring-0 outline-none shadow-none data-[state=checked]:bg-transparent',
  };

  const columns = computed<TableColumn<TreeRow<DockerContainer>>[]>(() => {
    const cols: TableColumn<TreeRow<DockerContainer>>[] = [
      {
        accessorKey: 'name',
        header: compact.value ? '' : 'Name',
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
          const isRowBusy = busyRowIds.value.has(treeRow.id);
          const canExpand = treeRow.type === 'folder' && !!(treeRow.children && treeRow.children.length);
          const isExpanded = row.getIsExpanded?.() ?? false;

          return h(DockerNameCell, {
            row: treeRow,
            depth: row.depth,
            isUpdating: isRowUpdating,
            isBusy: isRowBusy,
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
                    onUpdateContainer(treeRow);
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
        accessorKey: 'tailscale',
        header: 'Tailscale',
        cell: ({ row }) => {
          if (row.original.type === 'folder') return '';
          const tailscaleEnabled = row.original.meta?.tailscaleEnabled;
          if (!tailscaleEnabled) {
            return h('span', { class: 'text-gray-400' }, '—');
          }
          return h(DockerTailscaleIndicator, {
            containerId: row.original.containerId || row.original.id,
            containerState: row.original.state || ContainerState.EXITED,
          });
        },
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
        cell: makeMultiValueCell('volumes'),
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

  return { columns };
}

export function getDefaultColumnVisibility(isCompact: boolean): Record<string, boolean> {
  if (isCompact) {
    return {
      state: false,
      cpu: false,
      memory: false,
      version: false,
      links: true,
      network: false,
      tailscale: false,
      containerIp: false,
      containerPort: false,
      lanPort: false,
      volumes: false,
      autoStart: false,
      uptime: false,
      actions: false,
    };
  }
  return {
    state: true,
    cpu: true,
    memory: true,
    version: false,
    links: true,
    network: false,
    tailscale: true,
    containerIp: false,
    containerPort: false,
    lanPort: true,
    volumes: false,
    autoStart: true,
    uptime: false,
  };
}

export const DOCKER_SEARCHABLE_KEYS = [
  'name',
  'state',
  'version',
  'network',
  'tailscale',
  'containerIp',
  'containerPort',
  'lanPort',
  'volumes',
  'autoStart',
  'updates',
  'uptime',
  'containerId',
];
