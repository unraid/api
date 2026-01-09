import { ContainerState } from '@/composables/gql/graphql';
import { getWebUiUrl, openLanIpInNewTab, stripLeadingSlash } from '@/utils/docker';

import type { DockerContainer } from '@/composables/gql/graphql';
import type { TreeRow } from '@/composables/useTreeData';
import type { Ref } from 'vue';

export type ActionDropdownItem = {
  label: string;
  icon?: string;
  onSelect?: (e?: Event) => void;
  as?: string;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral';
};

export type DropdownMenuItems = ActionDropdownItem[][];

export interface DockerRowActionsOptions {
  updatingRowIds: Ref<Set<string>>;
  checkingForUpdates: Ref<boolean>;
  hasFlatEntries: Ref<boolean>;
  hasActiveConsoleSession: (containerName: string) => boolean;
  canMoveUp: (id: string) => boolean;
  canMoveDown: (id: string) => boolean;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onSelectAllChildren: (row: TreeRow<DockerContainer>) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onMoveToFolder: (ids: string[]) => void;
  onStartStop: (row: TreeRow<DockerContainer>) => void;
  onPauseResume: (row: TreeRow<DockerContainer>) => void;
  onViewLogs: (row: TreeRow<DockerContainer>) => void;
  onOpenConsole: (row: TreeRow<DockerContainer>) => void;
  onManageSettings: (row: TreeRow<DockerContainer>) => void;
  onCheckForUpdates: (row: TreeRow<DockerContainer>) => void;
  onUpdateContainer: (row: TreeRow<DockerContainer>) => void;
  onRemoveContainer: (row: TreeRow<DockerContainer>) => void;
  onVisitTailscale: (containerId: string) => void;
}

export function useDockerRowActions(options: DockerRowActionsOptions) {
  const {
    updatingRowIds,
    checkingForUpdates,
    hasFlatEntries,
    hasActiveConsoleSession,
    canMoveUp,
    canMoveDown,
    onMoveUp,
    onMoveDown,
    onSelectAllChildren,
    onRenameFolder,
    onDeleteFolder,
    onMoveToFolder,
    onStartStop,
    onPauseResume,
    onViewLogs,
    onOpenConsole,
    onManageSettings,
    onCheckForUpdates,
    onUpdateContainer,
    onRemoveContainer,
    onVisitTailscale,
  } = options;

  function getContainerNameFromRow(row: TreeRow<DockerContainer>): string {
    const meta = row.meta as DockerContainer | undefined;
    return stripLeadingSlash(meta?.names?.[0]) || row.name || '';
  }

  function getReorderActions(rowId: string): ActionDropdownItem[] {
    if (!hasFlatEntries.value) return [];
    return [
      {
        label: 'Move up',
        icon: 'i-lucide-arrow-up',
        as: 'button',
        disabled: !canMoveUp(rowId),
        onSelect: () => onMoveUp(rowId),
      },
      {
        label: 'Move down',
        icon: 'i-lucide-arrow-down',
        as: 'button',
        disabled: !canMoveDown(rowId),
        onSelect: () => onMoveDown(rowId),
      },
    ];
  }

  function getFolderActionItems(row: TreeRow<DockerContainer>): DropdownMenuItems {
    const reorderActions = getReorderActions(row.id);
    const items: DropdownMenuItems = [
      [
        {
          label: 'Select all children',
          icon: 'i-lucide-check-square',
          as: 'button',
          onSelect: () => onSelectAllChildren(row),
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
        onSelect: () => onRenameFolder(row.id, row.name),
      },
      {
        label: 'Delete',
        icon: 'i-lucide-trash',
        as: 'button',
        onSelect: () => onDeleteFolder(row.id),
      },
    ]);

    return items;
  }

  function getContainerActionItems(row: TreeRow<DockerContainer>): DropdownMenuItems {
    const reorderActions = getReorderActions(row.id);
    const webUiUrl = getWebUiUrl(row.meta);
    const canVisit = Boolean(webUiUrl) && row.meta?.state === ContainerState.RUNNING;
    const hasUpdate = row.meta?.isUpdateAvailable || row.meta?.isRebuildReady;
    const isRowUpdating = updatingRowIds.value.has(row.id);
    const isCheckingUpdates = checkingForUpdates.value;
    const hasTailscale = row.meta?.tailscaleEnabled && row.meta?.state === ContainerState.RUNNING;

    const quickActions: ActionDropdownItem[] = [];

    if (canVisit && webUiUrl) {
      quickActions.push({
        label: 'WebUI',
        icon: 'i-lucide-external-link',
        as: 'button',
        onSelect: () => openLanIpInNewTab(webUiUrl),
      });
    }

    if (hasTailscale && row.meta?.id) {
      const containerId = row.meta.id;
      quickActions.push({
        label: 'WebUI (Tailscale)',
        icon: 'i-lucide-external-link',
        as: 'button',
        onSelect: () => onVisitTailscale(containerId),
      });
    }

    const updateActions: ActionDropdownItem[] = [
      {
        label: 'Check for updates',
        icon: 'i-lucide-refresh-cw',
        as: 'button',
        disabled: isCheckingUpdates,
        onSelect: () => onCheckForUpdates(row),
      },
    ];

    if (hasUpdate && !isRowUpdating) {
      updateActions.push({
        label: 'Update',
        icon: 'i-lucide-circle-arrow-up',
        as: 'button',
        onSelect: () => onUpdateContainer(row),
      });
    } else if (!isRowUpdating) {
      updateActions.push({
        label: hasUpdate === false ? 'Up to date' : 'Update',
        icon: 'i-lucide-circle-arrow-up',
        as: 'button',
        disabled: true,
      });
    }

    const items: DropdownMenuItems = [];

    if (quickActions.length > 0) {
      items.push(quickActions);
    }

    items.push(updateActions);

    if (reorderActions.length > 0) {
      items.push(reorderActions);
    }

    items.push([
      {
        label: 'Move to folder',
        icon: 'i-lucide-folder',
        as: 'button',
        onSelect: () => onMoveToFolder([row.id]),
      },
      {
        label: 'Start / Stop',
        icon: 'i-lucide-power',
        as: 'button',
        onSelect: () => onStartStop(row),
      },
      {
        label: 'Pause / Resume',
        icon: 'i-lucide-pause',
        as: 'button',
        onSelect: () => onPauseResume(row),
      },
    ]);

    const containerName = getContainerNameFromRow(row);
    const hasConsoleSession = containerName ? hasActiveConsoleSession(containerName) : false;

    items.push([
      {
        label: 'View logs',
        icon: 'i-lucide-scroll-text',
        as: 'button',
        onSelect: () => onViewLogs(row),
      },
      {
        label: hasConsoleSession ? 'Console (active)' : 'Console',
        icon: 'i-lucide-terminal',
        as: 'button',
        color: hasConsoleSession ? 'success' : undefined,
        onSelect: () => onOpenConsole(row),
      },
      {
        label: 'Manage Settings',
        icon: 'i-lucide-settings',
        as: 'button',
        onSelect: () => onManageSettings(row),
      },
    ]);

    items.push([
      {
        label: 'Remove',
        icon: 'i-lucide-trash-2',
        as: 'button',
        color: 'error',
        onSelect: () => onRemoveContainer(row),
      },
    ]);

    return items;
  }

  function getRowActionItems(row: TreeRow<DockerContainer>): DropdownMenuItems {
    if (row.type === 'folder') {
      return getFolderActionItems(row);
    }
    return getContainerActionItems(row);
  }

  return {
    getRowActionItems,
    getContainerNameFromRow,
  };
}
