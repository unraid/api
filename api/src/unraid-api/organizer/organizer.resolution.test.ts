import { describe, expect, test } from 'vitest';

import {
    OrganizerResource,
    OrganizerV1,
    ResolvedOrganizerEntryType,
    ResolvedOrganizerFolder,
    ResolvedOrganizerV1,
} from '@app/unraid-api/organizer/organizer.dto.js';
import { resolveOrganizer } from '@app/unraid-api/organizer/organizer.js';

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
        expect(defaultView.root.type).toBe('folder');

        if (defaultView.root.type === 'folder') {
            const rootFolder = defaultView.root as ResolvedOrganizerFolder;
            expect(rootFolder.name).toBe('Root');
            expect(rootFolder.children).toHaveLength(2);

            // First child should be the resolved container1
            const firstChild = rootFolder.children[0];
            expect(firstChild.type).toBe('container');
            expect(firstChild.id).toBe('container1');
            expect(firstChild.name).toBe('My Container');

            // Second child should be the resolved subfolder
            const secondChild = rootFolder.children[1];
            expect(secondChild.type).toBe('folder');
            if (secondChild.type === 'folder') {
                const subFolder = secondChild as ResolvedOrganizerFolder;
                expect(subFolder.name).toBe('Subfolder');
                expect(subFolder.children).toHaveLength(1);

                const nestedChild = subFolder.children[0];
                expect(nestedChild.type).toBe('container');
                expect(nestedChild.id).toBe('container2');
                expect(nestedChild.name).toBe('Another Container');
            }
        }
    });

    test('should throw error for missing resource', () => {
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

        expect(() => resolveOrganizer(organizer)).toThrow(
            "Resource with id 'nonexistent-resource' not found"
        );
    });

    test('should throw error for missing entry', () => {
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

        expect(() => resolveOrganizer(organizer)).toThrow(
            "Entry with id 'nonexistent-entry' not found in view"
        );
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
        expect(defaultView.root.type).toBe('folder');

        if (defaultView.root.type === 'folder') {
            const rootFolder = defaultView.root as ResolvedOrganizerFolder;
            expect(rootFolder.name).toBe('Root');
            expect(rootFolder.children).toHaveLength(2);

            // First child should be the resolved container
            const firstChild = rootFolder.children[0];
            expect(firstChild.type).toBe('container');
            expect(firstChild.id).toBe('container1');

            // Second child should be the resolved empty folder
            const secondChild = rootFolder.children[1];
            expect(secondChild.type).toBe('folder');
            expect(secondChild.id).toBe('empty-folder');

            if (secondChild.type === 'folder') {
                const emptyFolder = secondChild as ResolvedOrganizerFolder;
                expect(emptyFolder.name).toBe('Empty Folder');
                expect(emptyFolder.children).toEqual([]);
                expect(emptyFolder.children).toHaveLength(0);
            }
        }
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
        expect(defaultView.root.type).toBe('folder');

        if (defaultView.root.type === 'folder') {
            const rootFolder = defaultView.root as ResolvedOrganizerFolder;
            expect(rootFolder.children).toHaveLength(4);

            // Last child should be the empty folder (not an empty object)
            const lastChild = rootFolder.children[3];
            expect(lastChild).not.toEqual({}); // This should NOT be an empty object
            expect(lastChild.type).toBe('folder');
            expect(lastChild.id).toBe('new-folder');

            if (lastChild.type === 'folder') {
                const newFolder = lastChild as ResolvedOrganizerFolder;
                expect(newFolder.name).toBe('new-folder');
                expect(newFolder.children).toEqual([]);
            }
        }
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
        expect(defaultView.root.type).toBe('folder');

        if (defaultView.root.type === 'folder') {
            const rootFolder = defaultView.root as ResolvedOrganizerFolder;
            expect(rootFolder.children).toHaveLength(1);

            const level1Folder = rootFolder.children[0];
            expect(level1Folder.type).toBe('folder');
            expect(level1Folder.id).toBe('level1-folder');

            if (level1Folder.type === 'folder') {
                const level1 = level1Folder as ResolvedOrganizerFolder;
                expect(level1.children).toHaveLength(1);

                const level2Folder = level1.children[0];
                expect(level2Folder.type).toBe('folder');
                expect(level2Folder.id).toBe('level2-folder');

                if (level2Folder.type === 'folder') {
                    const level2 = level2Folder as ResolvedOrganizerFolder;
                    expect(level2.children).toEqual([]);
                    expect(level2.children).toHaveLength(0);
                }
            }
        }
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

        // Recursively validate that all objects have proper structure
        function validateResolvedEntry(entry: ResolvedOrganizerEntryType) {
            expect(entry).toBeDefined();
            expect(entry).not.toEqual({});
            expect(entry).toHaveProperty('id');
            expect(entry).toHaveProperty('type');
            expect(entry).toHaveProperty('name');
            expect(typeof entry.id).toBe('string');
            expect(typeof entry.type).toBe('string');
            expect(typeof entry.name).toBe('string');

            if (entry.type === 'folder') {
                const folder = entry as ResolvedOrganizerFolder;
                expect(folder).toHaveProperty('children');
                expect(Array.isArray(folder.children)).toBe(true);

                // Recursively validate children
                folder.children.forEach((child) => validateResolvedEntry(child));
            }
        }

        if (resolved.views[0].root.type === 'folder') {
            validateResolvedEntry(resolved.views[0].root);
        }
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

        if (resolved.views[0].root.type === 'folder') {
            const rootFolder = resolved.views[0].root as ResolvedOrganizerFolder;
            expect(rootFolder.children).toHaveLength(3);

            // Ensure none of the children are empty objects
            rootFolder.children.forEach((child, index) => {
                expect(child).not.toEqual({});
                expect(child.type).toBe('folder');
                expect(child.id).toBe(`empty${index + 1}`);
                expect(child.name).toBe(`Empty ${index + 1}`);

                if (child.type === 'folder') {
                    const folder = child as ResolvedOrganizerFolder;
                    expect(folder.children).toEqual([]);
                }
            });
        }
    });
});
