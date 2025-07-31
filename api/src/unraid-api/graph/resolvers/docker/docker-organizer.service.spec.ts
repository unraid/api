import { describe, expect, it } from 'vitest';

import { containerToResource } from '@app/unraid-api/graph/resolvers/docker/docker-organizer.service.js';
import {
    ContainerPortType,
    ContainerState,
    DockerContainer,
} from '@app/unraid-api/graph/resolvers/docker/docker.model.js';

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
            id: 'container-123',
            type: 'container',
            name: '/my-app',
            meta: {
                image: 'nginx:latest',
                imageId: 'sha256:abc123',
                state: ContainerState.RUNNING,
                status: 'Up 2 hours',
                created: 1640995200,
                command: 'nginx -g "daemon off;"',
                ports: [
                    {
                        ip: '0.0.0.0',
                        privatePort: 80,
                        publicPort: 8080,
                        type: ContainerPortType.TCP,
                    },
                ],
                autoStart: true,
                labels: {
                    'com.docker.compose.service': 'web',
                },
            },
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
        expect(result.id).toBe('container-456');
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
            id: 'container-789',
            type: 'container',
            name: '/minimal-container',
            meta: {
                image: 'alpine:latest',
                imageId: 'sha256:ghi789',
                state: ContainerState.EXITED,
                status: 'Exited (0) 5 minutes ago',
                created: 1640995400,
                command: 'sh',
                ports: [],
                autoStart: false,
                labels: undefined,
            },
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
