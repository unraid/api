import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    FileModification,
    UnraidFileModificationService,
} from '@app/unraid-api/unraid-file-modifier/unraid-file-modifier.service';

class TestFileModification implements FileModification {
    constructor(
        public applyImplementation?: () => Promise<void>,
        public rollbackImplementation?: () => Promise<void>
    ) {}
    id = 'test';
    async apply() {
        if (this.applyImplementation) {
            return this.applyImplementation();
        }
        throw new Error('Application not implemented.');
    }
    async rollback() {
        if (this.rollbackImplementation) {
            return this.rollbackImplementation();
        }
        throw new Error('Rollback not implemented.');
    }
    async shouldApply() {
        return { shouldApply: true, reason: 'Always Apply this mod' };
    }
}

describe('FileModificationService', () => {
    let mockLogger: {
        log: ReturnType<typeof vi.fn>;
        error: ReturnType<typeof vi.fn>;
        warn: ReturnType<typeof vi.fn>;
        debug: ReturnType<typeof vi.fn>;
        verbose: ReturnType<typeof vi.fn>;
    };
    let service: UnraidFileModificationService;
    beforeEach(async () => {
        mockLogger = {
            log: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn(),
            verbose: vi.fn(),
        };
        // Mock the Logger constructor
        vi.spyOn(Logger.prototype, 'log').mockImplementation(mockLogger.log);
        vi.spyOn(Logger.prototype, 'error').mockImplementation(mockLogger.error);
        vi.spyOn(Logger.prototype, 'warn').mockImplementation(mockLogger.warn);
        vi.spyOn(Logger.prototype, 'debug').mockImplementation(mockLogger.debug);
        vi.spyOn(Logger.prototype, 'verbose').mockImplementation(mockLogger.verbose);
        const module: TestingModule = await Test.createTestingModule({
            providers: [UnraidFileModificationService],
        }).compile();

        service = module.get<UnraidFileModificationService>(UnraidFileModificationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should load modifications', async () => {
        const mods = await service.loadModifications();
        expect(mods).toHaveLength(3);
    });

    it('should apply modifications', async () => {
        await expect(
            service.applyModification(new TestFileModification())
        ).resolves.toBe(undefined);
    });

    it('should not rollback any mods without loaded', async () => {
        await expect(service.rollbackAll()).resolves.toBe(undefined);
    });

    it('should rollback all mods', async () => {
        await service.loadModifications();
        const applyFn = vi.fn();
        const rollbackFn = vi.fn();
        await service.applyModification(new TestFileModification(applyFn, rollbackFn));
        await expect(service.rollbackAll()).resolves.toBe(undefined);
        expect(mockLogger.error).not.toHaveBeenCalled();
        expect(mockLogger.log).toHaveBeenCalledTimes(5);
        expect(applyFn).toHaveBeenCalled();
        expect(rollbackFn).toHaveBeenCalled();
        expect(mockLogger.log).toHaveBeenNthCalledWith(1, 'RootTestModule dependencies initialized');
        expect(mockLogger.log).toHaveBeenNthCalledWith(
            2,
            'Applying modification: test - Always Apply this mod'
        );
        expect(mockLogger.log).toHaveBeenNthCalledWith(3, 'Modification applied successfully: test');
        expect(mockLogger.log).toHaveBeenNthCalledWith(4, 'Rolling back modification: test');
        expect(mockLogger.log).toHaveBeenNthCalledWith(5, 'Modification rolled back successfully: test');
    });

    it('should handle errors during rollback', async () => {
        const errorMod = new TestFileModification(vi.fn(), () =>
            Promise.reject(new Error('Rollback failed'))
        );
        await service.applyModification(errorMod);
        await service.rollbackAll();
        expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle concurrent modifications', async () => {
        const mods = [
            new TestFileModification(vi.fn(), vi.fn()),
            new TestFileModification(vi.fn(), vi.fn()),
        ];
        await Promise.all(mods.map((mod) => service.applyModification(mod)));
        await service.rollbackAll();
        mods.forEach((mod) => {
            expect(mod.rollbackImplementation).toHaveBeenCalled();
        });
    });

    afterEach(async () => {
        await service.rollbackAll();
        vi.clearAllMocks();
    });
});
