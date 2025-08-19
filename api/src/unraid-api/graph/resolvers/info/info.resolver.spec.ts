import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InfoResolver } from '@app/unraid-api/graph/resolvers/info/info.resolver.js';

// Mock necessary modules
vi.mock('@app/core/utils/misc/get-machine-id.js', () => ({
    getMachineId: vi.fn().mockResolvedValue('test-machine-id-123'),
}));

describe('InfoResolver', () => {
    let resolver: InfoResolver;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [InfoResolver],
        }).compile();

        resolver = module.get<InfoResolver>(InfoResolver);
    });

    describe('info', () => {
        it('should return basic info object', async () => {
            const result = await resolver.info();
            expect(result).toEqual({
                id: 'info',
            });
        });
    });

    describe('time', () => {
        it('should return current date', async () => {
            const before = new Date();
            const result = await resolver.time();
            const after = new Date();

            expect(result).toBeInstanceOf(Date);
            expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
        });
    });

    describe('baseboard', () => {
        it('should return baseboard stub for sub-resolver', () => {
            const result = resolver.baseboard();
            expect(result).toEqual({
                id: 'info/baseboard',
            });
        });
    });

    describe('cpu', () => {
        it('should return cpu stub for sub-resolver', () => {
            const result = resolver.cpu();
            expect(result).toEqual({
                id: 'info/cpu',
            });
        });
    });

    describe('devices', () => {
        it('should return devices stub for sub-resolver', () => {
            const result = resolver.devices();
            expect(result).toEqual({
                id: 'info/devices',
            });
        });
    });

    describe('display', () => {
        it('should return display stub for sub-resolver', () => {
            const result = resolver.display();
            expect(result).toEqual({
                id: 'info/display',
            });
        });
    });

    describe('machineId', () => {
        it('should return machine id', async () => {
            const { getMachineId } = await import('@app/core/utils/misc/get-machine-id.js');
            const result = await resolver.machineId();
            expect(getMachineId).toHaveBeenCalled();
            expect(result).toBe('test-machine-id-123');
        });
    });

    describe('memory', () => {
        it('should return memory stub for sub-resolver', () => {
            const result = resolver.memory();
            expect(result).toEqual({
                id: 'info/memory',
            });
        });
    });

    describe('os', () => {
        it('should return os stub for sub-resolver', () => {
            const result = resolver.os();
            expect(result).toEqual({
                id: 'info/os',
            });
        });
    });

    describe('system', () => {
        it('should return system stub for sub-resolver', () => {
            const result = resolver.system();
            expect(result).toEqual({
                id: 'info/system',
            });
        });
    });

    describe('versions', () => {
        it('should return versions stub for sub-resolver', () => {
            const result = resolver.versions();
            expect(result).toEqual({
                id: 'info/versions',
            });
        });
    });
});
