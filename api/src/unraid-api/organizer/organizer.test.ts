import { describe, expect, it } from 'vitest';

import {
    addMissingResourcesToView,
    removeStaleRefsFromView,
} from '@app/unraid-api/organizer/organizer.js';
import {
    OrganizerFolder,
    OrganizerResource,
    OrganizerResourceRef,
    OrganizerV1,
    OrganizerView,
} from '@app/unraid-api/organizer/organizer.model.js';

describe('addMissingResourcesToView', () => {
    const mockResource1: OrganizerResource = {
        id: 'resource1',
        type: 'container',
        name: 'Container 1',
        meta: { status: 'running' },
    };

    const mockResource2: OrganizerResource = {
        id: 'resource2',
        type: 'vm',
        name: 'VM 1',
    };

    const mockResource3: OrganizerResource = {
        id: 'resource3',
        type: 'container',
        name: 'Container 2',
    };

    it('should add missing resources to an empty view', () => {
        const resources: OrganizerV1['resources'] = {
            resource1: mockResource1,
            resource2: mockResource2,
        };

        const originalView: OrganizerView = {
            id: 'view1',
            name: 'Test View',
            root: 'root1',
            entries: {},
        };

        const result = addMissingResourcesToView(resources, originalView);

        expect(result.entries['root1']).toBeDefined();
        expect(result.entries['root1'].type).toBe('folder');
        expect((result.entries['root1'] as OrganizerFolder).name).toBe('Test View');
        expect((result.entries['root1'] as OrganizerFolder).children).toEqual([
            'resource1',
            'resource2',
        ]);

        expect(result.entries['resource1']).toBeDefined();
        expect(result.entries['resource1'].type).toBe('ref');
        expect((result.entries['resource1'] as OrganizerResourceRef).target).toBe('resource1');

        expect(result.entries['resource2']).toBeDefined();
        expect(result.entries['resource2'].type).toBe('ref');
        expect((result.entries['resource2'] as OrganizerResourceRef).target).toBe('resource2');
    });

    it('should create root entry when missing', () => {
        const resources: OrganizerV1['resources'] = {
            resource1: mockResource1,
        };

        const originalView: OrganizerView = {
            id: 'view1',
            name: 'Test View',
            root: 'missing-root',
            entries: {},
        };

        const result = addMissingResourcesToView(resources, originalView);

        expect(result.entries['missing-root']).toBeDefined();
        expect(result.entries['missing-root'].type).toBe('folder');
        expect((result.entries['missing-root'] as OrganizerFolder).name).toBe('Test View');
        expect((result.entries['missing-root'] as OrganizerFolder).children).toEqual(['resource1']);
    });

    it('should not add resources that already exist in view', () => {
        const resources: OrganizerV1['resources'] = {
            resource1: mockResource1,
            resource2: mockResource2,
        };

        const originalView: OrganizerView = {
            id: 'view1',
            name: 'Test View',
            root: 'root1',
            entries: {
                root1: {
                    id: 'root1',
                    type: 'folder',
                    name: 'Test View',
                    children: ['resource1'],
                },
                resource1: {
                    id: 'resource1',
                    type: 'ref',
                    target: 'resource1',
                },
            },
        };

        const result = addMissingResourcesToView(resources, originalView);

        expect((result.entries['resource1'] as OrganizerResourceRef).target).toBe('resource1');
        expect(result.entries['resource2']).toBeDefined();
        expect((result.entries['resource2'] as OrganizerResourceRef).target).toBe('resource2');
        expect((result.entries['root1'] as OrganizerFolder).children).toEqual([
            'resource1',
            'resource2',
        ]);
    });

    it('should preserve existing root children without duplicates', () => {
        const resources: OrganizerV1['resources'] = {
            resource1: mockResource1,
            resource2: mockResource2,
            resource3: mockResource3,
        };

        const originalView: OrganizerView = {
            id: 'view1',
            name: 'Test View',
            root: 'root1',
            entries: {
                root1: {
                    id: 'root1',
                    type: 'folder',
                    name: 'Test View',
                    children: ['resource2', 'existing-folder'],
                },
                resource2: {
                    id: 'resource2',
                    type: 'ref',
                    target: 'resource2',
                },
                'existing-folder': {
                    id: 'existing-folder',
                    type: 'folder',
                    name: 'Existing Folder',
                    children: [],
                },
            },
        };

        const result = addMissingResourcesToView(resources, originalView);

        const rootChildren = (result.entries['root1'] as OrganizerFolder).children;
        expect(rootChildren).toContain('resource1');
        expect(rootChildren).toContain('resource2');
        expect(rootChildren).toContain('resource3');
        expect(rootChildren).toContain('existing-folder');
        expect(rootChildren.filter((id) => id === 'resource2')).toHaveLength(1);
        expect(rootChildren).toHaveLength(4);
    });

    it('should handle empty resources object', () => {
        const resources: OrganizerV1['resources'] = {};

        const originalView: OrganizerView = {
            id: 'view1',
            name: 'Test View',
            root: 'root1',
            entries: {
                root1: {
                    id: 'root1',
                    type: 'folder',
                    name: 'Test View',
                    children: ['existing-item'],
                },
            },
        };

        const result = addMissingResourcesToView(resources, originalView);

        expect((result.entries['root1'] as OrganizerFolder).children).toEqual(['existing-item']);
        expect(Object.keys(result.entries)).toHaveLength(1);
    });

    it('should not mutate the original view', () => {
        const resources: OrganizerV1['resources'] = {
            resource1: mockResource1,
        };

        const originalView: OrganizerView = {
            id: 'view1',
            name: 'Test View',
            root: 'root1',
            entries: {},
        };

        const originalEntriesCount = Object.keys(originalView.entries).length;
        const result = addMissingResourcesToView(resources, originalView);

        expect(Object.keys(originalView.entries)).toHaveLength(originalEntriesCount);
        expect(result).not.toBe(originalView);
        expect(result.entries).not.toBe(originalView.entries);
    });

    it('should handle duplicate children in existing root', () => {
        const resources: OrganizerV1['resources'] = {
            resource1: mockResource1,
        };

        const originalView: OrganizerView = {
            id: 'view1',
            name: 'Test View',
            root: 'root1',
            entries: {
                root1: {
                    id: 'root1',
                    type: 'folder',
                    name: 'Test View',
                    children: ['resource1', 'resource1', 'other-item'],
                },
                resource1: {
                    id: 'resource1',
                    type: 'ref',
                    target: 'resource1',
                },
            },
        };

        const result = addMissingResourcesToView(resources, originalView);

        const rootChildren = (result.entries['root1'] as OrganizerFolder).children;
        expect(rootChildren.filter((id) => id === 'resource1')).toHaveLength(1);
        expect(rootChildren).toContain('other-item');
        expect(rootChildren).toHaveLength(2);
    });

    it('should handle resources with different id than resource.id', () => {
        const resourceWithDifferentKey: OrganizerResource = {
            id: 'actual-resource-id',
            type: 'container',
            name: 'Container with different key',
        };

        const resources: OrganizerV1['resources'] = {
            'key-different-from-id': resourceWithDifferentKey,
        };

        const originalView: OrganizerView = {
            id: 'view1',
            name: 'Test View',
            root: 'root1',
            entries: {},
        };

        const result = addMissingResourcesToView(resources, originalView);

        expect(result.entries['key-different-from-id']).toBeDefined();
        expect(result.entries['key-different-from-id'].type).toBe('ref');
        expect((result.entries['key-different-from-id'] as OrganizerResourceRef).target).toBe(
            'actual-resource-id'
        );
        expect(result.entries['key-different-from-id'].id).toBe('actual-resource-id');
        expect((result.entries['root1'] as OrganizerFolder).children).toContain('key-different-from-id');
    });

    it("does not re-add resources to root if they're already referenced in any folder", () => {
        const resources: OrganizerV1['resources'] = {
            resourceA: { id: 'resourceA', type: 'container', name: 'A' },
            resourceB: { id: 'resourceB', type: 'container', name: 'B' },
        };

        const originalView: OrganizerView = {
            id: 'view1',
            name: 'Test View',
            root: 'root1',
            entries: {
                root1: {
                    id: 'root1',
                    type: 'folder',
                    name: 'Root',
                    children: ['stuff'],
                },
                stuff: {
                    id: 'stuff',
                    type: 'folder',
                    name: 'Stuff',
                    children: ['resourceA', 'resourceB'],
                },
                resourceA: { id: 'resourceA', type: 'ref', target: 'resourceA' },
                resourceB: { id: 'resourceB', type: 'ref', target: 'resourceB' },
            },
        };

        const result = addMissingResourcesToView(resources, originalView);

        // Root should still only contain the 'stuff' folder, not the resources
        const rootChildren = (result.entries['root1'] as OrganizerFolder).children;
        expect(rootChildren).toEqual(['stuff']);
    });

    it('should remove stale refs when resources are removed', () => {
        const resources: OrganizerV1['resources'] = {
            resource1: { id: 'resource1', type: 'container', name: 'Container 1' },
            // resource2 has been removed
        };

        const originalView: OrganizerView = {
            id: 'view1',
            name: 'Test View',
            root: 'root1',
            entries: {
                root1: {
                    id: 'root1',
                    type: 'folder',
                    name: 'Root',
                    children: ['resource1', 'resource2'],
                },
                resource1: { id: 'resource1', type: 'ref', target: 'resource1' },
                resource2: { id: 'resource2', type: 'ref', target: 'resource2' }, // stale ref
            },
        };

        const result = addMissingResourcesToView(resources, originalView);

        // resource2 should be removed from entries
        expect(result.entries['resource2']).toBeUndefined();
        // resource2 should be removed from root children
        const rootChildren = (result.entries['root1'] as OrganizerFolder).children;
        expect(rootChildren).not.toContain('resource2');
        expect(rootChildren).toContain('resource1');
    });

    it('should remove stale refs from nested folders', () => {
        const resources: OrganizerV1['resources'] = {
            resource1: { id: 'resource1', type: 'container', name: 'Container 1' },
            // resource2 and resource3 have been removed
        };

        const originalView: OrganizerView = {
            id: 'view1',
            name: 'Test View',
            root: 'root1',
            entries: {
                root1: {
                    id: 'root1',
                    type: 'folder',
                    name: 'Root',
                    children: ['folder1', 'resource1'],
                },
                folder1: {
                    id: 'folder1',
                    type: 'folder',
                    name: 'Nested Folder',
                    children: ['resource2', 'resource3'],
                },
                resource1: { id: 'resource1', type: 'ref', target: 'resource1' },
                resource2: { id: 'resource2', type: 'ref', target: 'resource2' }, // stale
                resource3: { id: 'resource3', type: 'ref', target: 'resource3' }, // stale
            },
        };

        const result = addMissingResourcesToView(resources, originalView);

        // stale refs should be removed
        expect(result.entries['resource2']).toBeUndefined();
        expect(result.entries['resource3']).toBeUndefined();
        // folder1 children should be empty
        const folder1Children = (result.entries['folder1'] as OrganizerFolder).children;
        expect(folder1Children).toEqual([]);
        // resource1 should still exist
        expect(result.entries['resource1']).toBeDefined();
    });
});

