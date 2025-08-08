import { describe, expect, it } from 'vitest';

import {
    collectAncestors,
    collectDescendants,
    deleteOrganizerEntries,
    moveEntriesToFolder,
} from '@app/unraid-api/organizer/organizer.js';
import { OrganizerView } from '@app/unraid-api/organizer/organizer.model.js';

describe('collectDescendants', () => {
    const createMockView = (entries: Record<string, any>): OrganizerView => ({
        id: 'test-view',
        name: 'Test View',
        root: 'root',
        entries,
    });

    it('should collect single entry (resource ref)', () => {
        const view = createMockView({
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
        });

        const result = collectDescendants(view, 'resource1');

        expect(result).toEqual(new Set(['resource1']));
    });

    it('should collect folder with children', () => {
        const view = createMockView({
            folder1: {
                id: 'folder1',
                type: 'folder',
                name: 'Folder 1',
                children: ['resource1', 'resource2'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
            resource2: {
                id: 'resource2',
                type: 'ref',
                target: 'target2',
            },
        });

        const result = collectDescendants(view, 'folder1');

        expect(result).toEqual(new Set(['folder1', 'resource1', 'resource2']));
    });

    it('should collect nested folders recursively', () => {
        const view = createMockView({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['folder1', 'resource1'],
            },
            folder1: {
                id: 'folder1',
                type: 'folder',
                name: 'Folder 1',
                children: ['folder2', 'resource2'],
            },
            folder2: {
                id: 'folder2',
                type: 'folder',
                name: 'Folder 2',
                children: ['resource3'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
            resource2: {
                id: 'resource2',
                type: 'ref',
                target: 'target2',
            },
            resource3: {
                id: 'resource3',
                type: 'ref',
                target: 'target3',
            },
        });

        const result = collectDescendants(view, 'root');

        expect(result).toEqual(
            new Set(['root', 'folder1', 'resource1', 'folder2', 'resource2', 'resource3'])
        );
    });

    it('should handle empty folder', () => {
        const view = createMockView({
            emptyFolder: {
                id: 'emptyFolder',
                type: 'folder',
                name: 'Empty Folder',
                children: [],
            },
        });

        const result = collectDescendants(view, 'emptyFolder');

        expect(result).toEqual(new Set(['emptyFolder']));
    });

    it('should return empty set for non-existent entry', () => {
        const view = createMockView({});

        const result = collectDescendants(view, 'non-existent');

        expect(result).toEqual(new Set());
    });

    it('should handle circular references without infinite loop', () => {
        const view = createMockView({
            folder1: {
                id: 'folder1',
                type: 'folder',
                name: 'Folder 1',
                children: ['folder2'],
            },
            folder2: {
                id: 'folder2',
                type: 'folder',
                name: 'Folder 2',
                children: ['folder1', 'resource1'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
        });

        const result = collectDescendants(view, 'folder1');

        expect(result).toEqual(new Set(['folder1', 'folder2', 'resource1']));
    });

    it('should use provided collection when passed', () => {
        const view = createMockView({
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
        });

        const existingCollection = new Set(['existing-item']);
        const result = collectDescendants(view, 'resource1', existingCollection);

        expect(result).toEqual(new Set(['existing-item', 'resource1']));
        expect(result).toBe(existingCollection); // Should modify the same set
    });

    it('should handle deep nesting', () => {
        const entries: Record<string, any> = {};
        const expectedSet = new Set<string>();

        // Create a deeply nested structure: folder0 -> folder1 -> ... -> folder9 -> resource
        for (let i = 0; i < 10; i++) {
            const folderId = `folder${i}`;
            const nextId = i === 9 ? 'deepResource' : `folder${i + 1}`;

            entries[folderId] = {
                id: folderId,
                type: 'folder',
                name: `Folder ${i}`,
                children: [nextId],
            };
            expectedSet.add(folderId);
        }

        entries.deepResource = {
            id: 'deepResource',
            type: 'ref',
            target: 'deepTarget',
        };
        expectedSet.add('deepResource');

        const view = createMockView(entries);
        const result = collectDescendants(view, 'folder0');

        expect(result).toEqual(expectedSet);
    });

    it('should handle mixed content (folders and refs)', () => {
        const view = createMockView({
            mixedFolder: {
                id: 'mixedFolder',
                type: 'folder',
                name: 'Mixed Content',
                children: ['subFolder', 'resource1', 'resource2'],
            },
            subFolder: {
                id: 'subFolder',
                type: 'folder',
                name: 'Sub Folder',
                children: ['resource3'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
            resource2: {
                id: 'resource2',
                type: 'ref',
                target: 'target2',
            },
            resource3: {
                id: 'resource3',
                type: 'ref',
                target: 'target3',
            },
        });

        const result = collectDescendants(view, 'mixedFolder');

        expect(result).toEqual(
            new Set(['mixedFolder', 'subFolder', 'resource1', 'resource2', 'resource3'])
        );
    });

    it('should handle entries with children that do not exist in view', () => {
        const view = createMockView({
            brokenFolder: {
                id: 'brokenFolder',
                type: 'folder',
                name: 'Broken Folder',
                children: ['existingResource', 'nonExistentResource'],
            },
            existingResource: {
                id: 'existingResource',
                type: 'ref',
                target: 'target1',
            },
        });

        const result = collectDescendants(view, 'brokenFolder');

        expect(result).toEqual(new Set(['brokenFolder', 'existingResource']));
    });

    it('should handle self-referencing entry', () => {
        const view = createMockView({
            selfRef: {
                id: 'selfRef',
                type: 'folder',
                name: 'Self Reference',
                children: ['selfRef', 'resource1'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
        });

        const result = collectDescendants(view, 'selfRef');

        expect(result).toEqual(new Set(['selfRef', 'resource1']));
    });

    it('should preserve insertion order in the set', () => {
        const view = createMockView({
            folder: {
                id: 'folder',
                type: 'folder',
                name: 'Ordered Folder',
                children: ['c', 'a', 'b'],
            },
            a: { id: 'a', type: 'ref', target: 'targetA' },
            b: { id: 'b', type: 'ref', target: 'targetB' },
            c: { id: 'c', type: 'ref', target: 'targetC' },
        });

        const result = collectDescendants(view, 'folder');
        const resultArray = Array.from(result);

        expect(resultArray).toEqual(['folder', 'c', 'a', 'b']);
    });
});

describe('collectAncestors', () => {
    const createMockView = (entries: Record<string, any>): OrganizerView => ({
        id: 'test-view',
        name: 'Test View',
        root: 'root',
        entries,
    });

    it('should collect single entry with no parent', () => {
        const view = createMockView({
            orphan: {
                id: 'orphan',
                type: 'ref',
                target: 'target1',
            },
        });

        const result = collectAncestors(view, 'orphan');

        expect(result).toEqual(new Set(['orphan']));
    });

    it('should collect entry and its parent', () => {
        const view = createMockView({
            parent: {
                id: 'parent',
                type: 'folder',
                name: 'Parent',
                children: ['child'],
            },
            child: {
                id: 'child',
                type: 'ref',
                target: 'target1',
            },
        });

        const result = collectAncestors(view, 'child');

        expect(result).toEqual(new Set(['child', 'parent']));
    });

    it('should collect all ancestors up to root', () => {
        const view = createMockView({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['level1'],
            },
            level1: {
                id: 'level1',
                type: 'folder',
                name: 'Level 1',
                children: ['level2'],
            },
            level2: {
                id: 'level2',
                type: 'folder',
                name: 'Level 2',
                children: ['level3'],
            },
            level3: {
                id: 'level3',
                type: 'folder',
                name: 'Level 3',
                children: ['deepItem'],
            },
            deepItem: {
                id: 'deepItem',
                type: 'ref',
                target: 'target1',
            },
        });

        const result = collectAncestors(view, 'deepItem');

        expect(result).toEqual(new Set(['deepItem', 'level3', 'level2', 'level1', 'root']));
    });

    it('should return empty set for non-existent entry', () => {
        const view = createMockView({});

        const result = collectAncestors(view, 'non-existent');

        expect(result).toEqual(new Set());
    });

    it('should handle folders with multiple children', () => {
        const view = createMockView({
            parent: {
                id: 'parent',
                type: 'folder',
                name: 'Parent',
                children: ['child1', 'child2', 'child3'],
            },
            child1: {
                id: 'child1',
                type: 'ref',
                target: 'target1',
            },
            child2: {
                id: 'child2',
                type: 'ref',
                target: 'target2',
            },
            child3: {
                id: 'child3',
                type: 'folder',
                name: 'Child 3',
                children: ['grandchild'],
            },
            grandchild: {
                id: 'grandchild',
                type: 'ref',
                target: 'target3',
            },
        });

        const result = collectAncestors(view, 'grandchild');

        expect(result).toEqual(new Set(['grandchild', 'child3', 'parent']));
    });

    it('should handle entry that is referenced by multiple parents (invalid but defensive)', () => {
        const view = createMockView({
            parent1: {
                id: 'parent1',
                type: 'folder',
                name: 'Parent 1',
                children: ['shared'],
            },
            parent2: {
                id: 'parent2',
                type: 'folder',
                name: 'Parent 2',
                children: ['shared'],
            },
            shared: {
                id: 'shared',
                type: 'ref',
                target: 'target1',
            },
        });

        const result = collectAncestors(view, 'shared');

        // Should find first parent (parent1 based on object iteration order)
        expect(result).toContain('shared');
        expect(result.size).toBe(2); // shared + one parent
    });

    it('should use provided collection when passed', () => {
        const view = createMockView({
            parent: {
                id: 'parent',
                type: 'folder',
                name: 'Parent',
                children: ['child'],
            },
            child: {
                id: 'child',
                type: 'ref',
                target: 'target1',
            },
        });

        const existingCollection = new Set(['existing-item']);
        const result = collectAncestors(view, 'child', existingCollection);

        expect(result).toEqual(new Set(['existing-item', 'child', 'parent']));
        expect(result).toBe(existingCollection); // Should modify the same set
    });

    it('should handle circular references gracefully', () => {
        const view = createMockView({
            folder1: {
                id: 'folder1',
                type: 'folder',
                name: 'Folder 1',
                children: ['folder2'],
            },
            folder2: {
                id: 'folder2',
                type: 'folder',
                name: 'Folder 2',
                children: ['folder1'], // Creates a cycle
            },
        });

        const result = collectAncestors(view, 'folder1');

        // Should handle the cycle without infinite loop
        expect(result.size).toBeGreaterThan(0);
        expect(result.has('folder1')).toBe(true);
    });

    it('should handle deeply nested structures efficiently', () => {
        const entries: Record<string, any> = {};

        // Create a deep chain of folders
        for (let i = 0; i < 100; i++) {
            const id = `folder${i}`;

            entries[id] = {
                id,
                type: 'folder',
                name: `Folder ${i}`,
                children: i < 99 ? [`folder${i + 1}`] : ['deepRef'],
            };
        }

        entries.deepRef = {
            id: 'deepRef',
            type: 'ref',
            target: 'deepTarget',
        };

        const view = createMockView(entries);
        const result = collectAncestors(view, 'deepRef');

        expect(result.size).toBe(101); // deepRef + 100 folders
        expect(result.has('deepRef')).toBe(true);
        expect(result.has('folder0')).toBe(true);
        expect(result.has('folder99')).toBe(true);
    });

    it('should stop at entry without parent', () => {
        const view = createMockView({
            grandparent: {
                id: 'grandparent',
                type: 'folder',
                name: 'Grandparent',
                children: ['parent'],
            },
            parent: {
                id: 'parent',
                type: 'folder',
                name: 'Parent',
                children: ['child'],
            },
            child: {
                id: 'child',
                type: 'ref',
                target: 'target1',
            },
            orphan: {
                id: 'orphan',
                type: 'folder',
                name: 'Orphan',
                children: [],
            },
        });

        // Start from an orphaned branch
        const result = collectAncestors(view, 'orphan');

        expect(result).toEqual(new Set(['orphan']));
    });

    it('should preserve insertion order in the set', () => {
        const view = createMockView({
            a: {
                id: 'a',
                type: 'folder',
                name: 'A',
                children: ['b'],
            },
            b: {
                id: 'b',
                type: 'folder',
                name: 'B',
                children: ['c'],
            },
            c: {
                id: 'c',
                type: 'ref',
                target: 'target1',
            },
        });

        const result = collectAncestors(view, 'c');
        const resultArray = Array.from(result);

        expect(resultArray).toEqual(['c', 'b', 'a']);
    });
});

describe('deleteOrganizerEntries', () => {
    const createMockView = (entries: Record<string, any>): OrganizerView => ({
        id: 'test-view',
        name: 'Test View',
        root: 'root',
        entries,
    });

    it('should delete a single resource ref', () => {
        const view = createMockView({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['resource1', 'resource2'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
            resource2: {
                id: 'resource2',
                type: 'ref',
                target: 'target2',
            },
        });

        const result = deleteOrganizerEntries(view, new Set(['resource1']));

        expect(result.entries).toEqual({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['resource2'],
            },
            resource2: {
                id: 'resource2',
                type: 'ref',
                target: 'target2',
            },
        });
        expect(result).not.toBe(view); // Should return new object
    });

    it('should delete a folder and all its descendants', () => {
        const view = createMockView({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['folder1', 'resource1'],
            },
            folder1: {
                id: 'folder1',
                type: 'folder',
                name: 'Folder 1',
                children: ['resource2', 'resource3'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
            resource2: {
                id: 'resource2',
                type: 'ref',
                target: 'target2',
            },
            resource3: {
                id: 'resource3',
                type: 'ref',
                target: 'target3',
            },
        });

        const result = deleteOrganizerEntries(view, new Set(['folder1']));

        expect(result.entries).toEqual({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['resource1'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
        });
    });

    it('should delete multiple entries at once', () => {
        const view = createMockView({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['resource1', 'resource2', 'resource3'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
            resource2: {
                id: 'resource2',
                type: 'ref',
                target: 'target2',
            },
            resource3: {
                id: 'resource3',
                type: 'ref',
                target: 'target3',
            },
        });

        const result = deleteOrganizerEntries(view, new Set(['resource1', 'resource3']));

        expect(result.entries).toEqual({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['resource2'],
            },
            resource2: {
                id: 'resource2',
                type: 'ref',
                target: 'target2',
            },
        });
    });

    it('should delete nested folders recursively', () => {
        const view = createMockView({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['folder1'],
            },
            folder1: {
                id: 'folder1',
                type: 'folder',
                name: 'Folder 1',
                children: ['folder2'],
            },
            folder2: {
                id: 'folder2',
                type: 'folder',
                name: 'Folder 2',
                children: ['resource1'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
        });

        const result = deleteOrganizerEntries(view, new Set(['folder1']));

        expect(result.entries).toEqual({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: [],
            },
        });
    });

    it('should handle deletion of non-existent entries gracefully', () => {
        const view = createMockView({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['resource1'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
        });

        const result = deleteOrganizerEntries(view, new Set(['non-existent']));

        expect(result.entries).toEqual(view.entries);
    });

    it('should mutate original view when mutate=true', () => {
        const view = createMockView({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['resource1'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
        });

        const result = deleteOrganizerEntries(view, new Set(['resource1']), { mutate: true });

        expect(result).toBe(view); // Should return same object
        expect(result.entries).toEqual({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: [],
            },
        });
    });

    it('should not mutate original view when mutate=false (default)', () => {
        const view = createMockView({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['resource1'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
        });

        const originalEntries = structuredClone(view.entries);
        const result = deleteOrganizerEntries(view, new Set(['resource1']));

        expect(result).not.toBe(view); // Should return new object
        expect(view.entries).toEqual(originalEntries); // Original should be unchanged
        expect(result.entries).toEqual({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: [],
            },
        });
    });

    it('should handle entries referenced by multiple parents', () => {
        const view = createMockView({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['folder1', 'folder2'],
            },
            folder1: {
                id: 'folder1',
                type: 'folder',
                name: 'Folder 1',
                children: ['resource1'],
            },
            folder2: {
                id: 'folder2',
                type: 'folder',
                name: 'Folder 2',
                children: ['resource1', 'resource2'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
            resource2: {
                id: 'resource2',
                type: 'ref',
                target: 'target2',
            },
        });

        const result = deleteOrganizerEntries(view, new Set(['resource1']));

        expect(result.entries).toEqual({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['folder1', 'folder2'],
            },
            folder1: {
                id: 'folder1',
                type: 'folder',
                name: 'Folder 1',
                children: [],
            },
            folder2: {
                id: 'folder2',
                type: 'folder',
                name: 'Folder 2',
                children: ['resource2'],
            },
            resource2: {
                id: 'resource2',
                type: 'ref',
                target: 'target2',
            },
        });
    });

    it('should handle circular references during deletion', () => {
        const view = createMockView({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['folder1'],
            },
            folder1: {
                id: 'folder1',
                type: 'folder',
                name: 'Folder 1',
                children: ['folder2'],
            },
            folder2: {
                id: 'folder2',
                type: 'folder',
                name: 'Folder 2',
                children: ['folder1', 'resource1'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
        });

        const result = deleteOrganizerEntries(view, new Set(['folder1']));

        expect(result.entries).toEqual({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: [],
            },
        });
    });

    it('should handle deletion of root folder', () => {
        const view = createMockView({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['resource1'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
        });

        const result = deleteOrganizerEntries(view, new Set(['root']));

        expect(result.entries).toEqual({});
    });

    it('should handle empty deletion set', () => {
        const view = createMockView({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['resource1'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
        });

        const result = deleteOrganizerEntries(view, new Set());

        expect(result.entries).toEqual(view.entries);
        expect(result).not.toBe(view); // Should still return new object
    });

    it('should handle deletion when parent folders have broken references', () => {
        const view = createMockView({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['resource1', 'non-existent'],
            },
            brokenFolder: {
                id: 'brokenFolder',
                type: 'folder',
                name: 'Broken Folder',
                children: ['resource1', 'another-non-existent'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
        });

        const result = deleteOrganizerEntries(view, new Set(['resource1']));

        expect(result.entries).toEqual({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['non-existent'],
            },
            brokenFolder: {
                id: 'brokenFolder',
                type: 'folder',
                name: 'Broken Folder',
                children: ['another-non-existent'],
            },
        });
    });

    it('should handle deletion of all entries', () => {
        const view = createMockView({
            folder1: {
                id: 'folder1',
                type: 'folder',
                name: 'Folder 1',
                children: ['resource1'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
        });

        const result = deleteOrganizerEntries(view, new Set(['folder1', 'resource1']));

        expect(result.entries).toEqual({});
    });

    it('should handle self-referencing entries', () => {
        const view = createMockView({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['selfRef'],
            },
            selfRef: {
                id: 'selfRef',
                type: 'folder',
                name: 'Self Reference',
                children: ['selfRef', 'resource1'],
            },
            resource1: {
                id: 'resource1',
                type: 'ref',
                target: 'target1',
            },
        });

        const result = deleteOrganizerEntries(view, new Set(['selfRef']));

        expect(result.entries).toEqual({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: [],
            },
        });
    });

    it('should preserve order of remaining children after deletion', () => {
        const view = createMockView({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['a', 'b', 'c', 'd', 'e'],
            },
            a: { id: 'a', type: 'ref', target: 'targetA' },
            b: { id: 'b', type: 'ref', target: 'targetB' },
            c: { id: 'c', type: 'ref', target: 'targetC' },
            d: { id: 'd', type: 'ref', target: 'targetD' },
            e: { id: 'e', type: 'ref', target: 'targetE' },
        });

        const result = deleteOrganizerEntries(view, new Set(['b', 'd']));

        expect((result.entries.root as any).children).toEqual(['a', 'c', 'e']);
    });

    it('should handle complex nested structure with mixed deletion', () => {
        const view = createMockView({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['folder1', 'folder2', 'resource1'],
            },
            folder1: {
                id: 'folder1',
                type: 'folder',
                name: 'Folder 1',
                children: ['folder3', 'resource2'],
            },
            folder2: {
                id: 'folder2',
                type: 'folder',
                name: 'Folder 2',
                children: ['resource3'],
            },
            folder3: {
                id: 'folder3',
                type: 'folder',
                name: 'Folder 3',
                children: ['resource4'],
            },
            resource1: { id: 'resource1', type: 'ref', target: 'target1' },
            resource2: { id: 'resource2', type: 'ref', target: 'target2' },
            resource3: { id: 'resource3', type: 'ref', target: 'target3' },
            resource4: { id: 'resource4', type: 'ref', target: 'target4' },
        });

        const result = deleteOrganizerEntries(view, new Set(['folder1', 'resource1']));

        expect(result.entries).toEqual({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['folder2'],
            },
            folder2: {
                id: 'folder2',
                type: 'folder',
                name: 'Folder 2',
                children: ['resource3'],
            },
            resource3: { id: 'resource3', type: 'ref', target: 'target3' },
        });
    });

    it('should handle pre-collected descendants (dry run behavior)', () => {
        const view = createMockView({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['folder1', 'resource1'],
            },
            folder1: {
                id: 'folder1',
                type: 'folder',
                name: 'Folder 1',
                children: ['folder2', 'resource2'],
            },
            folder2: {
                id: 'folder2',
                type: 'folder',
                name: 'Folder 2',
                children: ['resource3'],
            },
            resource1: { id: 'resource1', type: 'ref', target: 'target1' },
            resource2: { id: 'resource2', type: 'ref', target: 'target2' },
            resource3: { id: 'resource3', type: 'ref', target: 'target3' },
        });

        // Method 1: Direct deletion
        const directResult = deleteOrganizerEntries(view, new Set(['folder1']));

        // Method 2: Pre-collect descendants (dry run), then delete
        const descendants = collectDescendants(view, 'folder1');
        const preCollectedResult = deleteOrganizerEntries(view, descendants);

        // Results should be identical
        expect(preCollectedResult.entries).toEqual(directResult.entries);
        expect(descendants).toEqual(new Set(['folder1', 'folder2', 'resource2', 'resource3']));

        // Both should produce the same final state
        const expectedEntries = {
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['resource1'],
            },
            resource1: { id: 'resource1', type: 'ref', target: 'target1' },
        };

        expect(directResult.entries).toEqual(expectedEntries);
        expect(preCollectedResult.entries).toEqual(expectedEntries);
    });

    it('should optimize when descendant collector is called with already-collected entries', () => {
        const view = createMockView({
            folder1: {
                id: 'folder1',
                type: 'folder',
                name: 'Folder 1',
                children: ['resource1', 'resource2'],
            },
            resource1: { id: 'resource1', type: 'ref', target: 'target1' },
            resource2: { id: 'resource2', type: 'ref', target: 'target2' },
        });

        // Track how many times the collector is meaningfully called
        let meaningfulCalls = 0;
        const trackingCollector = (view: OrganizerView, entryId: string, collection?: Set<string>) => {
            const initialSize = collection?.size ?? 0;
            const result = collectDescendants(view, entryId, collection);
            if (result.size > initialSize) {
                meaningfulCalls++;
            }
            return result;
        };

        // Pre-collect all descendants, then pass them to delete
        const allDescendants = collectDescendants(view, 'folder1');
        expect(allDescendants).toEqual(new Set(['folder1', 'resource1', 'resource2']));

        // Reset counter and delete with pre-collected descendants
        meaningfulCalls = 0;
        const result = deleteOrganizerEntries(view, allDescendants, {
            descendantCollector: trackingCollector,
        });

        // Only the first call should be meaningful (folder1),
        // subsequent calls for resource1 and resource2 should early-return
        expect(meaningfulCalls).toBe(1);
        expect(result.entries).toEqual({});
    });

    it('should demonstrate early return behavior with mixed pre-collected entries', () => {
        const view = createMockView({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['folder1', 'folder2'],
            },
            folder1: {
                id: 'folder1',
                type: 'folder',
                name: 'Folder 1',
                children: ['resource1'],
            },
            folder2: {
                id: 'folder2',
                type: 'folder',
                name: 'Folder 2',
                children: ['resource2'],
            },
            resource1: { id: 'resource1', type: 'ref', target: 'target1' },
            resource2: { id: 'resource2', type: 'ref', target: 'target2' },
        });

        // Collect descendants of folder1, then add folder2 manually
        const descendants = collectDescendants(view, 'folder1');
        descendants.add('folder2'); // Add folder2 but not its descendants

        // Track collection calls
        const collectionCalls: string[] = [];
        const trackingCollector = (view: OrganizerView, entryId: string, collection?: Set<string>) => {
            collectionCalls.push(entryId);
            return collectDescendants(view, entryId, collection);
        };

        const result = deleteOrganizerEntries(view, descendants, {
            descendantCollector: trackingCollector,
        });

        // Should have been called for each entry in the set
        expect(collectionCalls).toEqual(['folder1', 'resource1', 'folder2']);

        // folder1 and resource1 calls should early-return since they're already collected
        // folder2 call should collect its descendants (resource2)
        expect(result.entries).toEqual({
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: [],
            },
        });
    });
});

describe('moveEntriesToFolder', () => {
    const baseView: OrganizerView = {
        id: 'test-view',
        name: 'Test View',
        root: 'root',
        entries: {
            root: {
                id: 'root',
                type: 'folder',
                name: 'Root',
                children: ['folder1', 'folder2', 'ref1'],
            },
            folder1: {
                id: 'folder1',
                type: 'folder',
                name: 'Folder 1',
                children: ['ref2', 'folder3'],
            },
            folder2: {
                id: 'folder2',
                type: 'folder',
                name: 'Folder 2',
                children: [],
            },
            folder3: {
                id: 'folder3',
                type: 'folder',
                name: 'Folder 3',
                children: ['ref3'],
            },
            ref1: {
                id: 'ref1',
                type: 'ref',
                target: 'resource1',
            },
            ref2: {
                id: 'ref2',
                type: 'ref',
                target: 'resource2',
            },
            ref3: {
                id: 'ref3',
                type: 'ref',
                target: 'resource3',
            },
        },
    };

    it('should move a single entry to destination folder', () => {
        const result = moveEntriesToFolder({
            view: baseView,
            sourceEntryIds: new Set(['ref1']),
            destinationFolderId: 'folder2',
        });

        // ref1 should be removed from root and added to folder2
        expect((result.entries.root as any).children).toEqual(['folder1', 'folder2']);
        expect((result.entries.folder2 as any).children).toEqual(['ref1']);
    });

    it('should move multiple entries to destination folder', () => {
        const result = moveEntriesToFolder({
            view: baseView,
            sourceEntryIds: new Set(['ref1', 'folder1']),
            destinationFolderId: 'folder2',
        });

        // Both should be removed from root and added to folder2
        expect((result.entries.root as any).children).toEqual(['folder2']);
        expect((result.entries.folder2 as any).children).toEqual(['ref1', 'folder1']);
    });

    it('should move nested entries correctly', () => {
        const result = moveEntriesToFolder({
            view: baseView,
            sourceEntryIds: new Set(['ref2', 'folder3']),
            destinationFolderId: 'root',
        });

        // Both should be removed from folder1 and added to root
        expect((result.entries.folder1 as any).children).toEqual([]);
        expect((result.entries.root as any).children).toEqual([
            'folder1',
            'folder2',
            'ref1',
            'ref2',
            'folder3',
        ]);
    });

    it('should handle moving entries that are already in destination', () => {
        const result = moveEntriesToFolder({
            view: baseView,
            sourceEntryIds: new Set(['folder1', 'ref1']),
            destinationFolderId: 'root',
        });

        // They should remain in root, no duplicates, but order may change due to removal and re-addition
        expect((result.entries.root as any).children).toEqual(['folder2', 'folder1', 'ref1']);
    });

    it('should throw error when destination folder does not exist', () => {
        expect(() =>
            moveEntriesToFolder({
                view: baseView,
                sourceEntryIds: new Set(['ref1']),
                destinationFolderId: 'non-existent',
            })
        ).toThrow();
    });

    it('should throw error when destination is not a folder', () => {
        expect(() =>
            moveEntriesToFolder({
                view: baseView,
                sourceEntryIds: new Set(['folder1']),
                destinationFolderId: 'ref1',
            })
        ).toThrow();
    });

    it('should throw error when moving folder into itself', () => {
        expect(() =>
            moveEntriesToFolder({
                view: baseView,
                sourceEntryIds: new Set(['folder1']),
                destinationFolderId: 'folder1',
            })
        ).toThrow();
    });

    it('should throw error when moving folder into its descendant', () => {
        expect(() =>
            moveEntriesToFolder({
                view: baseView,
                sourceEntryIds: new Set(['folder1']),
                destinationFolderId: 'folder3',
            })
        ).toThrow();
    });

    it('should ignore non-existent source entries', () => {
        const result = moveEntriesToFolder({
            view: baseView,
            sourceEntryIds: new Set(['ref1', 'non-existent']),
            destinationFolderId: 'folder2',
        });

        // Only ref1 should be moved
        expect((result.entries.root as any).children).toEqual(['folder1', 'folder2']);
        expect((result.entries.folder2 as any).children).toEqual(['ref1']);
    });

    it('should handle empty source set', () => {
        const result = moveEntriesToFolder({
            view: baseView,
            sourceEntryIds: new Set(),
            destinationFolderId: 'folder2',
        });

        // Nothing should change
        expect(result).toEqual(baseView);
    });

    it('should not modify the original view', () => {
        const originalRootChildren = [...(baseView.entries.root as any).children];
        const originalFolder2Children = [...(baseView.entries.folder2 as any).children];

        moveEntriesToFolder({
            view: baseView,
            sourceEntryIds: new Set(['ref1']),
            destinationFolderId: 'folder2',
        });

        expect((baseView.entries.root as any).children).toEqual(originalRootChildren);
        expect((baseView.entries.folder2 as any).children).toEqual(originalFolder2Children);
    });

    it('should handle complex move with multiple sources and destinations', () => {
        // Create a view where some entries exist in multiple folders
        const complexView: OrganizerView = {
            ...baseView,
            entries: {
                ...baseView.entries,
                folder4: {
                    id: 'folder4',
                    type: 'folder',
                    name: 'Folder 4',
                    children: ['ref1', 'ref2'], // ref1 and ref2 also exist elsewhere
                },
            },
        };

        const result = moveEntriesToFolder({
            view: complexView,
            sourceEntryIds: new Set(['ref1', 'ref2']),
            destinationFolderId: 'folder3',
        });

        // ref1 should be removed from root and folder4
        expect((result.entries.root as any).children).toEqual(['folder1', 'folder2']);
        // ref2 should be removed from folder1 and folder4
        expect((result.entries.folder1 as any).children).toEqual(['folder3']);
        // folder4 should have no children left
        expect((result.entries.folder4 as any).children).toEqual([]);
        // Both should be in folder3 now
        expect((result.entries.folder3 as any).children).toEqual(['ref3', 'ref1', 'ref2']);
    });

    it('should preserve order when moving to a folder with existing children', () => {
        const result = moveEntriesToFolder({
            view: baseView,
            sourceEntryIds: new Set(['ref1', 'ref2']),
            destinationFolderId: 'folder2',
        });

        // New entries should be appended after existing children
        expect((result.entries.folder2 as any).children).toEqual(['ref1', 'ref2']);
    });

    it('should handle moving entries from deeply nested structures', () => {
        const deepView: OrganizerView = {
            ...baseView,
            entries: {
                ...baseView.entries,
                folder4: {
                    id: 'folder4',
                    type: 'folder',
                    name: 'Folder 4',
                    children: ['folder5'],
                },
                folder5: {
                    id: 'folder5',
                    type: 'folder',
                    name: 'Folder 5',
                    children: ['ref4'],
                },
                ref4: {
                    id: 'ref4',
                    type: 'ref',
                    target: 'resource4',
                },
            },
        };
        (deepView.entries.folder3 as any).children.push('folder4');

        const result = moveEntriesToFolder({
            view: deepView,
            sourceEntryIds: new Set(['ref4']),
            destinationFolderId: 'root',
        });

        expect((result.entries.folder5 as any).children).toEqual([]);
        expect((result.entries.root as any).children).toContain('ref4');
    });

    it('should handle circular reference prevention with multiple folders', () => {
        expect(() =>
            moveEntriesToFolder({
                view: baseView,
                sourceEntryIds: new Set(['root']),
                destinationFolderId: 'folder3',
            })
        ).toThrow();
    });

    it('should allow moving a parent and child together', () => {
        const result = moveEntriesToFolder({
            view: baseView,
            sourceEntryIds: new Set(['folder1', 'folder3']),
            destinationFolderId: 'folder2',
        });

        // Both folder1 and its child folder3 should move to folder2
        expect((result.entries.root as any).children).toEqual(['folder2', 'ref1']);
        expect((result.entries.folder2 as any).children).toEqual(['folder1', 'folder3']);
        // folder3 gets removed from folder1's children since it's also being moved independently
        expect((result.entries.folder1 as any).children).toEqual(['ref2']);
    });

    it('should efficiently handle large views with many folders', () => {
        // Create a large view with many nested folders
        const largeView: OrganizerView = {
            id: 'large-view',
            name: 'Large View',
            root: 'root',
            entries: {
                root: {
                    id: 'root',
                    type: 'folder',
                    name: 'Root',
                    children: ['branch1', 'branch2', 'targetFolder'],
                },
                targetFolder: {
                    id: 'targetFolder',
                    type: 'folder',
                    name: 'Target Folder',
                    children: [],
                },
            },
        };

        // Create two deep branches with many folders
        for (let branch = 1; branch <= 3; branch++) {
            let parentId = `branch${branch}`;
            largeView.entries[parentId] = {
                id: parentId,
                type: 'folder',
                name: `Branch ${branch}`,
                children: [],
            };

            // Create a deep hierarchy in each branch
            for (let i = 1; i <= 500; i++) {
                const folderId = `branch${branch}_folder${i}`;
                const refId = `branch${branch}_ref${i}`;

                largeView.entries[folderId] = {
                    id: folderId,
                    type: 'folder',
                    name: `Folder ${i}`,
                    children: [refId],
                };

                largeView.entries[refId] = {
                    id: refId,
                    type: 'ref',
                    target: `resource${branch}_${i}`,
                };

                // Add to parent's children
                (largeView.entries[parentId] as any).children.push(folderId);
                parentId = folderId;
            }
        }

        // Move multiple refs from different branches - should be fast since we only check folders
        const startTime = performance.now();
        const result = moveEntriesToFolder({
            view: largeView,
            sourceEntryIds: new Set([
                'branch1_ref50',
                'branch1_ref75',
                'branch2_ref25',
                'branch2_ref90',
            ]),
            destinationFolderId: 'targetFolder',
        });
        const endTime = performance.now();

        // Verify the move was successful
        expect((result.entries.targetFolder as any).children).toHaveLength(4);
        expect((result.entries.targetFolder as any).children).toContain('branch1_ref50');
        expect((result.entries.targetFolder as any).children).toContain('branch2_ref90');

        // Performance should be good even with 1500+ folders in the view
        expect(endTime - startTime).toBeLessThan(200); // Should complete in reasonable time
    });

    it('should efficiently detect circular moves without full descendant traversal', () => {
        // Create a view where we're moving a folder that's an ancestor of the destination
        const efficientView: OrganizerView = {
            id: 'efficient-view',
            name: 'Efficient View',
            root: 'root',
            entries: {
                root: {
                    id: 'root',
                    type: 'folder',
                    name: 'Root',
                    children: ['topFolder'],
                },
                topFolder: {
                    id: 'topFolder',
                    type: 'folder',
                    name: 'Top Folder',
                    children: ['middleFolder'],
                },
                middleFolder: {
                    id: 'middleFolder',
                    type: 'folder',
                    name: 'Middle Folder',
                    children: ['bottomFolder'],
                },
                bottomFolder: {
                    id: 'bottomFolder',
                    type: 'folder',
                    name: 'Bottom Folder',
                    children: ['deeplyNested'],
                },
                deeplyNested: {
                    id: 'deeplyNested',
                    type: 'folder',
                    name: 'Deeply Nested',
                    children: Array.from({ length: 100 }, (_, i) => `ref${i}`),
                },
            },
        };

        // Add many refs to the deeply nested folder
        for (let i = 0; i < 100; i++) {
            efficientView.entries[`ref${i}`] = {
                id: `ref${i}`,
                type: 'ref',
                target: `resource${i}`,
            };
        }

        // This should quickly detect the circular move by walking up from bottomFolder
        // without needing to traverse all descendants of topFolder
        expect(() =>
            moveEntriesToFolder({
                view: efficientView,
                sourceEntryIds: new Set(['topFolder']),
                destinationFolderId: 'bottomFolder',
            })
        ).toThrow();
    });
});
