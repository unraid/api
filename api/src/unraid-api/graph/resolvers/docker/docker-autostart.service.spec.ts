import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DockerAutostartService } from '@app/unraid-api/graph/resolvers/docker/docker-autostart.service.js';
import { DockerContainer } from '@app/unraid-api/graph/resolvers/docker/docker.model.js';

// Mock store getters
const mockPaths = {
    'docker-autostart': '/path/to/docker-autostart',
    'docker-userprefs': '/path/to/docker-userprefs',
};

vi.mock('@app/store/index.js', () => ({
    getters: {
        paths: () => mockPaths,
    },
}));

// Mock fs/promises
const { readFileMock, writeFileMock, unlinkMock } = vi.hoisted(() => ({
    readFileMock: vi.fn().mockResolvedValue(''),
    writeFileMock: vi.fn().mockResolvedValue(undefined),
    unlinkMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('fs/promises', () => ({
    readFile: readFileMock,
    writeFile: writeFileMock,
    unlink: unlinkMock,
}));

describe('DockerAutostartService', () => {
    let service: DockerAutostartService;

    beforeEach(async () => {
        readFileMock.mockReset();
        writeFileMock.mockReset();
        unlinkMock.mockReset();
        readFileMock.mockResolvedValue('');

        const module: TestingModule = await Test.createTestingModule({
            providers: [DockerAutostartService],
        }).compile();

        service = module.get<DockerAutostartService>(DockerAutostartService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should parse autostart entries correctly', () => {
        const content = 'container1 10\ncontainer2\ncontainer3 0';
        const entries = service.parseAutoStartEntries(content);

        expect(entries).toHaveLength(3);
        expect(entries[0]).toEqual({ name: 'container1', wait: 10, order: 0 });
        expect(entries[1]).toEqual({ name: 'container2', wait: 0, order: 1 });
        expect(entries[2]).toEqual({ name: 'container3', wait: 0, order: 2 });
    });

    it('should refresh autostart entries', async () => {
        readFileMock.mockResolvedValue('alpha 5');
        await service.refreshAutoStartEntries();

        const entry = service.getAutoStartEntry('alpha');
        expect(entry).toBeDefined();
        expect(entry?.wait).toBe(5);
    });

    describe('updateAutostartConfiguration', () => {
        const mockContainers = [
            { id: 'c1', names: ['/alpha'] },
            { id: 'c2', names: ['/beta'] },
        ] as DockerContainer[];

        it('should update auto-start configuration and persist waits', async () => {
            await service.updateAutostartConfiguration(
                [
                    { id: 'c1', autoStart: true, wait: 15 },
                    { id: 'c2', autoStart: true, wait: 0 },
                ],
                mockContainers,
                { persistUserPreferences: true }
            );

            expect(writeFileMock).toHaveBeenCalledWith(
                mockPaths['docker-autostart'],
                'alpha 15\nbeta\n',
                'utf8'
            );
            expect(writeFileMock).toHaveBeenCalledWith(
                mockPaths['docker-userprefs'],
                '0="alpha"\n1="beta"\n',
                'utf8'
            );
        });

        it('should skip updating user preferences when persist flag is false', async () => {
            await service.updateAutostartConfiguration(
                [{ id: 'c1', autoStart: true, wait: 5 }],
                mockContainers
            );

            expect(writeFileMock).toHaveBeenCalledWith(
                mockPaths['docker-autostart'],
                'alpha 5\n',
                'utf8'
            );
            expect(writeFileMock).not.toHaveBeenCalledWith(
                mockPaths['docker-userprefs'],
                expect.any(String),
                expect.any(String)
            );
        });

        it('should remove auto-start file when no containers are configured', async () => {
            await service.updateAutostartConfiguration(
                [{ id: 'c1', autoStart: false, wait: 30 }],
                mockContainers,
                { persistUserPreferences: true }
            );

            expect(unlinkMock).toHaveBeenCalledWith(mockPaths['docker-autostart']);
            expect(writeFileMock).toHaveBeenCalledWith(
                mockPaths['docker-userprefs'],
                '0="alpha"\n',
                'utf8'
            );
        });
    });

    it('should sanitize autostart wait values', () => {
        expect(service.sanitizeAutoStartWait(null)).toBe(0);
        expect(service.sanitizeAutoStartWait(undefined)).toBe(0);
        expect(service.sanitizeAutoStartWait(10)).toBe(10);
        expect(service.sanitizeAutoStartWait(-5)).toBe(0);
        expect(service.sanitizeAutoStartWait(NaN)).toBe(0);
    });
});
