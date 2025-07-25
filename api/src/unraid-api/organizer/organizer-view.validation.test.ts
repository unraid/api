import { describe, expect, it } from 'vitest';

import {
    findCycleInView,
    findDuplicateChildren,
    findMissingChildEntries,
    findOrphanedEntries,
    validateNestingDepth,
    validateViewStructure,
    viewRootExists,
} from '@app/unraid-api/organizer/organizer-view.validation.js';
import {
    OrganizerFolder,
    OrganizerResourceRef,
    OrganizerView,
} from '@app/unraid-api/organizer/organizer.dto.js';

// Helper functions to create test data
function createFolder(id: string, name: string, children: string[] = []): OrganizerFolder {
    return {
        id,
        type: 'folder',
        name,
        children,
    };
}

function createResourceRef(id: string, target: string): OrganizerResourceRef {
    return {
        id,
        type: 'ref',
        target,
    };
}

function createView(
    id: string,
    name: string,
    root: string,
    entries: Record<string, OrganizerFolder | OrganizerResourceRef>
): OrganizerView {
    return {
        id,
        name,
        root,
        entries,
    };
}

describe('viewRootExists', () => {
    it('should return true when root entry exists', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root Folder'),
        });

        expect(viewRootExists(view)).toBe(true);
    });

    it('should return false when root entry does not exist', () => {
        const view = createView('view1', 'Test View', 'nonexistent', {
            root1: createFolder('root1', 'Root Folder'),
        });

        expect(viewRootExists(view)).toBe(false);
    });

    it('should return false when entries is empty', () => {
        const view = createView('view1', 'Test View', 'root1', {});

        expect(viewRootExists(view)).toBe(false);
    });
});

describe('findMissingChildEntries', () => {
    it('should return empty array when all children exist', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1', 'child2']),
            child1: createFolder('child1', 'Child 1'),
            child2: createResourceRef('child2', 'resource1'),
        });

        const result = findMissingChildEntries(view);
        expect(result).toEqual([]);
    });

    it('should find missing child entries', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1', 'missing1']),
            child1: createFolder('child1', 'Child 1', ['missing2']),
        });

        const result = findMissingChildEntries(view);
        expect(result).toEqual([
            { parentId: 'root1', missingChildId: 'missing1' },
            { parentId: 'child1', missingChildId: 'missing2' },
        ]);
    });

    it('should handle empty children array', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', []),
        });

        const result = findMissingChildEntries(view);
        expect(result).toEqual([]);
    });

    it('should handle resource refs (which have no children)', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createResourceRef('root1', 'resource1'),
        });

        const result = findMissingChildEntries(view);
        expect(result).toEqual([]);
    });

    it('should handle folder with invalid children property', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: { ...createFolder('root1', 'Root'), children: null as any },
        });

        const result = findMissingChildEntries(view);
        expect(result).toEqual([]);
    });
});

describe('findDuplicateChildren', () => {
    it('should return empty array when no duplicates exist', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1', 'child2', 'child3']),
            child1: createFolder('child1', 'Child 1'),
            child2: createFolder('child2', 'Child 2'),
            child3: createResourceRef('child3', 'resource1'),
        });

        const result = findDuplicateChildren(view);
        expect(result).toEqual([]);
    });

    it('should find duplicate children in folders', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1', 'child2', 'child1']),
            folder2: createFolder('folder2', 'Folder 2', ['child3', 'child3', 'child4', 'child3']),
            child1: createFolder('child1', 'Child 1'),
            child2: createFolder('child2', 'Child 2'),
            child3: createFolder('child3', 'Child 3'),
            child4: createFolder('child4', 'Child 4'),
        });

        const result = findDuplicateChildren(view);
        expect(result).toEqual([
            { folderId: 'root1', duplicateId: 'child1' },
            { folderId: 'folder2', duplicateId: 'child3' },
            { folderId: 'folder2', duplicateId: 'child3' },
        ]);
    });

    it('should handle multiple duplicates of same child', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1', 'child1', 'child1']),
            child1: createFolder('child1', 'Child 1'),
        });

        const result = findDuplicateChildren(view);
        expect(result).toEqual([
            { folderId: 'root1', duplicateId: 'child1' },
            { folderId: 'root1', duplicateId: 'child1' },
        ]);
    });

    it('should ignore resource refs', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createResourceRef('root1', 'resource1'),
        });

        const result = findDuplicateChildren(view);
        expect(result).toEqual([]);
    });

    it('should handle empty children array', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', []),
        });

        const result = findDuplicateChildren(view);
        expect(result).toEqual([]);
    });
});

