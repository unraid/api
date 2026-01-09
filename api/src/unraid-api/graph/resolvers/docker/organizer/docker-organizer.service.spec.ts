import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DockerTemplateIconService } from '@app/unraid-api/graph/resolvers/docker/docker-template-icon.service.js';
import { DockerTemplateScannerService } from '@app/unraid-api/graph/resolvers/docker/docker-template-scanner.service.js';
import {
    ContainerPortType,
    ContainerState,
    DockerContainer,
} from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { DockerOrganizerConfigService } from '@app/unraid-api/graph/resolvers/docker/organizer/docker-organizer-config.service.js';
import {
    containerToResource,
    DockerOrganizerService,
} from '@app/unraid-api/graph/resolvers/docker/organizer/docker-organizer.service.js';
import { OrganizerV1 } from '@app/unraid-api/organizer/organizer.model.js';

describe('containerToResource', () => {
    it('should transform a DockerContainer to OrganizerResource', () => {
        const container: DockerContainer = {
            id: 'container-123',
            names: ['/my-app', '/my-app-alias'],
            image: 'nginx:latest',
            imageId: 'sha256:abc123',
            command: 'nginx -g "daemon off;"',
            created: 1640995200,
            ports: [
                {
                    ip: '0.0.0.0',
                    privatePort: 80,
                    publicPort: 8080,
                    type: ContainerPortType.TCP,
                },
            ],
            state: ContainerState.RUNNING,
            status: 'Up 2 hours',
            autoStart: true,
            labels: {
                'com.docker.compose.service': 'web',
            },
            isOrphaned: false,
        };

        const result = containerToResource(container);

        expect(result).toEqual({
            id: '/my-app',
            type: 'container',
            name: '/my-app',
            meta: container, // Now we store the entire container object
        });
    });

    it('should use image as name when names array is empty', () => {
        const container: DockerContainer = {
            id: 'container-456',
            names: [],
            image: 'redis:alpine',
            imageId: 'sha256:def456',
            command: 'redis-server',
            created: 1640995300,
            ports: [],
            state: ContainerState.EXITED,
            status: 'Exited (0) 1 hour ago',
            autoStart: false,
            isOrphaned: false,
        };

        const result = containerToResource(container);

        expect(result.name).toBe('redis:alpine');
        expect(result.type).toBe('container');
        expect(result.id).toBe('redis:alpine');
    });

    it('should handle containers with minimal data', () => {
        const container: DockerContainer = {
            id: 'container-789',
            names: ['/minimal-container'],
            image: 'alpine:latest',
            imageId: 'sha256:ghi789',
            command: 'sh',
            created: 1640995400,
            ports: [],
            state: ContainerState.EXITED,
            status: 'Exited (0) 5 minutes ago',
            autoStart: false,
            isOrphaned: false,
        };

        const result = containerToResource(container);

        expect(result).toEqual({
            id: '/minimal-container',
            type: 'container',
            name: '/minimal-container',
            meta: container, // Now we store the entire container object
        });
    });

    it('should handle containers with multiple ports', () => {
        const container: DockerContainer = {
            id: 'container-multiport',
            names: ['/web-app'],
            image: 'myapp:latest',
            imageId: 'sha256:jkl012',
            command: 'npm start',
            created: 1640995500,
            ports: [
                {
                    ip: '0.0.0.0',
                    privatePort: 3000,
                    publicPort: 3000,
                    type: ContainerPortType.TCP,
                },
                {
                    ip: '0.0.0.0',
                    privatePort: 3001,
                    publicPort: 3001,
                    type: ContainerPortType.TCP,
                },
            ],
            state: ContainerState.RUNNING,
            status: 'Up 30 minutes',
            autoStart: true,
            labels: {
                maintainer: 'dev-team',
                version: '1.0.0',
            },
            isOrphaned: false,
        };

        const result = containerToResource(container);

        expect(result.meta?.ports).toHaveLength(2);
        expect(result.meta?.labels).toEqual({
            maintainer: 'dev-team',
            version: '1.0.0',
        });
    });
});

