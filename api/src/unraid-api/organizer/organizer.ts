import {
    AnyOrganizerResource,
    OrganizerFolder,
    OrganizerResource,
    OrganizerResourceRef,
    OrganizerV1,
    OrganizerView,
    ResolvedOrganizerEntryType,
    ResolvedOrganizerFolder,
    ResolvedOrganizerV1,
    ResolvedOrganizerView,
} from '@app/unraid-api/organizer/organizer.model.js';

export const DEFAULT_ORGANIZER_VIEW_ID = 'default';
export const DEFAULT_ORGANIZER_ROOT_ID = 'root';

export function resourceToResourceRef(
    resource: AnyOrganizerResource,
    refId: (resource: AnyOrganizerResource) => string
): OrganizerResourceRef {
    return {
        id: refId(resource) ?? resource.id,
        type: 'ref',
        target: resource.id,
    };
}

/**
 * Adds any missing resources to an organizer view by creating resource references
 * and placing them in the root folder.
 *
 * This function ensures that all resources from the provided resources collection
 * are represented in the view. Any resources that don't already exist in the view
 * will be added as resource references and placed in the root folder's children.
 *
 * @param resources - A collection of organizer resources keyed by their ID
 * @param originalView - The original organizer view to augment with missing resources
 * @returns A new organizer view containing all original entries plus any missing resources
 *
 * @example
 * ```typescript
 * const resources = { 'res1': { id: 'res1', name: 'Resource 1' } };
 * const view = { root: 'folder1', name: 'My View', entries: {} };
 * const updatedView = addMissingResourcesToView(resources, view);
 * // updatedView will contain 'res1' as a resource reference in the root folder
 * ```
 */
export function addMissingResourcesToView(
    resources: OrganizerV1['resources'],
    originalView: OrganizerView
): OrganizerView {
    const view = structuredClone(originalView);
    view.entries[view.root] ??= {
        id: view.root,
        name: view.name,
        type: 'folder',
        children: [],
    };
    const root = view.entries[view.root]! as OrganizerFolder;
    const rootChildren = new Set(root.children);

    Object.entries(resources).forEach(([id, resource]) => {
        if (!view.entries[id]) {
            view.entries[id] = resourceToResourceRef(resource, (resource) => resource.id);
            rootChildren.add(id);
        }
    });
    root.children = Array.from(rootChildren);
    return view;
}

/**
 * Recursively resolves an organizer entry (folder or resource ref) into its actual objects.
 * This transforms the flat ID-based structure into a nested object structure for frontend convenience.
 *
 * PRECONDITION: The given view is valid (ie. does not contain any cycles or depth issues).
 *
 * @param entryId - The ID of the entry to resolve
 * @param view - The organizer view containing the entry definitions
 * @param resources - The collection of all available resources
 * @returns The resolved entry with actual objects instead of ID references
 */
function resolveEntry(
    entryId: string,
    view: OrganizerView,
    resources: OrganizerV1['resources']
): ResolvedOrganizerEntryType {
    const entry = view.entries[entryId];

    if (!entry) {
        throw new Error(`Entry with id '${entryId}' not found in view`);
    }

    if (entry.type === 'folder') {
        // Recursively resolve all children
        const resolvedChildren = entry.children.map((childId) => resolveEntry(childId, view, resources));

        return {
            id: entry.id,
            type: 'folder',
            name: entry.name,
            children: resolvedChildren,
        } as ResolvedOrganizerFolder;
    } else if (entry.type === 'ref') {
        // Resolve the resource reference
        const resource = resources[entry.target];
        if (!resource) {
            throw new Error(`Resource with id '${entry.target}' not found`);
        }
        return resource;
    }

    throw new Error(`Unknown entry type: ${(entry as any).type}`);
}

/**
 * Transforms a flat organizer view into a resolved view where all ID references
 * are replaced with actual objects.
 *
 * PRECONDITION: The given view is valid (ie. does not contain any cycles or depth issues).
 *
 * @param view - The flat organizer view to resolve
 * @param resources - The collection of all available resources
 * @returns A resolved view with nested objects instead of ID references
 */
