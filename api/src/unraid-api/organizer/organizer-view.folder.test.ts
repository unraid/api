import { describe, expect, it } from 'vitest';

import { OrganizerV1, OrganizerView } from '@app/unraid-api/organizer/organizer.dto.js';
import { createFolderInView, setFolderChildrenInView } from '@app/unraid-api/organizer/organizer.js';

describe('organizer', () => {
    describe('createFolderInView', () => {
        const baseView: OrganizerView = {
            id: 'test-view',
            name: 'Test View',
            root: 'root',
            entries: {
                root: {
                    id: 'root',
                    type: 'folder',
                    name: 'Root',
                    children: ['existing-child'],
                },
                'existing-child': {
                    id: 'existing-child',
                    type: 'ref',
                    target: 'some-resource',
                },
                'other-folder': {
                    id: 'other-folder',
                    type: 'folder',
                    name: 'Other Folder',
                    children: [],
                },
            },
        };

        it('should create a new folder in the root', () => {
            const result = createFolderInView({
                view: baseView,
                folderId: 'new-folder',
                folderName: 'New Folder',
                parentId: 'root',
            });

            expect(result.entries['new-folder']).toEqual({
                id: 'new-folder',
                type: 'folder',
                name: 'New Folder',
                children: [],
            });
            expect((result.entries.root as any).children).toEqual(['existing-child', 'new-folder']);
        });

        it('should create a new folder with children', () => {
            const childrenIds = ['child1', 'child2'];
            const result = createFolderInView({
                view: baseView,
                folderId: 'new-folder',
                folderName: 'New Folder',
                parentId: 'root',
                childrenIds,
            });

            expect(result.entries['new-folder']).toEqual({
                id: 'new-folder',
                type: 'folder',
                name: 'New Folder',
                children: childrenIds,
            });
        });

        it('should create a folder inside another folder', () => {
            const result = createFolderInView({
                view: baseView,
                folderId: 'nested-folder',
                folderName: 'Nested Folder',
                parentId: 'other-folder',
            });

            expect(result.entries['nested-folder']).toEqual({
                id: 'nested-folder',
                type: 'folder',
                name: 'Nested Folder',
                children: [],
            });
            expect((result.entries['other-folder'] as any).children).toEqual(['nested-folder']);
        });

        it('should not modify the original view', () => {
            const originalChildren = [...(baseView.entries.root as any).children];
            createFolderInView({
                view: baseView,
                folderId: 'new-folder',
                folderName: 'New Folder',
                parentId: 'root',
            });

            expect((baseView.entries.root as any).children).toEqual(originalChildren);
            expect(baseView.entries['new-folder']).toBeUndefined();
        });
    });

    describe('setFolderChildrenInView', () => {
        const baseView: OrganizerView = {
            id: 'test-view',
            name: 'Test View',
            root: 'root',
            entries: {
                root: {
                    id: 'root',
                    type: 'folder',
                    name: 'Root',
                    children: ['folder1', 'ref1'],
                },
                folder1: {
                    id: 'folder1',
                    type: 'folder',
                    name: 'Folder 1',
                    children: ['ref2'],
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
            },
        };

        const resources: OrganizerV1['resources'] = {
            resource1: {
                id: 'resource1',
                type: 'container',
                name: 'Container 1',
            },
            resource2: {
                id: 'resource2',
                type: 'container',
                name: 'Container 2',
            },
            resource3: {
                id: 'resource3',
                type: 'container',
                name: 'Container 3',
            },
        };

        it('should update folder children', () => {
            const newChildren = ['ref1', 'folder1'];
            const result = setFolderChildrenInView({
                view: baseView,
                folderId: 'root',
                childrenIds: newChildren,
            });

            expect((result.entries.root as any).children).toEqual(newChildren);
        });

        it('should clear folder children when given empty array', () => {
            const result = setFolderChildrenInView({
                view: baseView,
                folderId: 'folder1',
                childrenIds: [],
            });

            expect((result.entries.folder1 as any).children).toEqual([]);
        });

        it('should create refs for resources not in entries', () => {
            const newChildren = ['ref1', 'resource3'];
            const result = setFolderChildrenInView({
                view: baseView,
                folderId: 'root',
                childrenIds: newChildren,
                resources,
            });

            expect((result.entries.root as any).children).toEqual(newChildren);
            expect(result.entries.resource3).toEqual({
                id: 'resource3',
                type: 'ref',
                target: 'resource3',
            });
        });

        it('should not create refs when resources not provided', () => {
            const newChildren = ['ref1', 'non-existent'];
            const result = setFolderChildrenInView({
                view: baseView,
                folderId: 'root',
                childrenIds: newChildren,
            });

            expect((result.entries.root as any).children).toEqual(newChildren);
            expect(result.entries['non-existent']).toBeUndefined();
        });

        it('should not modify the original view', () => {
            const originalChildren = [...(baseView.entries.root as any).children];
            setFolderChildrenInView({
                view: baseView,
                folderId: 'root',
                childrenIds: ['new-child'],
            });

            expect((baseView.entries.root as any).children).toEqual(originalChildren);
        });

        it('should handle mix of existing entries and new resources', () => {
            const newChildren = ['folder1', 'ref2', 'resource3'];
            const result = setFolderChildrenInView({
                view: baseView,
                folderId: 'root',
                childrenIds: newChildren,
                resources,
            });

            expect((result.entries.root as any).children).toEqual(newChildren);
            // folder1 and ref2 already exist, should not be modified
            expect(result.entries.folder1).toEqual(baseView.entries.folder1);
            expect(result.entries.ref2).toEqual(baseView.entries.ref2);
            // resource3 should be added as a ref
            expect(result.entries.resource3).toEqual({
                id: 'resource3',
                type: 'ref',
                target: 'resource3',
            });
        });
    });
});
