import { Test, TestingModule } from '@nestjs/testing';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { DockerAutostartService } from '@app/unraid-api/graph/resolvers/docker/docker-autostart.service.js';
import { DockerConfigService } from '@app/unraid-api/graph/resolvers/docker/docker-config.service.js';
import { DockerLogService } from '@app/unraid-api/graph/resolvers/docker/docker-log.service.js';
import { DockerManifestService } from '@app/unraid-api/graph/resolvers/docker/docker-manifest.service.js';
import { DockerNetworkService } from '@app/unraid-api/graph/resolvers/docker/docker-network.service.js';
import { DockerPortService } from '@app/unraid-api/graph/resolvers/docker/docker-port.service.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';

// Mock dependencies that are not focus of integration
const mockNotificationsService = {
    notifyIfUnique: vi.fn(),
};

const mockDockerConfigService = {
    getConfig: vi.fn().mockReturnValue({ templateMappings: {} }),
};

const mockDockerManifestService = {
    getCachedUpdateStatuses: vi.fn().mockResolvedValue({}),
    isUpdateAvailableCached: vi.fn().mockResolvedValue(false),
};

// Hoisted mock for paths
const { mockPaths } = vi.hoisted(() => ({
    mockPaths: {
        'docker-autostart': '',
        'docker-userprefs': '',
        'docker-socket': '/var/run/docker.sock',
    },
}));

vi.mock('@app/store/index.js', () => ({
    getters: {
        paths: () => mockPaths,
        emhttp: () => ({ networks: [] }),
    },
}));

// Check for Docker availability
let dockerAvailable = false;
try {
    const Docker = (await import('dockerode')).default;
    const docker = new Docker({ socketPath: '/var/run/docker.sock' });
    await docker.ping();
    dockerAvailable = true;
} catch {
    console.warn('Docker not available or not accessible at /var/run/docker.sock');
}

describe.runIf(dockerAvailable)('DockerService Integration', () => {
    let service: DockerService;
    let autostartService: DockerAutostartService;
    let module: TestingModule;
    let tempDir: string;

    beforeAll(async () => {
        // Setup temp dir for config files
        tempDir = await mkdtemp(join(tmpdir(), 'unraid-api-docker-test-'));
        mockPaths['docker-autostart'] = join(tempDir, 'docker-autostart');
        mockPaths['docker-userprefs'] = join(tempDir, 'docker-userprefs');

        module = await Test.createTestingModule({
            providers: [
                DockerService,
                DockerAutostartService,
                DockerLogService,
                DockerNetworkService,
                DockerPortService,
                { provide: DockerConfigService, useValue: mockDockerConfigService },
                { provide: DockerManifestService, useValue: mockDockerManifestService },
                { provide: NotificationsService, useValue: mockNotificationsService },
            ],
        }).compile();

        service = module.get<DockerService>(DockerService);
        autostartService = module.get<DockerAutostartService>(DockerAutostartService);
    });

    afterAll(async () => {
        if (tempDir) {
            await rm(tempDir, { recursive: true, force: true });
        }
    });

    it('should fetch containers from docker daemon', async () => {
        const containers = await service.getContainers();
        expect(Array.isArray(containers)).toBe(true);
        if (containers.length > 0) {
            expect(containers[0]).toHaveProperty('id');
            expect(containers[0]).toHaveProperty('names');
            expect(containers[0].state).toBeDefined();
        }
    });

    it('should fetch networks from docker daemon', async () => {
        const networks = await service.getNetworks();
        expect(Array.isArray(networks)).toBe(true);
        // Default networks (bridge, host, null) should always exist
        expect(networks.length).toBeGreaterThan(0);
        const bridge = networks.find((n) => n.name === 'bridge');
        expect(bridge).toBeDefined();
    });

    it('should manage autostart configuration in temp files', async () => {
        const containers = await service.getContainers();
        if (containers.length === 0) {
            console.warn('No containers found, skipping autostart write test');
            return;
        }

        const target = containers[0];
        // Ensure name is valid for autostart file (strip /)
        const primaryName = autostartService.getContainerPrimaryName(target as any);
        expect(primaryName).toBeTruthy();

        const entry = {
            id: target.id,
            autoStart: true,
            wait: 10,
        };

        await service.updateAutostartConfiguration([entry], { persistUserPreferences: true });

        // Verify file content
        try {
            const content = await readFile(mockPaths['docker-autostart'], 'utf8');
            expect(content).toContain(primaryName);
            expect(content).toContain('10');
        } catch (error: any) {
            // If file doesn't exist, it might be because logic didn't write anything (e.g. name issue)
            // But we expect it to write if container exists and we passed valid entry
            throw new Error(`Failed to read autostart file: ${error.message}`);
        }
    });

    it('should get container logs using dockerode', async () => {
        const containers = await service.getContainers();
        const running = containers.find((c) => c.state === 'RUNNING'); // Enum value is string 'RUNNING'

        if (!running) {
            console.warn('No running containers found, skipping log test');
            return;
        }

        // This test verifies that the execa -> dockerode switch works for logs
        // If it fails, it likely means the log parsing or dockerode interaction is wrong.
        const logs = await service.getContainerLogs(running.id, { tail: 10 });
        expect(logs).toBeDefined();
        expect(logs.containerId).toBe(running.id);
        expect(Array.isArray(logs.lines)).toBe(true);
        // We can't guarantee lines length > 0 if container is silent, but it shouldn't throw.
    });
});
