import { computed } from 'vue';

import type { DockerContainer } from '@/composables/gql/graphql';
import type { ActionDropdownItem, DropdownMenuItems } from '@/composables/useDockerRowActions';
import type { TreeRow } from '@/composables/useTreeData';
import type { Ref } from 'vue';

export interface DockerBulkActionsOptions {
  selectedIds: Ref<string[]>;
  allContainerRows: Ref<TreeRow<DockerContainer>[]>;
  updateCandidateRows: Ref<TreeRow<DockerContainer>[]>;
  checkingForUpdates: Ref<boolean>;
  updatingAllContainers: Ref<boolean>;
  getContainerRows: (ids: string[]) => TreeRow<DockerContainer>[];
  onCheckForUpdates: (rows: TreeRow<DockerContainer>[]) => void;
  onUpdateAllContainers: (rows: TreeRow<DockerContainer>[]) => void;
  onMoveToFolder: (ids: string[]) => void;
  onBulkUpdate: (rows: TreeRow<DockerContainer>[]) => void;
  onStartStop: (ids: string[]) => void;
  onPauseResume: (ids: string[]) => void;
}

export function useDockerBulkActions(options: DockerBulkActionsOptions) {
  const {
    selectedIds,
    allContainerRows,
    updateCandidateRows,
    checkingForUpdates,
    updatingAllContainers,
    getContainerRows,
    onCheckForUpdates,
    onUpdateAllContainers,
    onMoveToFolder,
    onBulkUpdate,
    onStartStop,
    onPauseResume,
  } = options;

  const selectedContainerRows = computed(() => getContainerRows(selectedIds.value));
  const hasSelectedContainers = computed(() => selectedContainerRows.value.length > 0);
  const hasSelectedEntries = computed(() => selectedIds.value.length > 0);

  const bulkItems = computed<DropdownMenuItems>(() => {
    const globalActions: ActionDropdownItem[] = [
      {
        label: 'Check for updates',
        icon: 'i-lucide-refresh-cw',
        as: 'button',
        disabled: checkingForUpdates.value,
        onSelect: () => onCheckForUpdates(allContainerRows.value),
      },
      {
        label: 'Update all',
        icon: 'i-lucide-rotate-ccw',
        as: 'button',
        disabled: updatingAllContainers.value,
        onSelect: () => onUpdateAllContainers(updateCandidateRows.value),
      },
    ];

    const selectionActions: ActionDropdownItem[] = [
      {
        label: 'Move to folder',
        icon: 'i-lucide-folder',
        as: 'button',
        disabled: !hasSelectedEntries.value,
        onSelect: () => onMoveToFolder(selectedIds.value),
      },
      {
        label: 'Update containers',
        icon: 'i-lucide-rotate-ccw',
        as: 'button',
        disabled: !hasSelectedContainers.value,
        onSelect: () => onBulkUpdate(selectedContainerRows.value),
      },
      {
        label: 'Start / Stop',
        icon: 'i-lucide-power',
        as: 'button',
        disabled: !hasSelectedContainers.value,
        onSelect: () => onStartStop(selectedIds.value),
      },
      {
        label: 'Pause / Resume',
        icon: 'i-lucide-pause',
        as: 'button',
        disabled: !hasSelectedContainers.value,
        onSelect: () => onPauseResume(selectedIds.value),
      },
    ];

    return [globalActions, selectionActions];
  });

  return {
    bulkItems,
    hasSelectedContainers,
    hasSelectedEntries,
    selectedContainerRows,
  };
}
