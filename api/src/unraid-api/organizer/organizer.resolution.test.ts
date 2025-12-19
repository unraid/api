import { describe, expect, test } from 'vitest';

import { resolveOrganizer } from '@app/unraid-api/organizer/organizer.js';
import {
    OrganizerResource,
    OrganizerV1,
    ResolvedOrganizerV1,
} from '@app/unraid-api/organizer/organizer.model.js';

describe('Organizer Resolver', () => {
    test('should resolve a simple organizer structure', () => {
        const resource1: OrganizerResource = {
            id: 'container1',
            type: 'container',
            name: 'My Container',
            meta: { status: 'running' },
        };

        const resource2: OrganizerResource = {
            id: 'container2',
            type: 'container',
            name: 'Another Container',
            meta: { status: 'stopped' },
        };

        const organizer: OrganizerV1 = {
            version: 1,
            resources: {
                container1: resource1,
                container2: resource2,
            },
            views: {
                default: {
                    id: 'default',
                    name: 'Default View',
                    root: 'root-folder',
                    entries: {
                        'root-folder': {
                            id: 'root-folder',
                            type: 'folder',
                            name: 'Root',
                            children: ['container1-ref', 'subfolder'],
                        },
                        'container1-ref': {
                            id: 'container1-ref',
                            type: 'ref',
                            target: 'container1',
                        },
                        subfolder: {
                            id: 'subfolder',
                            type: 'folder',
                            name: 'Subfolder',
                            children: ['container2-ref'],
                        },
                        'container2-ref': {
                            id: 'container2-ref',
                            type: 'ref',
                            target: 'container2',
                        },
                    },
                },
            },
        };

        const resolved: ResolvedOrganizerV1 = resolveOrganizer(organizer);

        expect(resolved.version).toBe(1);
        expect(resolved.views).toHaveLength(1);

        const defaultView = resolved.views[0];
        expect(defaultView.id).toBe('default');
        expect(defaultView.name).toBe('Default View');
        expect(defaultView.rootId).toBe('root-folder');

        // Check flatEntries structure
        const flatEntries = defaultView.flatEntries;
        expect(flatEntries).toHaveLength(4);

        // Root folder
        const rootEntry = flatEntries[0];
        expect(rootEntry.id).toBe('root-folder');
        expect(rootEntry.type).toBe('folder');
        expect(rootEntry.name).toBe('Root');
        expect(rootEntry.depth).toBe(0);
        expect(rootEntry.parentId).toBeUndefined();
        expect(rootEntry.childrenIds).toEqual(['container1-ref', 'subfolder']);

        // First child (container1-ref resolved to container)
        const container1Entry = flatEntries[1];
        expect(container1Entry.id).toBe('container1-ref');
        expect(container1Entry.type).toBe('container');
        expect(container1Entry.name).toBe('My Container');
        expect(container1Entry.depth).toBe(1);
        expect(container1Entry.parentId).toBe('root-folder');

        // Subfolder
        const subfolderEntry = flatEntries[2];
        expect(subfolderEntry.id).toBe('subfolder');
        expect(subfolderEntry.type).toBe('folder');
        expect(subfolderEntry.name).toBe('Subfolder');
        expect(subfolderEntry.depth).toBe(1);
        expect(subfolderEntry.parentId).toBe('root-folder');
        expect(subfolderEntry.childrenIds).toEqual(['container2-ref']);

        // Nested container
        const container2Entry = flatEntries[3];
        expect(container2Entry.id).toBe('container2-ref');
        expect(container2Entry.type).toBe('container');
        expect(container2Entry.name).toBe('Another Container');
        expect(container2Entry.depth).toBe(2);
        expect(container2Entry.parentId).toBe('subfolder');
    });

    test('should handle missing resource gracefully', () => {
        const organizer: OrganizerV1 = {
            version: 1,
            resources: {},
            views: {
                default: {
                    id: 'default',
                    name: 'Default View',
                    root: 'root-folder',
                    entries: {
                        'root-folder': {
                            id: 'root-folder',
                            type: 'folder',
                            name: 'Root',
                            children: ['missing-ref'],
                        },
                        'missing-ref': {
                            id: 'missing-ref',
                            type: 'ref',
                            target: 'nonexistent-resource',
                        },
                    },
                },
            },
        };

        const resolved = resolveOrganizer(organizer);
        const flatEntries = resolved.views[0].flatEntries;

        // Should have 2 entries: root folder and the ref (kept as ref type since resource not found)
        expect(flatEntries).toHaveLength(2);

        const missingRefEntry = flatEntries[1];
        expect(missingRefEntry.id).toBe('missing-ref');
        expect(missingRefEntry.type).toBe('ref'); // Stays as ref when resource not found
        expect(missingRefEntry.meta).toBeUndefined();
    });

    test('should skip missing entries gracefully', () => {
        const organizer: OrganizerV1 = {
            version: 1,
            resources: {},
            views: {
                default: {
                    id: 'default',
                    name: 'Default View',
                    root: 'root-folder',
                    entries: {
                        'root-folder': {
                            id: 'root-folder',
                            type: 'folder',
                            name: 'Root',
                            children: ['nonexistent-entry'],
                        },
                    },
                },
            },
        };

        const resolved = resolveOrganizer(organizer);
        const flatEntries = resolved.views[0].flatEntries;

        // Should only have root folder, missing entry is skipped
        expect(flatEntries).toHaveLength(1);
        expect(flatEntries[0].id).toBe('root-folder');
    });

    test('should resolve empty folders correctly', () => {
        const resource1: OrganizerResource = {
            id: 'container1',
            type: 'container',
            name: 'My Container',
            meta: { status: 'running' },
        };

        const organizer: OrganizerV1 = {
            version: 1,
            resources: {
                container1: resource1,
            },
            views: {
                default: {
                    id: 'default',
                    name: 'Default View',
                    root: 'root',
                    entries: {
                        root: {
                            id: 'root',
                            type: 'folder',
                            name: 'Root',
                            children: ['container1-ref', 'empty-folder'],
                        },
                        'container1-ref': {
                            id: 'container1-ref',
                            type: 'ref',
                            target: 'container1',
                        },
                        'empty-folder': {
                            id: 'empty-folder',
                            type: 'folder',
                            name: 'Empty Folder',
                            children: [],
                        },
                    },
                },
            },
        };

        const resolved: ResolvedOrganizerV1 = resolveOrganizer(organizer);

        expect(resolved.version).toBe(1);
        expect(resolved.views).toHaveLength(1);

        const defaultView = resolved.views[0];
        expect(defaultView.id).toBe('default');
        expect(defaultView.name).toBe('Default View');
        expect(defaultView.rootId).toBe('root');

        const flatEntries = defaultView.flatEntries;
        expect(flatEntries).toHaveLength(3);

        // Root folder
        expect(flatEntries[0].id).toBe('root');
        expect(flatEntries[0].type).toBe('folder');
        expect(flatEntries[0].name).toBe('Root');

        // First child - resolved container
        expect(flatEntries[1].id).toBe('container1-ref');
        expect(flatEntries[1].type).toBe('container');
        expect(flatEntries[1].name).toBe('My Container');

        // Second child - empty folder
        expect(flatEntries[2].id).toBe('empty-folder');
        expect(flatEntries[2].type).toBe('folder');
        expect(flatEntries[2].name).toBe('Empty Folder');
        expect(flatEntries[2].childrenIds).toEqual([]);
        expect(flatEntries[2].hasChildren).toBe(false);
    });

    test('should handle real-world scenario with containers and empty folder', () => {
        // This test reproduces the exact scenario from the user's bug report
        const containerResource1: OrganizerResource = {
            id: '/act-CI--Main-API-Build-API-8f6f762e2ea5e48cb178455f5005cd2f1929c75ef1ddc16fea3d2af5d895e63e',
            type: 'container',
            name: 'act CI container',
            meta: { status: 'running' },
        };

        const containerResource2: OrganizerResource = {
            id: '/plugin-plugin-builder-run-3ba90f0a8568',
            type: 'container',
            name: 'plugin builder',
            meta: { status: 'exited' },
        };

        const containerResource3: OrganizerResource = {
            id: '/buildx_buildkit_unraid-builder0',
            type: 'container',
            name: 'buildx buildkit',
            meta: { status: 'running' },
        };

        const organizer: OrganizerV1 = {
            version: 1,
            resources: {
                '/act-CI--Main-API-Build-API-8f6f762e2ea5e48cb178455f5005cd2f1929c75ef1ddc16fea3d2af5d895e63e':
                    containerResource1,
                '/plugin-plugin-builder-run-3ba90f0a8568': containerResource2,
                '/buildx_buildkit_unraid-builder0': containerResource3,
            },
            views: {
                default: {
                    id: 'default',
                    name: 'Default',
                    root: 'root',
                    entries: {
                        root: {
                            id: 'root',
                            type: 'folder',
                            name: 'Root',
                            children: [
                                '/act-CI--Main-API-Build-API-8f6f762e2ea5e48cb178455f5005cd2f1929c75ef1ddc16fea3d2af5d895e63e',
                                '/plugin-plugin-builder-run-3ba90f0a8568',
                                '/buildx_buildkit_unraid-builder0',
                                'new-folder',
                            ],
                        },
                        '/act-CI--Main-API-Build-API-8f6f762e2ea5e48cb178455f5005cd2f1929c75ef1ddc16fea3d2af5d895e63e':
                            {
                                id: '/act-CI--Main-API-Build-API-8f6f762e2ea5e48cb178455f5005cd2f1929c75ef1ddc16fea3d2af5d895e63e',
                                type: 'ref',
                                target: '/act-CI--Main-API-Build-API-8f6f762e2ea5e48cb178455f5005cd2f1929c75ef1ddc16fea3d2af5d895e63e',
                            },
                        '/plugin-plugin-builder-run-3ba90f0a8568': {
                            id: '/plugin-plugin-builder-run-3ba90f0a8568',
                            type: 'ref',
                            target: '/plugin-plugin-builder-run-3ba90f0a8568',
                        },
                        '/buildx_buildkit_unraid-builder0': {
                            id: '/buildx_buildkit_unraid-builder0',
                            type: 'ref',
                            target: '/buildx_buildkit_unraid-builder0',
                        },
                        'new-folder': {
                            id: 'new-folder',
                            type: 'folder',
                            name: 'new-folder',
                            children: [],
                        },
                    },
                },
            },
        };

        const resolved: ResolvedOrganizerV1 = resolveOrganizer(organizer);

        expect(resolved.version).toBe(1);
        expect(resolved.views).toHaveLength(1);

        const defaultView = resolved.views[0];
        expect(defaultView.rootId).toBe('root');

        const flatEntries = defaultView.flatEntries;
        expect(flatEntries).toHaveLength(5); // root + 3 containers + empty folder

        // Last entry should be the empty folder (not missing or malformed)
        const lastEntry = flatEntries[4];
        expect(lastEntry).toBeDefined();
        expect(lastEntry.type).toBe('folder');
        expect(lastEntry.id).toBe('new-folder');
        expect(lastEntry.name).toBe('new-folder');
        expect(lastEntry.childrenIds).toEqual([]);
        expect(lastEntry.hasChildren).toBe(false);
    });

    test('should handle nested empty folders correctly', () => {
        const organizer: OrganizerV1 = {
            version: 1,
            resources: {},
            views: {
                default: {
                    id: 'default',
                    name: 'Default View',
                    root: 'root',
                    entries: {
                        root: {
                            id: 'root',
                            type: 'folder',
                            name: 'Root',
                            children: ['level1-folder'],
                        },
                        'level1-folder': {
                            id: 'level1-folder',
                            type: 'folder',
                            name: 'Level 1 Folder',
                            children: ['level2-folder'],
                        },
                        'level2-folder': {
                            id: 'level2-folder',
                            type: 'folder',
                            name: 'Level 2 Folder',
                            children: [],
                        },
                    },
                },
            },
        };

        const resolved: ResolvedOrganizerV1 = resolveOrganizer(organizer);

        expect(resolved.version).toBe(1);
        expect(resolved.views).toHaveLength(1);

        const defaultView = resolved.views[0];
        expect(defaultView.rootId).toBe('root');

        const flatEntries = defaultView.flatEntries;
        expect(flatEntries).toHaveLength(3);

        // Root
        expect(flatEntries[0].id).toBe('root');
        expect(flatEntries[0].depth).toBe(0);

        // Level 1 folder
        expect(flatEntries[1].id).toBe('level1-folder');
        expect(flatEntries[1].type).toBe('folder');
        expect(flatEntries[1].depth).toBe(1);
        expect(flatEntries[1].parentId).toBe('root');

        // Level 2 folder (empty)
        expect(flatEntries[2].id).toBe('level2-folder');
        expect(flatEntries[2].type).toBe('folder');
        expect(flatEntries[2].depth).toBe(2);
        expect(flatEntries[2].parentId).toBe('level1-folder');
        expect(flatEntries[2].childrenIds).toEqual([]);
        expect(flatEntries[2].hasChildren).toBe(false);
    });

    test('should validate that all resolved objects have proper structure', () => {
        const resource1: OrganizerResource = {
            id: 'container1',
            type: 'container',
            name: 'My Container',
            meta: { status: 'running' },
        };

        const organizer: OrganizerV1 = {
            version: 1,
            resources: {
                container1: resource1,
            },
            views: {
                default: {
                    id: 'default',
                    name: 'Default View',
                    root: 'root',
                    entries: {
                        root: {
                            id: 'root',
                            type: 'folder',
                            name: 'Root',
                            children: ['container1-ref', 'empty-folder'],
                        },
                        'container1-ref': {
                            id: 'container1-ref',
                            type: 'ref',
                            target: 'container1',
                        },
                        'empty-folder': {
                            id: 'empty-folder',
                            type: 'folder',
                            name: 'Empty Folder',
                            children: [],
                        },
                    },
                },
            },
        };

        const resolved: ResolvedOrganizerV1 = resolveOrganizer(organizer);

        // Validate that all flat entries have proper structure
        const flatEntries = resolved.views[0].flatEntries;
        expect(flatEntries).toHaveLength(3); // root + container + empty folder

        flatEntries.forEach((entry) => {
            expect(entry).toBeDefined();
            expect(entry).not.toEqual({});
            expect(entry).toHaveProperty('id');
            expect(entry).toHaveProperty('type');
            expect(entry).toHaveProperty('name');
            expect(entry).toHaveProperty('depth');
            expect(entry).toHaveProperty('childrenIds');
            expect(typeof entry.id).toBe('string');
            expect(typeof entry.type).toBe('string');
            expect(typeof entry.name).toBe('string');
            expect(typeof entry.depth).toBe('number');
            expect(Array.isArray(entry.childrenIds)).toBe(true);
        });
    });

    test('should maintain object identity and not return empty objects', () => {
        const organizer: OrganizerV1 = {
            version: 1,
            resources: {},
            views: {
                default: {
                    id: 'default',
                    name: 'Default View',
                    root: 'root',
                    entries: {
                        root: {
                            id: 'root',
                            type: 'folder',
                            name: 'Root',
                            children: ['empty1', 'empty2', 'empty3'],
                        },
                        empty1: {
                            id: 'empty1',
                            type: 'folder',
                            name: 'Empty 1',
                            children: [],
                        },
                        empty2: {
                            id: 'empty2',
                            type: 'folder',
                            name: 'Empty 2',
                            children: [],
                        },
                        empty3: {
                            id: 'empty3',
                            type: 'folder',
                            name: 'Empty 3',
                            children: [],
                        },
                    },
                },
            },
        };

        const resolved: ResolvedOrganizerV1 = resolveOrganizer(organizer);

        const flatEntries = resolved.views[0].flatEntries;
        expect(flatEntries).toHaveLength(4); // root + 3 empty folders

        // Ensure none of the entries are malformed
        const emptyFolders = flatEntries.slice(1); // Skip root
        emptyFolders.forEach((entry, index) => {
            expect(entry).not.toEqual({});
            expect(entry).toBeDefined();
            expect(entry.type).toBe('folder');
            expect(entry.id).toBe(`empty${index + 1}`);
            expect(entry.name).toBe(`Empty ${index + 1}`);
            expect(entry.childrenIds).toEqual([]);
            expect(entry.hasChildren).toBe(false);
        });
    });
});
