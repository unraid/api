import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';
import {
    containerToResource,
    DockerOrganizerService,
} from '@app/unraid-api/graph/resolvers/docker/docker-organizer.service.js';
import {
    ContainerPortType,
    ContainerState,
    DockerContainer,
} from '@app/unraid-api/graph/resolvers/docker/docker.model.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
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
    let configService: DockerConfigService;
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
                    provide: DockerConfigService,
                    useValue: {
                        getConfig: vi.fn().mockImplementation(() => structuredClone(mockOrganizer)),
                        validate: vi.fn().mockImplementation((config) => Promise.resolve(config)),
                        replaceConfig: vi.fn(),
                    },
                },
                {
                    provide: DockerService,
                    useValue: {
                        getContainers: vi.fn().mockResolvedValue([
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
                    },
                },
            ],
        }).compile();

        service = moduleRef.get<DockerOrganizerService>(DockerOrganizerService);
        configService = moduleRef.get<DockerConfigService>(DockerConfigService);
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
});