describe('removeStaleRefsFromView', () => {
    it('should remove refs pointing to non-existent resources', () => {
        const resources: OrganizerV1['resources'] = {
            resource1: { id: 'resource1', type: 'container', name: 'Container 1' },
        };

        const originalView: OrganizerView = {
            id: 'view1',
            name: 'Test View',
            root: 'root1',
            entries: {
                root1: {
                    id: 'root1',
                    type: 'folder',
                    name: 'Root',
                    children: ['resource1', 'stale-ref'],
                },
                resource1: { id: 'resource1', type: 'ref', target: 'resource1' },
                'stale-ref': { id: 'stale-ref', type: 'ref', target: 'non-existent-resource' },
            },
        };

        const result = removeStaleRefsFromView(resources, originalView);

        expect(result.entries['resource1']).toBeDefined();
        expect(result.entries['stale-ref']).toBeUndefined();
        expect((result.entries['root1'] as OrganizerFolder).children).toEqual(['resource1']);
    });

    it('should not remove folders even if empty', () => {
        const resources: OrganizerV1['resources'] = {};

        const originalView: OrganizerView = {
            id: 'view1',
            name: 'Test View',
            root: 'root1',
            entries: {
                root1: {
                    id: 'root1',
                    type: 'folder',
                    name: 'Root',
                    children: ['folder1'],
                },
                folder1: {
                    id: 'folder1',
                    type: 'folder',
                    name: 'Empty Folder',
                    children: [],
                },
            },
        };

        const result = removeStaleRefsFromView(resources, originalView);

        expect(result.entries['root1']).toBeDefined();
        expect(result.entries['folder1']).toBeDefined();
    });

    it('should remove multiple stale refs from multiple folders', () => {
        const resources: OrganizerV1['resources'] = {
            resource1: { id: 'resource1', type: 'container', name: 'Container 1' },
        };

        const originalView: OrganizerView = {
            id: 'view1',
            name: 'Test View',
            root: 'root1',
            entries: {
                root1: {
                    id: 'root1',
                    type: 'folder',
                    name: 'Root',
                    children: ['folder1', 'stale1'],
                },
                folder1: {
                    id: 'folder1',
                    type: 'folder',
                    name: 'Folder',
                    children: ['resource1', 'stale2', 'stale3'],
                },
                resource1: { id: 'resource1', type: 'ref', target: 'resource1' },
                stale1: { id: 'stale1', type: 'ref', target: 'gone1' },
                stale2: { id: 'stale2', type: 'ref', target: 'gone2' },
                stale3: { id: 'stale3', type: 'ref', target: 'gone3' },
            },
        };

        const result = removeStaleRefsFromView(resources, originalView);

        expect(result.entries['resource1']).toBeDefined();
        expect(result.entries['stale1']).toBeUndefined();
        expect(result.entries['stale2']).toBeUndefined();
        expect(result.entries['stale3']).toBeUndefined();
        expect((result.entries['root1'] as OrganizerFolder).children).toEqual(['folder1']);
        expect((result.entries['folder1'] as OrganizerFolder).children).toEqual(['resource1']);
    });

    it('should not mutate the original view', () => {
        const resources: OrganizerV1['resources'] = {};

        const originalView: OrganizerView = {
            id: 'view1',
            name: 'Test View',
            root: 'root1',
            entries: {
                root1: {
                    id: 'root1',
                    type: 'folder',
                    name: 'Root',
                    children: ['stale-ref'],
                },
                'stale-ref': { id: 'stale-ref', type: 'ref', target: 'gone' },
            },
        };

        const originalEntriesCount = Object.keys(originalView.entries).length;
        const result = removeStaleRefsFromView(resources, originalView);

        expect(Object.keys(originalView.entries)).toHaveLength(originalEntriesCount);
        expect(originalView.entries['stale-ref']).toBeDefined();
        expect(result).not.toBe(originalView);
    });

    it('should handle view with no refs', () => {
        const resources: OrganizerV1['resources'] = {
            resource1: { id: 'resource1', type: 'container', name: 'Container 1' },
        };

        const originalView: OrganizerView = {
            id: 'view1',
            name: 'Test View',
            root: 'root1',
            entries: {
                root1: {
                    id: 'root1',
                    type: 'folder',
                    name: 'Root',
                    children: ['folder1'],
                },
                folder1: {
                    id: 'folder1',
                    type: 'folder',
                    name: 'Sub Folder',
                    children: [],
                },
            },
        };

        const result = removeStaleRefsFromView(resources, originalView);

        expect(Object.keys(result.entries)).toHaveLength(2);
        expect(result.entries['root1']).toBeDefined();
        expect(result.entries['folder1']).toBeDefined();
    });
});