export function resolveOrganizerView(
    view: OrganizerView,
    resources: OrganizerV1['resources']
): ResolvedOrganizerView {
    const resolvedRoot = resolveEntry(view.root, view, resources);

    return {
        id: view.id,
        name: view.name,
        root: resolvedRoot,
        prefs: view.prefs,
    };
}

/**
 * Transforms a flat organizer structure into a resolved structure where all ID references
 * are replaced with actual objects for frontend convenience.
 *
 * @param organizer - The flat organizer structure to resolve
 * @returns A resolved organizer with nested objects instead of ID references
 */
export function resolveOrganizer(organizer: OrganizerV1): ResolvedOrganizerV1 {
    const resolvedViews: ResolvedOrganizerView[] = [];

    for (const [viewId, view] of Object.entries(organizer.views)) {
        resolvedViews.push(resolveOrganizerView(view, organizer.resources));
    }

    return {
        version: 1,
        views: resolvedViews,
    };
}

export interface CreateFolderInViewParams {
    view: OrganizerView;
    folderId: string;
    folderName: string;
    parentId: string;
    childrenIds?: string[];
}

/**
 * Creates a new folder in a view and adds it to the parent folder's children.
 * This is a pure function that returns a new view object without modifying the original.
 *
 * @param params - Parameters for creating the folder
 * @returns A new view object with the folder added
 */
export function createFolderInView(params: CreateFolderInViewParams): OrganizerView {
    const { view, folderId, folderName, parentId, childrenIds = [] } = params;
    const newView = structuredClone(view);

    // Create the new folder
    const newFolder: OrganizerFolder = {
        id: folderId,
        type: 'folder',
        name: folderName,
        children: childrenIds,
    };

    // Add folder to entries
    newView.entries[folderId] = newFolder;

    // Add to parent's children
    const parentEntry = newView.entries[parentId] as OrganizerFolder;
    parentEntry.children = [...parentEntry.children, folderId];

    return newView;
}

export interface SetFolderChildrenInViewParams {
    view: OrganizerView;
    folderId: string;
    childrenIds: string[];
    resources?: OrganizerV1['resources'];
}

/**
 * Updates a folder's children list in a view.
 * This is a pure function that returns a new view object without modifying the original.
 *
 * @param params - Parameters for updating the folder's children
 * @returns A new view object with the folder's children updated
 */
export function setFolderChildrenInView(params: SetFolderChildrenInViewParams): OrganizerView {
    const { view, folderId, childrenIds, resources } = params;
    const newView = structuredClone(view);

    // Update the folder's children
    const folder = newView.entries[folderId] as OrganizerFolder;
    folder.children = childrenIds;

    // If resources are provided, create refs for any resources not already in entries
    if (resources) {
        for (const childId of childrenIds) {
            if (!newView.entries[childId] && resources[childId]) {
                newView.entries[childId] = {
                    id: childId,
                    type: 'ref',
                    target: childId,
                };
            }
        }
    }

    return newView;
}

