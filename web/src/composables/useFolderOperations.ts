import { ref } from 'vue';

import type { FlatFolderRow } from '@/composables/useFolderTree';
import type { Ref } from 'vue';

export interface FolderOperationsOptions {
  rootFolderId: Ref<string>;
  folderChildrenIds: Ref<Record<string, string[]>>;
  parentById: Ref<Record<string, string>>;
  visibleFolders: Ref<FlatFolderRow[]>;
  expandedFolders: Ref<Set<string>>;
  setExpandedFolders: (ids: string[]) => void;
  createFolderMutation: (args: {
    name: string;
    parentId: string;
    childrenIds: string[];
  }) => Promise<unknown>;
  deleteFolderMutation: (
    args: { entryIds: string[] },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: any
  ) => Promise<unknown>;
  setFolderChildrenMutation: (
    args: { folderId: string; childrenIds: string[] },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: any
  ) => Promise<unknown>;
  moveEntriesMutation: (
    args: { destinationFolderId: string; sourceEntryIds: string[] },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: any
  ) => Promise<unknown>;
  refetchQuery: { query: unknown; variables: { skipCache: boolean } };
  onSuccess?: (message: string) => void;
}

export function useFolderOperations(options: FolderOperationsOptions) {
  const {
    rootFolderId,
    folderChildrenIds,
    parentById,
    expandedFolders,
    setExpandedFolders,
    createFolderMutation,
    deleteFolderMutation,
    setFolderChildrenMutation,
    moveEntriesMutation,
    refetchQuery,
    onSuccess,
  } = options;

  const moveOpen = ref(false);
  const selectedFolderId = ref<string>('');
  const pendingMoveSourceIds = ref<string[]>([]);
  const renamingFolderId = ref<string>('');
  const renameValue = ref<string>('');
  const newTreeFolderName = ref<string>('');

  function getFolderChildrenList(folderId: string): string[] {
    return [...(folderChildrenIds.value[folderId] || [])];
  }

  function openMoveModal(ids: string[]) {
    if (ids.length === 0) return;
    pendingMoveSourceIds.value = ids;
    selectedFolderId.value = rootFolderId.value || '';
    setExpandedFolders([rootFolderId.value]);
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
        refetchQueries: [refetchQuery],
        awaitRefetchQueries: true,
      }
    );
    onSuccess?.('Moved to folder');
    close();
  }

  async function handleCreateFolderInTree() {
    const name = newTreeFolderName.value.trim();
    if (!name) return;
    await createFolderMutation({
      name,
      parentId: selectedFolderId.value || rootFolderId.value,
      childrenIds: pendingMoveSourceIds.value,
    });
    onSuccess?.('Folder created');
    newTreeFolderName.value = '';
    expandedFolders.value.add(selectedFolderId.value || rootFolderId.value);
  }

  function startRenameFolder(id: string, currentName: string) {
    if (!id || id === rootFolderId.value) return;
    renamingFolderId.value = id;
    renameValue.value = currentName;
  }

  function cancelRename() {
    renamingFolderId.value = '';
    renameValue.value = '';
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
    await createFolderMutation({ name: newName, parentId, childrenIds: children });
    await setFolderChildrenMutation({ folderId: id, childrenIds: [] });
    await deleteFolderMutation(
      { entryIds: [id] },
      {
        refetchQueries: [refetchQuery],
        awaitRefetchQueries: true,
      }
    );
    renamingFolderId.value = '';
    renameValue.value = '';
    selectedFolderId.value = newName;
    onSuccess?.('Folder renamed');
  }

  async function handleDeleteFolder() {
    const id = selectedFolderId.value;
    if (!id || id === rootFolderId.value) return;
    if (!confirm('Delete this folder? Contents will move to root.')) return;
    await deleteFolderMutation(
      { entryIds: [id] },
      {
        refetchQueries: [refetchQuery],
        awaitRefetchQueries: true,
      }
    );
    selectedFolderId.value = rootFolderId.value;
    onSuccess?.('Folder deleted');
  }

  async function renameFolderInteractive(id: string, currentName: string) {
    if (!id || id === rootFolderId.value) return;
    const proposed = window.prompt('New folder name?', currentName)?.trim();
    if (!proposed || proposed === id) return;
    const parentId = parentById.value[id] || rootFolderId.value;
    const children = folderChildrenIds.value[id] || [];
    await createFolderMutation({ name: proposed, parentId, childrenIds: children });
    await setFolderChildrenMutation({ folderId: id, childrenIds: [] });
    await deleteFolderMutation(
      { entryIds: [id] },
      {
        refetchQueries: [refetchQuery],
        awaitRefetchQueries: true,
      }
    );
    onSuccess?.('Folder renamed');
  }

  async function deleteFolderById(id: string) {
    if (!id || id === rootFolderId.value) return;
    if (!confirm('Delete this folder? Contents will move to root.')) return;
    await deleteFolderMutation(
      { entryIds: [id] },
      {
        refetchQueries: [refetchQuery],
        awaitRefetchQueries: true,
      }
    );
    onSuccess?.('Folder deleted');
  }

  return {
    moveOpen,
    selectedFolderId,
    pendingMoveSourceIds,
    renamingFolderId,
    renameValue,
    newTreeFolderName,
    openMoveModal,
    confirmMove,
    handleCreateFolderInTree,
    startRenameFolder,
    cancelRename,
    commitRenameFolder,
    handleDeleteFolder,
    renameFolderInteractive,
    deleteFolderById,
    getFolderChildrenList,
  };
}
