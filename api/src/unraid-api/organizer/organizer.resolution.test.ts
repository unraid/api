import { describe, expect, test } from 'vitest';

import {
    OrganizerResource,
    OrganizerV1,
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
});
