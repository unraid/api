import type { TreeRow } from '@/composables/useTreeData';
import type { Ref } from 'vue';

export interface MoveRequest {
  rowId: string;
  parentId: string;
  position: number;
}

export interface EntryReorderingOptions<T> {
  rootFolderId: Ref<string>;
  entryParentById: Ref<Record<string, string>>;
  folderChildrenIds: Ref<Record<string, string[]>>;
  treeData: Ref<TreeRow<T>[]>;
  getRowById: (id: string, data: TreeRow<T>[]) => TreeRow<T> | undefined;
  onMove: (request: MoveRequest) => unknown;
}

export function useEntryReordering<T>(options: EntryReorderingOptions<T>) {
  const { rootFolderId, entryParentById, folderChildrenIds, treeData, getRowById, onMove } = options;

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

  function canMoveUp(rowId: string): boolean {
    const parentId = entryParentById.value[rowId] || rootFolderId.value;
    const siblings = getSiblingIds(parentId);
    const currentIndex = siblings.indexOf(rowId);
    return currentIndex > 0;
  }

  function canMoveDown(rowId: string): boolean {
    const parentId = entryParentById.value[rowId] || rootFolderId.value;
    const siblings = getSiblingIds(parentId);
    const currentIndex = siblings.indexOf(rowId);
    return currentIndex >= 0 && currentIndex < siblings.length - 1;
  }

  function moveUp(rowId: string): unknown {
    const parentId = entryParentById.value[rowId] || rootFolderId.value;
    const siblings = getSiblingIds(parentId);
    const currentIndex = siblings.indexOf(rowId);
    if (currentIndex <= 0) return;

    return onMove({ rowId, parentId, position: currentIndex - 1 });
  }

  function moveDown(rowId: string): unknown {
    const parentId = entryParentById.value[rowId] || rootFolderId.value;
    const siblings = getSiblingIds(parentId);
    const currentIndex = siblings.indexOf(rowId);
    if (currentIndex < 0 || currentIndex >= siblings.length - 1) return;

    return onMove({ rowId, parentId, position: currentIndex + 1 });
  }

  return {
    canMoveUp,
    canMoveDown,
    moveUp,
    moveDown,
    getSiblingIds,
  };
}