/**
 * Recursively collects all descendants of an entry in an organizer view.
 *
 * **IMPORTANT: The returned set includes the starting `entryId` as well, not just its descendants.**
 *
 * This function performs a depth-first traversal of the organizer hierarchy, collecting
 * all reachable entry IDs starting from the given entry. It handles various edge cases
 * gracefully and prevents infinite loops in circular structures.
 *
 * @param view - The organizer view containing the entry definitions
 * @param entryId - The ID of the entry to start collection from
 * @param collection - Optional existing Set to add results to. If provided, this Set
 *   will be modified in-place and returned.
 * @returns A Set containing the entryId and all its descendants
 *
 * @example
 * ```typescript
 * // Basic usage - collects entry and all descendants
 * const descendants = collectDescendants(view, 'folder1');
 * // descendants contains 'folder1' plus all nested children
 *
 * // Using existing collection
 * const existing = new Set(['other-item']);
 * const result = collectDescendants(view, 'folder1', existing);
 * // result === existing (same Set object, modified in-place)
 * ```
 *
 * @remarks
 * **Behavior and Edge Cases:**
 *
 * - **Self-inclusion**: The starting `entryId` is always included in the result set
 * - **Cycle detection**: Automatically prevents infinite loops when entries reference themselves
 *   or create circular dependencies. Each entry ID is only processed once.
 * - **Missing entries**: If `entryId` doesn't exist in the view, returns an empty set (or
 *   the provided collection unchanged)
 * - **Broken references**: If a folder's children array contains IDs that don't exist in the
 *   view, those missing children are silently skipped without errors
 * - **Resource refs**: Entries with `type: 'ref'` are treated as leaf nodes - they are
 *   collected but don't traverse further (as they have no children)
 * - **Empty folders**: Folders with no children are still collected and returned
 * - **Collection mutation**: If a collection parameter is provided, it is modified in-place
 *   rather than creating a new Set
 * - **Traversal order**: Uses depth-first traversal, processing folders before their children.
 *   The Set maintains insertion order, so parent entries appear before their descendants.
 *
 * **Performance:** O(n) where n is the number of reachable entries. Each entry is visited
 * at most once due to the cycle detection mechanism.
 */
export function collectDescendants(
    view: OrganizerView,
    entryId: string,
    collection?: Set<string>
): Set<string> {
    collection ??= new Set<string>();
    const entry = view.entries[entryId];
    if (!entry || collection.has(entryId)) return collection;

    collection.add(entryId);
    if (entry.type === 'folder') {
        for (const childId of entry.children) {
            collectDescendants(view, childId, collection);
        }
    }
    return collection;
}

/**
 * Collects all ancestors of an entry in an organizer view by walking up the tree.
 *
 * **IMPORTANT: The returned set includes the starting `entryId` as well, not just its ancestors.**
 *
 * This function walks up the organizer hierarchy from the given entry to the root,
 * collecting all ancestor entry IDs. This is more efficient than collecting descendants
 * when you need to check if an entry is an ancestor of another.
 *
 * @param view - The organizer view containing the entry definitions
 * @param entryId - The ID of the entry to start collection from
 * @param collection - Optional existing Set to add results to. If provided, this Set
 *   will be modified in-place and returned.
 * @returns A Set containing the entryId and all its ancestors up to the root
 *
 * @example
 * ```typescript
 * // Basic usage - collects entry and all ancestors
 * const ancestors = collectAncestors(view, 'deepFolder');
 * // ancestors contains 'deepFolder' plus all parent folders up to root
 *
 * // Check if one entry is an ancestor of another
 * const ancestors = collectAncestors(view, 'childFolder');
 * if (ancestors.has('parentFolder')) {
 *   // parentFolder is an ancestor of childFolder
 * }
 * ```
 *
 * @remarks
 * **Behavior and Edge Cases:**
 *
 * - **Self-inclusion**: The starting `entryId` is always included in the result set
 * - **Missing entries**: If `entryId` doesn't exist in the view, returns an empty set (or
 *   the provided collection unchanged)
 * - **Multiple parents**: In valid views, each entry should have at most one parent.
 *   This function finds the first parent and continues from there.
 * - **Orphaned entries**: If an entry has no parent (not referenced by any folder),
 *   the collection will only contain that entry
 * - **Root entry**: The root entry is included in the ancestors if reached
 * - **Collection mutation**: If a collection parameter is provided, it is modified in-place
 *   rather than creating a new Set
 * - **Traversal order**: Walks from child to parent, so the Set will contain entries
 *   in order from the starting entry up to the root
 *
 * **Performance:** O(h * n) where h is the height of the tree and n is the number of
 * entries in the view (due to parent search). For typical tree structures, h is O(log n),
 * making this much more efficient than collecting all descendants for large subtrees.
 */
