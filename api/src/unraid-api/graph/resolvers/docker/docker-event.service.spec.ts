import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Readable } from 'stream';
import { PassThrough } from 'stream';
import Docker from 'dockerode';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DockerEventService } from './docker-event.service.js';
import { DockerService } from './docker.service.js';

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

// Mock DockerService
vi.mock('./docker.service.js', () => ({
    DockerService: vi.fn().mockImplementation(() => ({
        getDockerClient: vi.fn().mockReturnValue({
            getEvents: vi.fn(),
        }),
        debouncedContainerCacheUpdate: vi.fn(),
    })),
}));

describe('DockerEventService', () => {
    let service: DockerEventService;
    let dockerService: DockerService;
    let mockDockerClient: Docker;
    let mockEventStream: PassThrough;
    let mockLogger: Logger;

    beforeEach(async () => {
        // Create a mock Docker client
        mockDockerClient = {
            getEvents: vi.fn(),
        } as unknown as Docker;

        // Create a mock Docker service
        dockerService = {
            getDockerClient: vi.fn().mockReturnValue(mockDockerClient),
            debouncedContainerCacheUpdate: vi.fn(),
        } as unknown as DockerService;

        // Create a mock event stream
        mockEventStream = new PassThrough();

        // Set up the mock Docker client to return our mock event stream
        (mockDockerClient.getEvents as any).mockResolvedValue(mockEventStream as unknown as Readable);

        // Create a mock logger
        mockLogger = new Logger(DockerEventService.name) as Logger;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DockerEventService,
                {
                    provide: DockerService,
                    useValue: dockerService,
                },
            ],
        }).compile();

        service = module.get<DockerEventService>(DockerEventService);
    });

    afterEach(() => {
        vi.clearAllMocks();
        service.stopEventStream();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should process Docker events correctly', async () => {
        // Start the event stream
        await service['setupDockerWatch']();

        // Write a valid Docker event to the stream
        const event = {
            Type: 'container',
            Action: 'start',
            id: '123',
            from: 'test-image',
            time: Date.now(),
            timeNano: Date.now() * 1000000,
        };

        // Write the event as a JSON string with a newline
        mockEventStream.write(JSON.stringify(event) + '\n');

        // Wait for the event to be processed
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify that the container cache update was called
        expect(dockerService.debouncedContainerCacheUpdate).toHaveBeenCalled();
    });

    it('should ignore non-watched actions', async () => {
        // Start the event stream
        await service['setupDockerWatch']();

        // Write an event with a non-watched action
        const event = {
            Type: 'container',
            Action: 'unknown',
            id: '123',
            from: 'test-image',
            time: Date.now(),
            timeNano: Date.now() * 1000000,
        };

        // Write the event as a JSON string with a newline
        mockEventStream.write(JSON.stringify(event) + '\n');

        // Wait for the event to be processed
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify that the container cache update was not called
        expect(dockerService.debouncedContainerCacheUpdate).not.toHaveBeenCalled();
    });

    it('should handle malformed JSON gracefully', async () => {
        // Start the event stream
        await service['setupDockerWatch']();

        // Write malformed JSON to the stream
        mockEventStream.write('{malformed json}\n');

        // Wait for the event to be processed
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify that the service is still running
        expect(service.isActive()).toBe(true);
    });

    it('should handle multiple JSON bodies in a single chunk', async () => {
        // Start the event stream
        await service['setupDockerWatch']();

        // Write multiple valid Docker events in a single chunk
        const events = [
            {
                Type: 'container',
                Action: 'start',
                id: '123',
                from: 'test-image-1',
                time: Date.now(),
                timeNano: Date.now() * 1000000,
            },
            {
                Type: 'container',
                Action: 'stop',
                id: '456',
                from: 'test-image-2',
                time: Date.now(),
                timeNano: Date.now() * 1000000,
            }
        ];

        // Write the events as JSON strings with newlines
        mockEventStream.write(events.map(event => JSON.stringify(event)).join('\n') + '\n');

        // Wait for the events to be processed
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify that the container cache update was called twice
        expect(dockerService.debouncedContainerCacheUpdate).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed valid and invalid JSON in a single chunk', async () => {
        // Start the event stream
        await service['setupDockerWatch']();

        // Create a chunk with both valid and invalid JSON
        const validEvent = {
            Type: 'container',
            Action: 'start',
            id: '123',
            from: 'test-image',
            time: Date.now(),
            timeNano: Date.now() * 1000000,
        };
        
        const invalidJson = '{malformed json}';
        
        // Write the mixed content to the stream
        mockEventStream.write(JSON.stringify(validEvent) + '\n' + invalidJson + '\n');

        // Wait for the events to be processed
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify that the container cache update was called for the valid event
        expect(dockerService.debouncedContainerCacheUpdate).toHaveBeenCalledTimes(1);
        
        // Verify that the service is still running despite the invalid JSON
        expect(service.isActive()).toBe(true);
    });

    it('should handle empty lines in a chunk', async () => {
        // Start the event stream
        await service['setupDockerWatch']();

        // Create a chunk with empty lines
        const event = {
            Type: 'container',
            Action: 'start',
            id: '123',
            from: 'test-image',
            time: Date.now(),
            timeNano: Date.now() * 1000000,
        };
        
        // Write the event with empty lines before and after
        mockEventStream.write('\n\n' + JSON.stringify(event) + '\n\n');

        // Wait for the events to be processed
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify that the container cache update was called for the valid event
        expect(dockerService.debouncedContainerCacheUpdate).toHaveBeenCalledTimes(1);
        
        // Verify that the service is still running
        expect(service.isActive()).toBe(true);
    });

    it('should handle stream errors gracefully', async () => {
        // Start the event stream
        await service['setupDockerWatch']();

        // Emit an error on the stream
        mockEventStream.emit('error', new Error('Stream error'));

        // Wait for the error to be processed
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify that the service has stopped
        expect(service.isActive()).toBe(false);
    });

    it('should clean up resources when stopped', async () => {
        // Start the event stream
        await service['setupDockerWatch']();

        // Stop the event stream
        service.stopEventStream();

        // Verify that the service has stopped
        expect(service.isActive()).toBe(false);
    });
}); 