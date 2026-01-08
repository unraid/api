import { Test, TestingModule } from '@nestjs/testing';
import { PassThrough } from 'stream';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Import pubsub for use in tests
import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { DockerEventService } from '@app/unraid-api/graph/resolvers/docker/docker-event.service.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';

// Mock chokidar
vi.mock('chokidar', () => ({
    watch: vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
    }),
}));

// Mock @nestjs/common
vi.mock('@nestjs/common', async () => {
    const actual = await vi.importActual('@nestjs/common');
    return {
        ...actual,
        Injectable: () => vi.fn(),
        Logger: vi.fn().mockImplementation(() => ({
            debug: vi.fn(),
            error: vi.fn(),
            log: vi.fn(),
        })),
    };
});

// Mock store getters
vi.mock('@app/store/index.js', () => ({
    getters: {
        paths: vi.fn().mockReturnValue({
            'var-run': '/var/run',
            'docker-socket': '/var/run/docker.sock',
        }),
    },
}));

// Mock pubsub
vi.mock('@app/core/pubsub.js', () => ({
    pubsub: {
        publish: vi.fn().mockResolvedValue(undefined),
    },
    PUBSUB_CHANNEL: {
        INFO: 'info',
    },
}));

// Mock the docker client utility - this is what the service actually uses
const mockDockerClientInstance = {
    getEvents: vi.fn(),
};
vi.mock('./utils/docker-client.js', () => ({
    getDockerClient: vi.fn(() => mockDockerClientInstance),
}));

// Mock DockerService
vi.mock('./docker.service.js', () => ({
    DockerService: vi.fn().mockImplementation(() => ({
        getDockerClient: vi.fn(),
        getAppInfo: vi.fn().mockResolvedValue({ info: { apps: { installed: 1, running: 1 } } }),
    })),
}));