describe('findCycleInView', () => {
    it('should return null when no cycle exists', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1', 'child2']),
            child1: createFolder('child1', 'Child 1', ['grandchild1']),
            child2: createResourceRef('child2', 'resource1'),
            grandchild1: createResourceRef('grandchild1', 'resource2'),
        });

        const result = findCycleInView(view);
        expect(result).toBeNull();
    });

    it('should detect direct self-reference cycle', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['root1']),
        });

        const result = findCycleInView(view);
        expect(result).toEqual(['root1', 'root1']);
    });

    it('should detect simple two-node cycle', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1']),
            child1: createFolder('child1', 'Child 1', ['root1']),
        });

        const result = findCycleInView(view);
        expect(result).toEqual(['root1', 'child1', 'root1']);
    });

    it('should handle missing root entry', () => {
        const view = createView('view1', 'Test View', 'nonexistent', {
            root1: createFolder('root1', 'Root', ['child1']),
            child1: createFolder('child1', 'Child 1'),
        });

        const result = findCycleInView(view);
        expect(result).toBeNull();
    });

    it('should handle resource refs (no children)', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createResourceRef('root1', 'resource1'),
        });

        const result = findCycleInView(view);
        expect(result).toBeNull();
    });

    it('should handle folder with invalid children property', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: { ...createFolder('root1', 'Root'), children: null as any },
        });

        const result = findCycleInView(view);
        expect(result).toBeNull();
    });

    it('should detect cycle in tree structure', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1']),
            child1: createFolder('child1', 'Child 1', ['child2']),
            child2: createFolder('child2', 'Child 2', ['child3']),
            child3: createFolder('child3', 'Child 3', ['child1']),
        });

        const result = findCycleInView(view);
        expect(result).toEqual(['child1', 'child2', 'child3', 'child1']);
    });
});

describe('validateNestingDepth', () => {
    it('should return true for shallow nesting', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1']),
            child1: createFolder('child1', 'Child 1', ['grandchild1']),
            grandchild1: createResourceRef('grandchild1', 'resource1'),
        });

        expect(validateNestingDepth(view)).toBe(true);
        expect(validateNestingDepth(view, 10)).toBe(true);
    });

    it('should return false when exceeding max depth', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1']),
            child1: createFolder('child1', 'Child 1', ['child2']),
            child2: createFolder('child2', 'Child 2', ['child3']),
            child3: createResourceRef('child3', 'resource1'),
        });

        expect(validateNestingDepth(view, 2)).toBe(false);
        expect(validateNestingDepth(view, 3)).toBe(true);
    });

    it('should handle single node at root', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createResourceRef('root1', 'resource1'),
        });

        expect(validateNestingDepth(view, 0)).toBe(true);
        expect(validateNestingDepth(view, 1)).toBe(true);
    });

    it('should handle missing root entry', () => {
        const view = createView('view1', 'Test View', 'nonexistent', {
            root1: createFolder('root1', 'Root', ['child1']),
            child1: createFolder('child1', 'Child 1'),
        });

        expect(validateNestingDepth(view)).toBe(true);
    });

    it('should handle folder with invalid children property', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: { ...createFolder('root1', 'Root'), children: null as any },
        });

        expect(validateNestingDepth(view)).toBe(true);
    });

    it('should use default max depth of 100', () => {
        // Create a deep structure that's within reasonable limits
        const entries: Record<string, OrganizerFolder | OrganizerResourceRef> = {};
        entries.root1 = createFolder('root1', 'Root', ['child1']);

        for (let i = 1; i < 50; i++) {
            entries[`child${i}`] = createFolder(`child${i}`, `Child ${i}`, [`child${i + 1}`]);
        }
        entries.child50 = createResourceRef('child50', 'resource1');

        const view = createView('view1', 'Test View', 'root1', entries);
        expect(validateNestingDepth(view)).toBe(true);
    });
});

describe('findOrphanedEntries', () => {
    it('should return empty array when all entries are reachable', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1', 'child2']),
            child1: createFolder('child1', 'Child 1', ['grandchild1']),
            child2: createResourceRef('child2', 'resource1'),
            grandchild1: createResourceRef('grandchild1', 'resource2'),
        });

        const result = findOrphanedEntries(view);
        expect(result).toEqual([]);
    });

    it('should find orphaned entries', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1']),
            child1: createResourceRef('child1', 'resource1'),
            orphan1: createFolder('orphan1', 'Orphan 1'),
            orphan2: createResourceRef('orphan2', 'resource2'),
        });

        const result = findOrphanedEntries(view);
        expect(result.sort()).toEqual(['orphan1', 'orphan2']);
    });

    it('should handle disconnected subgraphs', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1']),
            child1: createResourceRef('child1', 'resource1'),
            orphanParent: createFolder('orphanParent', 'Orphan Parent', ['orphanChild']),
            orphanChild: createResourceRef('orphanChild', 'resource2'),
        });

        const result = findOrphanedEntries(view);
        expect(result.sort()).toEqual(['orphanChild', 'orphanParent']);
    });

    it('should handle missing root entry', () => {
        const view = createView('view1', 'Test View', 'nonexistent', {
            entry1: createFolder('entry1', 'Entry 1'),
            entry2: createResourceRef('entry2', 'resource1'),
        });

        const result = findOrphanedEntries(view);
        expect(result.sort()).toEqual(['entry1', 'entry2']);
    });

    it('should handle single root entry', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createResourceRef('root1', 'resource1'),
        });

        const result = findOrphanedEntries(view);
        expect(result).toEqual([]);
    });

    it('should handle cycles correctly', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1']),
            child1: createFolder('child1', 'Child 1', ['child2']),
            child2: createFolder('child2', 'Child 2', ['child1']),
            orphan: createResourceRef('orphan', 'resource1'),
        });

        const result = findOrphanedEntries(view);
        expect(result).toEqual(['orphan']);
    });
});