export function collectAncestors(
    view: OrganizerView,
    entryId: string,
    collection?: Set<string>
): Set<string> {
    collection ??= new Set<string>();

    let currentId: string | null = entryId;

    while (currentId && !collection.has(currentId)) {
        const entry = view.entries[currentId];
        if (!entry) break;

        collection.add(currentId);

        // Find parent of current entry
        let parentId: string | null = null;
        for (const [potentialParentId, potentialParent] of Object.entries(view.entries)) {
            if (potentialParent.type === 'folder' && potentialParent.children.includes(currentId)) {
                parentId = potentialParentId;
                break;
            }
        }

        currentId = parentId;
    }

    return collection;
}

/**
 * Deletes entries from an organizer view along with all their descendants.
 *
 * This function performs a cascading deletion - when you delete a folder, all of its
 * nested children (folders and resource references) are also deleted. The function
 * automatically handles cleanup by removing deleted entry references from all parent
 * folders throughout the view.
 *
 * @param view - The organizer view to delete entries from
 * @param entryIds - Set of entry IDs to delete (folders and/or resource refs)
 * @param opts - Options object
 * @param opts.mutate - If true, modifies the original view in-place. If false (default),
 *   returns a new cloned view with deletions applied
 * @returns The modified organizer view (original if mutate=true, clone if mutate=false)
 *
 * @example
 * ```typescript
 * // Delete multiple entries (returns new view)
 * const updatedView = deleteOrganizerEntries(view, new Set(['folder1', 'resource2']));
 *
 * // Delete in-place (mutates original view)
 * const sameView = deleteOrganizerEntries(view, new Set(['folder1']), { mutate: true });
 * ```
 *
 * @remarks
 * **Important Behaviors:**
 *
 * - **Cascading deletion**: Deleting a folder automatically deletes all its descendants
 *   (nested folders and resource references). Use `collectDescendants()` first if you
 *   need to know what will be deleted.
 *
 * - **Reference cleanup**: Removes deleted entry IDs from ALL folder children arrays
 *   throughout the view, not just direct parents. This handles cases where entries
 *   are referenced by multiple folders.
 *
 * - **Circular reference safe**: Handles circular folder structures without infinite
 *   loops thanks to the underlying `collectDescendants()` function.
 *
 * - **Graceful handling**: Non-existent entry IDs are silently ignored. Empty deletion
 *   sets are handled without errors.
 *
 * - **Immutability control**: By default creates a new view object (`mutate=false`).
 *   Set `mutate=true` only when you want to modify the original view in-place.
 *
 * **Performance**: O(n*m) where n is the number of entries in the view and m is the
 * average number of children per folder, due to the reference cleanup step.
 */
export function deleteOrganizerEntries(
    view: OrganizerView,
    entryIds: Set<string>,
    opts: {
        mutate?: boolean;
        descendantCollector?: (
            view: OrganizerView,
            entryId: string,
            collection?: Set<string>
        ) => Set<string>;
    } = {}
): OrganizerView {
    const { descendantCollector = collectDescendants } = opts;
    // Stage entries for deletion
    const toDelete = new Set<string>();
    for (const entryId of entryIds) {
        descendantCollector(view, entryId, toDelete);
    }

    const newView = opts.mutate ? view : structuredClone(view);
    // Remove references from parent folders
    Object.values(newView.entries).forEach((entry) => {
        if (entry.type === 'folder') {
            entry.children = entry.children.filter((childId) => !toDelete.has(childId));
        }
    });

    // Delete entries
    for (const entryId of toDelete) {
        delete newView.entries[entryId];
    }
    return newView;
}

export interface MoveEntriesToFolderParams {
    view: OrganizerView;
    sourceEntryIds: Set<string>;
    destinationFolderId: string;
}