describe('DockerEventService', () => {
    let service: DockerEventService;
    let dockerService: DockerService;
    let mockEventStream: PassThrough;
    let module: TestingModule;

    beforeEach(async () => {
        // Create a mock Docker service *instance*
        const mockDockerServiceImpl = {
            getDockerClient: vi.fn(),
            getAppInfo: vi.fn().mockResolvedValue({ info: { apps: { installed: 1, running: 1 } } }),
        };

        // Create a mock event stream
        mockEventStream = new PassThrough();

        // Set up the mock Docker client to return our mock event stream
        mockDockerClientInstance.getEvents = vi.fn().mockResolvedValue(mockEventStream);

        // Use the mock implementation in the testing module
        module = await Test.createTestingModule({
            providers: [
                DockerEventService,
                {
                    provide: DockerService,
                    useValue: mockDockerServiceImpl,
                },
            ],
        }).compile();

        service = module.get<DockerEventService>(DockerEventService);
        dockerService = module.get<DockerService>(DockerService);
    });

    afterEach(() => {
        vi.clearAllMocks();
        if (service['dockerEventStream']) {
            service.stopEventStream();
        }
        module.close();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    const waitForEventProcessing = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

    it('should process Docker events correctly', async () => {
        await service['setupDockerWatch']();
        expect(service.isActive()).toBe(true);

        const event = {
            Type: 'container',
            Action: 'start',
            id: '123',
            from: 'test-image',
            time: Date.now(),
            timeNano: Date.now() * 1000000,
        };

        mockEventStream.write(JSON.stringify(event) + '\n');

        await waitForEventProcessing();

        expect(dockerService.getAppInfo).toHaveBeenCalled();
        expect(pubsub.publish).toHaveBeenCalledWith(PUBSUB_CHANNEL.INFO, expect.any(Object));
    });

    it('should ignore non-watched actions', async () => {
        await service['setupDockerWatch']();
        expect(service.isActive()).toBe(true);

        const event = {
            Type: 'container',
            Action: 'unknown',
            id: '123',
            from: 'test-image',
            time: Date.now(),
            timeNano: Date.now() * 1000000,
        };

        mockEventStream.write(JSON.stringify(event) + '\n');

        await waitForEventProcessing();

        expect(dockerService.getAppInfo).not.toHaveBeenCalled();
        expect(pubsub.publish).not.toHaveBeenCalled();
    });

    it('should handle malformed JSON gracefully', async () => {
        await service['setupDockerWatch']();
        expect(service.isActive()).toBe(true);

        const malformedJson = '{malformed json}\n';
        mockEventStream.write(malformedJson);

        const validEvent = { Type: 'container', Action: 'start', id: '456' };
        mockEventStream.write(JSON.stringify(validEvent) + '\n');

        await waitForEventProcessing();

        expect(service.isActive()).toBe(true);
        expect(dockerService.getAppInfo).toHaveBeenCalledTimes(1);
        expect(pubsub.publish).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple JSON bodies in a single chunk', async () => {
        await service['setupDockerWatch']();
        expect(service.isActive()).toBe(true);

        const events = [
            { Type: 'container', Action: 'start', id: '123', from: 'test-image-1' },
            { Type: 'container', Action: 'stop', id: '456', from: 'test-image-2' },
        ];

        mockEventStream.write(events.map((event) => JSON.stringify(event)).join('\n') + '\n');

        await waitForEventProcessing();

        expect(dockerService.getAppInfo).toHaveBeenCalledTimes(2);
        expect(pubsub.publish).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed valid and invalid JSON in a single chunk', async () => {
        await service['setupDockerWatch']();
        expect(service.isActive()).toBe(true);

        const validEvent = { Type: 'container', Action: 'start', id: '123', from: 'test-image' };
        const invalidJson = '{malformed json}';

        mockEventStream.write(JSON.stringify(validEvent) + '\n' + invalidJson + '\n');

        await waitForEventProcessing();

        expect(dockerService.getAppInfo).toHaveBeenCalledTimes(1);
        expect(pubsub.publish).toHaveBeenCalledTimes(1);

        expect(service.isActive()).toBe(true);
    });

    it('should handle empty lines in a chunk', async () => {
        await service['setupDockerWatch']();
        expect(service.isActive()).toBe(true);

        const event = { Type: 'container', Action: 'start', id: '123', from: 'test-image' };

        mockEventStream.write('\n\n' + JSON.stringify(event) + '\n\n');

        await waitForEventProcessing();

        expect(dockerService.getAppInfo).toHaveBeenCalledTimes(1);
        expect(pubsub.publish).toHaveBeenCalledTimes(1);

        expect(service.isActive()).toBe(true);
    });

    it('should handle stream errors gracefully', async () => {
        const stopSpy = vi.spyOn(service, 'stopEventStream');

        await service['setupDockerWatch']();
        expect(service.isActive()).toBe(true);

        const testError = new Error('Stream error');
        mockEventStream.emit('error', testError);

        await waitForEventProcessing();

        expect(service.isActive()).toBe(false);
        expect(stopSpy).toHaveBeenCalled();
    });

    it('should clean up resources when stopped', async () => {
        // Start the event stream
        await service['setupDockerWatch']();
        expect(service.isActive()).toBe(true); // Ensure it started

        // Check if the stream exists before spying
        const stream = service['dockerEventStream'];
        let removeListenersSpy: any, destroySpy: any;
        if (stream) {
            removeListenersSpy = vi.spyOn(stream, 'removeAllListeners');
            destroySpy = vi.spyOn(stream, 'destroy');
        }

        // Stop the event stream
        service.stopEventStream();

        // Verify that the service has stopped
        expect(service.isActive()).toBe(false);
        // Verify stream methods were called if the stream existed
        if (removeListenersSpy) {
            expect(removeListenersSpy).toHaveBeenCalled();
        }
        if (destroySpy) {
            expect(destroySpy).toHaveBeenCalled();
        }
    });
});
