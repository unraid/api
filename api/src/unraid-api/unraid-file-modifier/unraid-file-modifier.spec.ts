import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { join } from 'path';



import { createPatch } from 'diff';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';



import { FileModification, PatchResult, ShouldApplyWithReason } from '@app/unraid-api/unraid-file-modifier/file-modification';
import { UnraidFileModificationService } from '@app/unraid-api/unraid-file-modifier/unraid-file-modifier.service';





class TestFileModification extends FileModification {
    id = 'test';

    constructor(logger: Logger) {
        super(logger);
    }

    protected async generatePatch(): Promise<PatchResult> {
        return {
            targetFile: join(__dirname, '__fixtures__/text-patch-file.txt'),
            patch: createPatch(
                '__fixtures__/text-patch-file.txt',
                'original',
                'modified',
                'original',
                'modified'
            ),
        };
    }

    apply = vi.fn();

    rollback = vi.fn();

    async shouldApply(): Promise<ShouldApplyWithReason> {
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
    let logger: Logger;

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

        logger = new Logger('test');

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
        expect(mods.length).toBeGreaterThan(0);
    });

    it('should apply modifications', async () => {
        const mod = new TestFileModification(logger);
        await expect(service.applyModification(mod)).resolves.toBe(undefined);
    });

    it('should not rollback any mods without loaded', async () => {
        await expect(service.rollbackAll()).resolves.toBe(undefined);
    });

    it('should rollback all mods', async () => {
        await service.loadModifications();
        const mod = new TestFileModification(logger);

        await service.applyModification(mod);
        await service.rollbackAll();

        expect(mockLogger.error).not.toHaveBeenCalled();
        expect(mockLogger.log.mock.calls).toEqual([
            ['RootTestModule dependencies initialized'],
            ['Applying modification: test - Always Apply this mod'],
            ['Modification applied successfully: test'],
            ['Rolling back modification: test'],
            ['Successfully rolled back modification: test'],
        ]);
    });

    it('should handle errors during rollback', async () => {
        // Mock the logger to track error calls

        const mod = new TestFileModification(logger);
        await service.applyModification(mod);
        console.log(service.appliedModifications);
        expect(mockLogger.log.mock.calls).toEqual([
            ['RootTestModule dependencies initialized'],
            ['Applying modification: test - Always Apply this mod'],
            ['Modification applied successfully: test'],
        ]);

        service.appliedModifications[0].appliedPatch = null;
        console.log(service.appliedModifications);
        // Now break the appliedModifications array so that the rollbackAll method fails
        await service.rollbackAll();

        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining('Failed to roll back modification')
        );
    });

    it('should handle concurrent modifications', async () => {
        vi.mock('fs/promises', () => ({
            readFile: vi.fn().mockResolvedValue('modified'),
            writeFile: vi.fn(),
        }));
        const mods = [new TestFileModification(logger), new TestFileModification(logger)];

        await Promise.all(mods.map((mod) => service.applyModification(mod)));
        await service.rollbackAll();

        expect(mockLogger.error).not.toHaveBeenCalled();
        expect(mockLogger.log).toHaveBeenCalledWith(
            expect.stringContaining('Successfully rolled back modification')
        );
    });

    afterEach(async () => {
        await service.rollbackAll();
        vi.clearAllMocks();
        vi.resetModules();
    });
});