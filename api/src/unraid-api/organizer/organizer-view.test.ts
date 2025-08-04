import { describe, expect, it } from 'vitest';

import { collectDescendants, deleteOrganizerEntries } from '@app/unraid-api/organizer/organizer.js';
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
