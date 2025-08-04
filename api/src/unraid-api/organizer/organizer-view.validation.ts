import {
    createValidationProcessor,
    ResultInterpreters,
} from '@app/core/utils/validation/validation-processor.js';
import { OrganizerView } from '@app/unraid-api/organizer/organizer.model.js';

/**========================================================================
 *                   Health of individual entries (graph-nodes)
 *========================================================================**/

/**
 * Checks if value of view.root is a key in view.entries.
 *
 * The root entry defines the first layer of the view.
 * It is the view's entrypoint, so it must exist for the view to be useful.
 *
 * @param view - The view to check.
 * @returns True if the view has a root entry, false otherwise.
 */
export function viewRootExists(view: OrganizerView): boolean {
    return Boolean(view.entries[view.root]);
}

/**
 * Finds missing child entries (folders referencing non-existent children).
 */
export function findMissingChildEntries(
    view: OrganizerView
): Array<{ parentId: string; missingChildId: string }> {
    const missing: Array<{ parentId: string; missingChildId: string }> = [];

    Object.entries(view.entries).forEach(([parentId, entry]) => {
        if (entry.type === 'folder' && Array.isArray(entry.children)) {
            entry.children.forEach((childId) => {
                if (!view.entries[childId]) {
                    missing.push({ parentId, missingChildId: childId });
                }
            });
        }
    });

    return missing;
}

/**
 * Finds duplicate children in folder entries.
 */
export function findDuplicateChildren(
    view: OrganizerView
): Array<{ folderId: string; duplicateId: string }> {
    const duplicates: Array<{ folderId: string; duplicateId: string }> = [];

    Object.entries(view.entries).forEach(([folderId, entry]) => {
        if (entry.type === 'folder' && Array.isArray(entry.children)) {
            const seen = new Set<string>();
            entry.children.forEach((childId) => {
                if (seen.has(childId)) {
                    duplicates.push({ folderId, duplicateId: childId });
                } else {
                    seen.add(childId);
                }
            });
        }
    });

    return duplicates;
}

/**========================================================================
 *                           Entries Graph Health
 *========================================================================**/

/**
 * Detects cycles in a view's entries tree.
 * Returns: null if no cycle, or an array of entry IDs showing the cycle path.
 */
export function findCycleInView(view: OrganizerView): string[] | null {
    const entries = view.entries;

    function dfs(currentId: string, path: string[], inProgress: Set<string>): string[] | null {
        if (inProgress.has(currentId)) {
            // Cycle found! Return path + the entry where cycle starts.
            const cycleStart = path.indexOf(currentId);
            return path.slice(cycleStart).concat([currentId]);
        }

        const entry = entries[currentId];
        if (!entry) return null; // orphaned/missing node

        // Only folders can have children that create cycles
        if (entry.type !== 'folder') return null;

        // Defensive check for children array
        if (!Array.isArray(entry.children)) return null;

        inProgress.add(currentId);
        path.push(currentId);

        for (const childId of entry.children) {
            const cycle = dfs(childId, path, inProgress);
            if (cycle) return cycle;
        }

        path.pop();
        inProgress.delete(currentId);
        return null;
    }

    return dfs(view.root, [], new Set());
}

/**
 * Validates nesting depth doesn't exceed maximum (prevents stack overflow)
 */
export function validateNestingDepth(view: OrganizerView, maxDepth: number = 100): boolean {
    function checkDepth(entryId: string, currentDepth: number): boolean {
        if (currentDepth > maxDepth) return false;

        const entry = view.entries[entryId];
        if (!entry || entry.type !== 'folder') return true;

        if (!Array.isArray(entry.children)) return true;

        return entry.children.every((childId) => checkDepth(childId, currentDepth + 1));
    }

    return checkDepth(view.root, 0);
}

/**
 * Finds orphaned entries that exist in the entries map but aren't reachable from view.root.
 */
export function findOrphanedEntries(view: OrganizerView): string[] {
    const reachable = new Set<string>();

    function traverse(entryId: string): void {
        if (reachable.has(entryId)) return; // Already visited
        reachable.add(entryId);

        const entry = view.entries[entryId];
        if (entry?.type === 'folder' && Array.isArray(entry.children)) {
            entry.children.forEach(traverse);
        }
    }

    traverse(view.root);
    return Object.keys(view.entries).filter((id) => !reachable.has(id));
}

/**========================================================================
 *                           Combined Validation
 *========================================================================**/

/**
 * Validates the structure of a view.
 *
 * This includes:
 * - Root entry exists
 * - No missing children
 * - No duplicate children
 * - No cycles
 * - Reasonable nesting depth
 * - No orphaned entries
 */
export const validateViewStructure = createValidationProcessor({
    steps: [
        {
            name: 'rootMissing',
            validator: viewRootExists,
            isError: ResultInterpreters.booleanMeansSuccess,
            alwaysFailFast: true, // If no root, other validations are meaningless
        },
        {
            name: 'missingChildren',
            validator: findMissingChildEntries,
            isError: ResultInterpreters.errorList,
        },
        {
            name: 'duplicateChildren',
            validator: findDuplicateChildren,
            isError: ResultInterpreters.errorList,
        },
        {
            name: 'cycles',
            validator: findCycleInView,
            isError: ResultInterpreters.nullableIsSuccess,
            alwaysFailFast: true, // Cycles break tree traversals
        },
        {
            name: 'exceedsMaxDepth',
            validator: (view: OrganizerView) => !validateNestingDepth(view),
            isError: ResultInterpreters.booleanMeansFailure,
            alwaysFailFast: true, // Max depth exceeded breaks tree traversals
        },
        {
            name: 'orphanedEntries',
            validator: findOrphanedEntries,
            isError: ResultInterpreters.errorList,
        },
    ] as const,
});
