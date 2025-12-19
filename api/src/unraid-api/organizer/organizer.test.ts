import { describe, expect, it } from 'vitest';

import { addMissingResourcesToView } from '@app/unraid-api/organizer/organizer.js';
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
});