/**
 * Moves entries from their current locations to a destination folder.
 *
 * This function moves the specified entries (folders and/or resource refs) to the
 * destination folder's children list, removing them from their current parent folders.
 * The function preserves the entries themselves, only changing their location in the
 * folder hierarchy.
 *
 * @param params - Parameters for moving entries
 * @param params.view - The organizer view containing the entries
 * @param params.sourceEntryIds - Set of entry IDs to move
 * @param params.destinationFolderId - ID of the folder to move entries into
 * @returns A new view object with the entries moved
 *
 * @example
 * ```typescript
 * // Move multiple entries to a folder
 * const updatedView = moveEntriesToFolder({
 *   view: currentView,
 *   sourceEntryIds: new Set(['item1', 'item2']),
 *   destinationFolderId: 'targetFolder'
 * });
 * ```
 *
 * @remarks
 * **Important Behaviors:**
 *
 * - **Non-destructive**: Entries are moved, not copied or deleted. Their IDs and
 *   content remain unchanged.
 *
 * - **Parent cleanup**: Automatically removes moved entries from all parent folders
 *   throughout the view, handling cases where entries exist in multiple folders.
 *
 * - **Self-move prevention**: If an entry is already a child of the destination folder,
 *   it remains in its current position within that folder's children array.
 *
 * - **Folder-to-self prevention**: Prevents moving a folder into itself or its own
 *   descendants, which would create invalid circular structures.
 *
 * - **Non-existent entries**: Source entry IDs that don't exist in the view are
 *   silently ignored.
 *
 * - **Non-existent destination**: If the destination folder doesn't exist or is not
 *   a folder type, the function throws an error.
 *
 * - **Immutability**: Always returns a new view object, never modifies the original.
 *
 * - **Order preservation**: Moved entries are appended to the destination folder's
 *   children array in the order they appear in the sourceEntryIds set.
 *
 * **Performance**: O(n) for parent cleanup where n is the number of folders in the view.
 * Circular move detection is optimized to O(h) where h is the height of the tree
 * (walking up from destination to root), avoiding expensive descendant traversals.
 */
export function moveEntriesToFolder(params: MoveEntriesToFolderParams): OrganizerView {
    const { view, sourceEntryIds, destinationFolderId } = params;
    const newView = structuredClone(view);

    // Validate destination exists and is a folder
    const destinationEntry = newView.entries[destinationFolderId];
    if (!destinationEntry) {
        throw new Error(`Destination folder with id '${destinationFolderId}' not found in view`);
    }
    if (destinationEntry.type !== 'folder') {
        throw new Error(`Destination '${destinationFolderId}' is not a folder`);
    }

    // Optimize: First check if destination is directly in sourceEntryIds (O(1) check)
    if (sourceEntryIds.has(destinationFolderId)) {
        throw new Error(`Cannot move folder '${destinationFolderId}' into itself`);
    }

    // Optimize: Only check folders, and only compute descendants if needed
    const foldersToMove = Array.from(sourceEntryIds).filter((id) => {
        const entry = newView.entries[id];
        return entry && entry.type === 'folder';
    });

    // If there are folders to move, check for circular dependencies
    if (foldersToMove.length > 0) {
        // Lazy compute destination ancestors only once
        const destinationAncestors = collectAncestors(newView, destinationFolderId);
        for (const folderId of foldersToMove) {
            if (destinationAncestors.has(folderId)) {
                throw new Error(
                    `Cannot move folder '${folderId}' into its own descendant '${destinationFolderId}'`
                );
            }
        }
    }

    // Filter out non-existent entries and collect valid ones to move
    const entriesToMove = Array.from(sourceEntryIds).filter((id) => newView.entries[id]);

    // Remove entries from all parent folders
    Object.values(newView.entries).forEach((entry) => {
        if (entry.type === 'folder') {
            entry.children = entry.children.filter((childId) => !sourceEntryIds.has(childId));
        }
    });

    // Add entries to destination folder, avoiding duplicates
    const destinationFolder = destinationEntry as OrganizerFolder;
    const destinationChildren = new Set(destinationFolder.children);

    entriesToMove.forEach((entryId) => {
        destinationChildren.add(entryId);
    });
    destinationFolder.children = Array.from(destinationChildren);
    return newView;
}