describe('validateViewStructure', () => {
    it('should pass validation for a well-formed view', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1', 'child2']),
            child1: createFolder('child1', 'Child 1', ['grandchild1']),
            child2: createResourceRef('child2', 'resource1'),
            grandchild1: createResourceRef('grandchild1', 'resource2'),
        });

        const result = validateViewStructure(view);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
    });

    it('should fail validation when root is missing', () => {
        const view = createView('view1', 'Test View', 'nonexistent', {
            child1: createFolder('child1', 'Child 1'),
        });

        const result = validateViewStructure(view);
        expect(result.isValid).toBe(false);
        expect(result.errors.rootMissing).toBe(false);
    });

    it('should detect missing children', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1', 'missing']),
            child1: createResourceRef('child1', 'resource1'),
        });

        const result = validateViewStructure(view);
        expect(result.isValid).toBe(false);
        expect(result.errors.missingChildren).toEqual([
            { parentId: 'root1', missingChildId: 'missing' },
        ]);
    });

    it('should detect duplicate children', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1', 'child1']),
            child1: createResourceRef('child1', 'resource1'),
        });

        const result = validateViewStructure(view);
        expect(result.isValid).toBe(false);
        expect(result.errors.duplicateChildren).toEqual([{ folderId: 'root1', duplicateId: 'child1' }]);
    });

    it('should detect cycles', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1']),
            child1: createFolder('child1', 'Child 1', ['root1']),
        });

        const result = validateViewStructure(view);
        expect(result.isValid).toBe(false);
        expect(result.errors.cycles).toEqual(['root1', 'child1', 'root1']);
    });

    it('should detect excessive nesting depth', () => {
        const entries: Record<string, OrganizerFolder | OrganizerResourceRef> = {};
        entries.root1 = createFolder('root1', 'Root', ['child1']);

        // Create a structure that exceeds default depth of 100
        for (let i = 1; i <= 101; i++) {
            if (i < 101) {
                entries[`child${i}`] = createFolder(`child${i}`, `Child ${i}`, [`child${i + 1}`]);
            } else {
                entries[`child${i}`] = createResourceRef(`child${i}`, 'resource1');
            }
        }

        const view = createView('view1', 'Test View', 'root1', entries);
        const result = validateViewStructure(view);
        expect(result.isValid).toBe(false);
        expect(result.errors.exceedsMaxDepth).toBe(true);
    });

    it('should detect orphaned entries', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1']),
            child1: createResourceRef('child1', 'resource1'),
            orphan: createResourceRef('orphan', 'resource2'),
        });

        const result = validateViewStructure(view);
        expect(result.isValid).toBe(false);
        expect(result.errors.orphanedEntries).toEqual(['orphan']);
    });

    it('should collect multiple errors when not using fail-fast', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1', 'child1', 'missing']),
            child1: createResourceRef('child1', 'resource1'),
            orphan: createResourceRef('orphan', 'resource2'),
        });

        const result = validateViewStructure(view);
        expect(result.isValid).toBe(false);
        expect(Object.keys(result.errors)).toContain('missingChildren');
        expect(Object.keys(result.errors)).toContain('duplicateChildren');
        // Note: orphanedEntries will be detected since there are no cycles or depth issues
        expect(Object.keys(result.errors)).toContain('orphanedEntries');
    });

    it('should fail fast on missing root with alwaysFailFast', () => {
        const view = createView('view1', 'Test View', 'nonexistent', {
            child1: createFolder('child1', 'Child 1', ['child1']), // This would create a cycle
            orphan: createResourceRef('orphan', 'resource1'), // This would be orphaned
        });

        const result = validateViewStructure(view);
        expect(result.isValid).toBe(false);
        expect(result.errors.rootMissing).toBe(false);
        // Other errors should not be present due to fail-fast
        expect(result.errors.cycles).toBeUndefined();
        expect(result.errors.orphanedEntries).toBeUndefined();
    });

    it('should fail fast on cycles with alwaysFailFast', () => {
        const view = createView('view1', 'Test View', 'root1', {
            root1: createFolder('root1', 'Root', ['child1']),
            child1: createFolder('child1', 'Child 1', ['root1']),
            orphan: createResourceRef('orphan', 'resource1'), // This would be orphaned
        });

        const result = validateViewStructure(view);
        expect(result.isValid).toBe(false);
        expect(result.errors.cycles).toEqual(['root1', 'child1', 'root1']);
        // Orphaned entries should not be checked due to fail-fast
        expect(result.errors.orphanedEntries).toBeUndefined();
    });
});