describe('DockerOrganizerService', () => {
    let service: DockerOrganizerService;
    let configService: DockerOrganizerConfigService;
    let dockerService: DockerService;

    const mockOrganizer: OrganizerV1 = {
        version: 1,
        resources: {
            container1: {
                id: 'container1',
                type: 'container',
                name: 'container1',
            },
            container2: {
                id: 'container2',
                type: 'container',
                name: 'container2',
            },
        },
        views: {
            default: {
                id: 'default',
                name: 'Default',
                root: 'root',
                entries: {
                    root: { id: 'root', type: 'folder', name: 'Root', children: [] },
                    existingFolder: {
                        id: 'existingFolder',
                        type: 'folder',
                        name: 'Existing',
                        children: [],
                    },
                },
            },
        },
    };

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                DockerOrganizerService,
                {
                    provide: DockerOrganizerConfigService,
                    useValue: {
                        getConfig: vi.fn().mockImplementation(() => structuredClone(mockOrganizer)),
                        validate: vi.fn().mockImplementation((config) => Promise.resolve(config)),
                        replaceConfig: vi.fn(),
                    },
                },
                {
                    provide: DockerService,
                    useValue: {
                        getRawContainers: vi.fn().mockResolvedValue([
                            {
                                id: 'container1',
                                names: ['container1'],
                                image: 'nginx:latest',
                                imageId: 'sha256:123',
                                command: 'nginx',
                                created: 1640995200,
                                ports: [],
                                state: 'running',
                                status: 'Up 1 hour',
                                autoStart: true,
                            },
                            {
                                id: 'container2',
                                names: ['container2'],
                                image: 'redis:latest',
                                imageId: 'sha256:456',
                                command: 'redis-server',
                                created: 1640995300,
                                ports: [],
                                state: 'running',
                                status: 'Up 2 hours',
                                autoStart: true,
                            },
                        ]),
                        enrichWithOrphanStatus: vi.fn().mockImplementation((containers) =>
                            containers.map((c: Record<string, unknown>) => ({
                                ...c,
                                isOrphaned: false,
                                templatePath: '/path/to/template.xml',
                            }))
                        ),
                    },
                },
                {
                    provide: DockerTemplateIconService,
                    useValue: {
                        getIconsForContainers: vi.fn().mockResolvedValue(new Map()),
                    },
                },
                {
                    provide: DockerTemplateScannerService,
                    useValue: {
                        syncMissingContainers: vi.fn().mockResolvedValue(false),
                    },
                },
            ],
        }).compile();

        service = moduleRef.get<DockerOrganizerService>(DockerOrganizerService);
        configService = moduleRef.get<DockerOrganizerConfigService>(DockerOrganizerConfigService);
        dockerService = moduleRef.get<DockerService>(DockerService);
    });

    describe('createFolder', () => {
        it('should create a folder in root by default', async () => {
            const result = await service.createFolder({ name: 'New Folder' });

            expect(result.version).toBe(1);
            expect(configService.validate).toHaveBeenCalledWith(expect.any(Object));
            expect(configService.replaceConfig).toHaveBeenCalledWith(result);

            // Verify folder was created with correct properties
            const newFolder = Object.values(result.views.default.entries).find(
                (entry) => entry.type === 'folder' && entry.name === 'New Folder'
            );
            expect(newFolder).toBeDefined();
        });

        it('should create a folder with children', async () => {
            const result = await service.createFolder({
                name: 'Folder with Children',
                parentId: 'root',
                childrenIds: ['container1', 'container2'],
            });

            const newFolder = Object.values(result.views.default.entries).find(
                (entry) => entry.type === 'folder' && entry.name === 'Folder with Children'
            );
            expect(newFolder).toBeDefined();
            expect((newFolder as any).children).toEqual(['container1', 'container2']);
        });

        it('should throw error if parent does not exist', async () => {
            await expect(
                service.createFolder({ name: 'Test', parentId: 'nonexistent' })
            ).rejects.toThrow();
        });

        it('should throw error if parent is not a folder', async () => {
            const organizerWithRef = structuredClone(mockOrganizer);
            organizerWithRef.views.default.entries.refEntry = {
                id: 'refEntry',
                type: 'ref',
                target: 'container1',
            };
            (configService.getConfig as any).mockReturnValue(organizerWithRef);

            await expect(service.createFolder({ name: 'Test', parentId: 'refEntry' })).rejects.toThrow();
        });
    });

    describe('setFolderChildren', () => {
        it('should update folder children', async () => {
            const result = await service.setFolderChildren({
                folderId: 'existingFolder',
                childrenIds: ['container1', 'container2'],
            });

            expect(result.version).toBe(1);
            expect(configService.validate).toHaveBeenCalledWith(expect.any(Object));
            expect(configService.replaceConfig).toHaveBeenCalledWith(result);

            // Verify children were set
            const folder = result.views.default.entries.existingFolder as any;
            expect(folder.children).toEqual(['container1', 'container2']);
        });

        it('should create refs for resources not in entries', async () => {
            const result = await service.setFolderChildren({
                folderId: 'existingFolder',
                childrenIds: ['container1'],
            });

            // Verify ref was created
            expect(result.views.default.entries.container1).toEqual({
                id: 'container1',
                type: 'ref',
                target: 'container1',
            });
        });

        it('should handle empty children array', async () => {
            const result = await service.setFolderChildren({
                folderId: 'existingFolder',
                childrenIds: [],
            });

            const folder = result.views.default.entries.existingFolder as any;
            expect(folder.children).toEqual([]);
        });

        it('should use root as default folder', async () => {
            const result = await service.setFolderChildren({
                childrenIds: ['existingFolder'],
            });

            const rootFolder = result.views.default.entries.root as any;
            expect(rootFolder.children).toContain('existingFolder');
        });

        it('should throw error if folder does not exist', async () => {
            await expect(
                service.setFolderChildren({ folderId: 'nonexistent', childrenIds: [] })
            ).rejects.toThrow();
        });

        it('should throw error if target is not a folder', async () => {
            const organizerWithRef = structuredClone(mockOrganizer);
            organizerWithRef.views.default.entries.refEntry = {
                id: 'refEntry',
                type: 'ref',
                target: 'container1',
            };
            (configService.getConfig as any).mockReturnValue(organizerWithRef);

            await expect(
                service.setFolderChildren({ folderId: 'refEntry', childrenIds: [] })
            ).rejects.toThrow();
        });

        it('should throw error if child does not exist', async () => {
            await expect(
                service.setFolderChildren({
                    folderId: 'existingFolder',
                    childrenIds: ['nonexistentChild'],
                })
            ).rejects.toThrow();
        });
    });

    describe('deleteEntries', () => {
        // Test constants to avoid magic values
        const TEST_FOLDER_ID = 'testFolder';
        const TEST_ENTRY_ID = 'testEntry';
        const PERFORMANCE_TEST_SIZE = 50; // Reduced for faster tests

        // Helper function to create test organizer with specific entries
        const createTestOrganizer = (entries: Record<string, any> = {}) => {
            const organizer = structuredClone(mockOrganizer);
            Object.assign(organizer.views.default.entries, entries);
            return organizer;
        };

        // Helper to get typed root folder
        const getRootFolder = (result: any) => result.views.default.entries.root;

        it('should delete entries and maintain proper orchestration', async () => {
            const testOrganizer = createTestOrganizer({
                [TEST_FOLDER_ID]: {
                    id: TEST_FOLDER_ID,
                    type: 'folder',
                    name: 'Test Folder',
                    children: [],
                },
            });
            (configService.getConfig as any).mockReturnValue(testOrganizer);

            const result = await service.deleteEntries({
                entryIds: new Set([TEST_FOLDER_ID]),
            });

            // Verify service contract fulfillment
            expect(result).toBeDefined();
            expect(result.version).toBe(1);
            expect(result.views.default).toBeDefined();

            // Verify service orchestration without being overly specific
            expect(configService.getConfig).toHaveBeenCalled();
            expect(configService.validate).toHaveBeenCalled();
            expect(configService.replaceConfig).toHaveBeenCalled();

            // Verify the deletion outcome
            expect(result.views.default.entries[TEST_FOLDER_ID]).toBeUndefined();
        });

        it('should handle empty entryIds set gracefully', async () => {
            const originalEntryCount = Object.keys(mockOrganizer.views.default.entries).length;

            const result = await service.deleteEntries({
                entryIds: new Set(),
            });

            // Verify basic service contract
            expect(result).toBeDefined();
            expect(result.version).toBe(1);
            expect(configService.validate).toHaveBeenCalled();
            expect(configService.replaceConfig).toHaveBeenCalled();

            // Verify no unintended deletions occurred
            expect(Object.keys(result.views.default.entries).length).toBeGreaterThanOrEqual(
                originalEntryCount
            );
            expect(result.views.default.entries.existingFolder).toBeDefined();
        });

        it('should synchronize resources during operation', async () => {
            const result = await service.deleteEntries({
                entryIds: new Set(),
            });

            // Verify resources structure is maintained and updated
            expect(result.resources).toBeDefined();
            expect(typeof result.resources).toBe('object');

            // Verify container resources are properly structured
            const containerResources = Object.values(result.resources).filter(
                (resource: any) => resource.type === 'container'
            );
            expect(containerResources.length).toBeGreaterThan(0);

            // Each container resource should have required properties
            containerResources.forEach((resource: any) => {
                expect(resource).toHaveProperty('id');
                expect(resource).toHaveProperty('type', 'container');
                expect(resource).toHaveProperty('name');
                expect(resource).toHaveProperty('meta');
            });
        });

        it('should handle deletion of non-existent entries gracefully', async () => {
            const NON_EXISTENT_ID = 'definitivelyDoesNotExist';
            const originalEntries = Object.keys(mockOrganizer.views.default.entries);

            const result = await service.deleteEntries({
                entryIds: new Set([NON_EXISTENT_ID]),
            });

            // Verify service completed successfully
            expect(result).toBeDefined();
            expect(result.version).toBe(1);

            // Verify no existing entries were accidentally deleted
            originalEntries.forEach((entryId) => {
                expect(result.views.default.entries[entryId]).toBeDefined();
            });
        });

        it('should handle mixed valid and invalid entry deletion', async () => {
            const VALID_ENTRY = 'existingFolder';
            const INVALID_ENTRY = 'nonExistentEntry';

            const result = await service.deleteEntries({
                entryIds: new Set([VALID_ENTRY, INVALID_ENTRY]),
            });

            // Verify operation completed successfully despite invalid entry
            expect(result).toBeDefined();
            expect(result.version).toBe(1);

            // Valid entry should be deleted, invalid entry should be ignored
            expect(result.views.default.entries[VALID_ENTRY]).toBeUndefined();
            expect(result.views.default.entries[INVALID_ENTRY]).toBeUndefined(); // Never existed
        });

        it('should perform synchronization as part of operation', async () => {
            const syncSpy = vi.spyOn(service, 'syncAndGetOrganizer');

            const result = await service.deleteEntries({
                entryIds: new Set(),
            });

            // Verify sync occurred and result reflects synchronized state
            expect(syncSpy).toHaveBeenCalled();
            expect(result.resources).toBeDefined();
            expect(Object.keys(result.resources).length).toBeGreaterThan(0);
        });

        it('should handle cascading deletions correctly', async () => {
            const PARENT_FOLDER = 'parentFolder';
            const CHILD_FOLDER = 'childFolder';

            const hierarchicalOrganizer = createTestOrganizer({
                [PARENT_FOLDER]: {
                    id: PARENT_FOLDER,
                    type: 'folder',
                    name: 'Parent Folder',
                    children: [CHILD_FOLDER],
                },
                [CHILD_FOLDER]: {
                    id: CHILD_FOLDER,
                    type: 'folder',
                    name: 'Child Folder',
                    children: [],
                },
            });

            const rootFolder = getRootFolder(hierarchicalOrganizer);
            rootFolder.children = [PARENT_FOLDER];
            (configService.getConfig as any).mockReturnValue(hierarchicalOrganizer);

            const result = await service.deleteEntries({
                entryIds: new Set([PARENT_FOLDER]),
            });

            // Both parent and child should be deleted due to cascading
            expect(result.views.default.entries[PARENT_FOLDER]).toBeUndefined();
            expect(result.views.default.entries[CHILD_FOLDER]).toBeUndefined();

            // Root should no longer reference deleted parent
            const resultRoot = getRootFolder(result);
            expect(resultRoot.children).not.toContain(PARENT_FOLDER);
        });

        it('should handle validation failure appropriately', async () => {
            const validationError = new Error('Configuration validation failed');
            (configService.validate as any).mockRejectedValue(validationError);

            await expect(
                service.deleteEntries({
                    entryIds: new Set([TEST_FOLDER_ID]),
                })
            ).rejects.toThrow();

            // Should not save invalid configuration
            expect(configService.replaceConfig).not.toHaveBeenCalled();
        });

        it('should handle docker service failure gracefully', async () => {
            const dockerError = new Error('Docker service unavailable');
            (dockerService.getRawContainers as any).mockRejectedValue(dockerError);

            await expect(
                service.deleteEntries({
                    entryIds: new Set([TEST_FOLDER_ID]),
                })
            ).rejects.toThrow();

            // Should fail early before attempting validation/save
            expect(configService.replaceConfig).not.toHaveBeenCalled();
        });

        it('should handle complex folder hierarchies correctly', async () => {
            const PARENT_FOLDER = 'parentFolder';
            const CHILD_FOLDER = 'childFolder';
            const SIBLING_FOLDER = 'siblingFolder';

            const complexOrganizer = createTestOrganizer({
                [PARENT_FOLDER]: {
                    id: PARENT_FOLDER,
                    type: 'folder',
                    name: 'Parent Folder',
                    children: ['existingFolder'], // References existing mock entry
                },
                [SIBLING_FOLDER]: {
                    id: SIBLING_FOLDER,
                    type: 'folder',
                    name: 'Sibling Folder',
                    children: [],
                },
            });

            const rootFolder = getRootFolder(complexOrganizer);
            rootFolder.children = [PARENT_FOLDER, SIBLING_FOLDER];
            (configService.getConfig as any).mockReturnValue(complexOrganizer);

            const result = await service.deleteEntries({
                entryIds: new Set([PARENT_FOLDER]),
            });

            // Verify targeted deletion occurred
            expect(result.views.default.entries[PARENT_FOLDER]).toBeUndefined();
            expect(result.views.default.entries.existingFolder).toBeUndefined(); // Cascaded deletion

            // Verify unrelated entries are preserved
            expect(result.views.default.entries[SIBLING_FOLDER]).toBeDefined();

            // Verify view structure integrity
            const resultRoot = getRootFolder(result);
            expect(resultRoot.children).not.toContain(PARENT_FOLDER);
            expect(resultRoot.children).toContain(SIBLING_FOLDER);
        });

        it('should maintain resource integrity after operations', async () => {
            const result = await service.deleteEntries({
                entryIds: new Set(['existingFolder']),
            });

            // Verify resources maintain expected structure and content
            expect(result.resources).toBeDefined();
            expect(typeof result.resources).toBe('object');

            // Verify each resource has consistent structure
            Object.entries(result.resources).forEach(([resourceId, resource]: [string, any]) => {
                expect(resource).toHaveProperty('id', resourceId);
                expect(resource).toHaveProperty('type');
                expect(resource).toHaveProperty('name');

                // Container resources should have metadata
                if (resource.type === 'container') {
                    expect(resource).toHaveProperty('meta');
                    expect(resource.meta).toBeDefined();
                }
            });
        });

        it('should maintain data consistency throughout operation', async () => {
            // Test that the service maintains data integrity without testing specific call sequences
            let configGetCount = 0;
            let validateCount = 0;
            let replaceCount = 0;

            (configService.getConfig as any).mockImplementation(() => {
                configGetCount++;
                return structuredClone(mockOrganizer);
            });

            (configService.validate as any).mockImplementation((config: any) => {
                validateCount++;
                // Validate that we received a proper config object
                expect(config).toHaveProperty('version');
                expect(config).toHaveProperty('resources');
                expect(config).toHaveProperty('views');
                return Promise.resolve(config);
            });

            (configService.replaceConfig as any).mockImplementation((config: any) => {
                replaceCount++;
                // Validate that we're saving a consistent config
                expect(config).toHaveProperty('version');
                expect(config.views.default).toBeDefined();
            });

            const result = await service.deleteEntries({
                entryIds: new Set(['existingFolder']),
            });

            // Verify essential operations occurred without being overly specific about sequence
            expect(configGetCount).toBeGreaterThan(0);
            expect(validateCount).toBeGreaterThan(0);
            expect(replaceCount).toBeGreaterThan(0);
            expect(result).toBeDefined();
        });

        it('should handle deletion when default view is missing', async () => {
            const organizerWithoutDefaultView = structuredClone(mockOrganizer);
            delete organizerWithoutDefaultView.views.default;
            (configService.getConfig as any).mockReturnValue(organizerWithoutDefaultView);

            const result = await service.deleteEntries({
                entryIds: new Set(['someEntry']),
            });

            // Should still work and create/maintain proper structure
            expect(result.views.default).toBeDefined();
            expect(configService.validate).toHaveBeenCalled();
            expect(configService.replaceConfig).toHaveBeenCalled();
        });

        it('should maintain relative order of remaining entries', async () => {
            const ENTRIES = ['entryA', 'entryB', 'entryC', 'entryD'];
            const TO_DELETE = ['entryB', 'entryD'];
            const EXPECTED_REMAINING = ['entryA', 'entryC'];

            // Mock getRawContainers to return containers matching our test entries
            const mockContainers = ENTRIES.map((entryId, i) => ({
                id: `container-${entryId}`,
                names: [`/${entryId}`],
                image: 'test:latest',
                imageId: `sha256:${i}`,
                command: 'test',
                created: 1640995200 + i,
                ports: [],
                state: 'running',
                status: 'Up 1 hour',
                autoStart: true,
            }));
            (dockerService.getRawContainers as any).mockResolvedValue(mockContainers);

            const organizerWithOrdering = createTestOrganizer();
            const rootFolder = getRootFolder(organizerWithOrdering);
            rootFolder.children = [...ENTRIES];

            // Create refs pointing to the container names (which will be /{entryId})
            ENTRIES.forEach((entryId) => {
                organizerWithOrdering.views.default.entries[entryId] = {
                    id: entryId,
                    type: 'ref',
                    target: `/${entryId}`,
                };
            });

            (configService.getConfig as any).mockReturnValue(organizerWithOrdering);

            const result = await service.deleteEntries({
                entryIds: new Set(TO_DELETE),
            });

            const resultRoot = getRootFolder(result);

            // Verify deleted entries are gone
            TO_DELETE.forEach((entryId) => {
                expect(result.views.default.entries[entryId]).toBeUndefined();
                expect(resultRoot.children).not.toContain(entryId);
            });

            // Verify remaining entries are present and in relative order
            EXPECTED_REMAINING.forEach((entryId) => {
                expect(result.views.default.entries[entryId]).toBeDefined();
                expect(resultRoot.children).toContain(entryId);
            });

            // Check that relative order is preserved among remaining entries
            const remainingPositions = EXPECTED_REMAINING.map((id) => resultRoot.children.indexOf(id));
            expect(remainingPositions[0]).toBeLessThan(remainingPositions[1]); // entryA before entryC
        });

        it('should handle bulk operations efficiently', async () => {
            const bulkOrganizer = createTestOrganizer();
            const entriesToDelete = new Set<string>();

            // Create test entries for bulk deletion
            for (let i = 0; i < PERFORMANCE_TEST_SIZE; i++) {
                const entryId = `bulkEntry${i}`;
                entriesToDelete.add(entryId);
                bulkOrganizer.views.default.entries[entryId] = {
                    id: entryId,
                    type: 'ref',
                    target: `bulkTarget${i}`,
                };
            }

            const rootFolder = getRootFolder(bulkOrganizer);
            rootFolder.children.push(...Array.from(entriesToDelete));
            (configService.getConfig as any).mockReturnValue(bulkOrganizer);

            const startTime = Date.now();
            const result = await service.deleteEntries({
                entryIds: entriesToDelete,
            });
            const endTime = Date.now();

            // Verify all bulk entries were deleted
            entriesToDelete.forEach((entryId) => {
                expect(result.views.default.entries[entryId]).toBeUndefined();
            });

            const resultRoot = getRootFolder(result);
            entriesToDelete.forEach((entryId) => {
                expect(resultRoot.children).not.toContain(entryId);
            });

            // Verify operation completed in reasonable time (not a strict performance test)
            expect(endTime - startTime).toBeLessThan(5000); // 5 seconds should be more than enough

            // Verify service contract still fulfilled
            expect(result).toBeDefined();
            expect(result.version).toBe(1);
        });
    });
});
