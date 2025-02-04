import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { promises as fs } from 'fs';
import { join } from 'path';

import { createPatch } from 'diff';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fileExistsSync } from '@app/core/utils/files/file-exists';
import {
    FileModification,
    ShouldApplyWithReason,
} from '@app/unraid-api/unraid-file-modifier/file-modification';
import { UnraidFileModificationService } from '@app/unraid-api/unraid-file-modifier/unraid-file-modifier.service';

const FIXTURE_PATH = join(__dirname, 'modifications', '__test__', '__fixtures__', 'text-patch-file.txt');
const ORIGINAL_CONTENT = 'original';

class TestFileModification extends FileModification {
    id = 'test';
    public readonly filePath: string = FIXTURE_PATH;

    protected async generatePatch(overridePath?: string): Promise<string> {
        return createPatch(overridePath ?? 'text-patch-file.txt', ORIGINAL_CONTENT, 'modified');
    }

    async shouldApply(): Promise<ShouldApplyWithReason> {
        return { shouldApply: true, reason: 'Always Apply this mod' };
    }
}

describe.sequential('FileModificationService', () => {
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
        // Create/reset the fixture file before each test
        await fs.writeFile(FIXTURE_PATH, ORIGINAL_CONTENT);

        mockLogger = {
            log: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn(),
            verbose: vi.fn(),
        };

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

    it('should apply modification if file does not exist', async () => {
        const mod = new TestFileModification(logger);
        // @ts-expect-error - This is a protected method, but we need to mock it
        mod.generatePatch = vi.fn().mockResolvedValue(createPatch(FIXTURE_PATH, '', 'modified'));
        await fs.unlink(FIXTURE_PATH);
        await expect(service.applyModification(mod)).resolves.toBe(undefined);
        expect(mockLogger.warn).toHaveBeenCalledWith('Could not load pregenerated patch for: test');
        expect(mockLogger.log).toHaveBeenCalledWith(
            'Applying modification: test - Always Apply this mod'
        );
        expect(mockLogger.log).toHaveBeenCalledWith('Modification applied successfully: test');
        const content = await fs.readFile(FIXTURE_PATH, 'utf-8');
        expect(content).toBe('modified');
        await service.rollbackAll();
        expect(fileExistsSync(FIXTURE_PATH)).toBe(false);
        expect(mockLogger.log).toHaveBeenCalledWith('Rolling back modification: test');
        expect(mockLogger.log).toHaveBeenCalledWith('Successfully rolled back modification: test');
    });

    it('should not rollback any mods without loaded', async () => {
        await expect(service.rollbackAll()).resolves.toBe(undefined);
    });

    it('should rollback all mods', async () => {
        await service.loadModifications();
        const initialContent = await fs.readFile(FIXTURE_PATH, 'utf-8');
        expect(initialContent).toBe(ORIGINAL_CONTENT);

        const mod = new TestFileModification(logger);

        await service.applyModification(mod);
        const modifiedContent = await fs.readFile(FIXTURE_PATH, 'utf-8');
        expect(modifiedContent).toBe('modified');

        await service.rollbackAll();
        const rolledBackContent = await fs.readFile(FIXTURE_PATH, 'utf-8');
        expect(rolledBackContent).toBe(ORIGINAL_CONTENT);

        expect(mockLogger.warn).toHaveBeenCalledWith('Could not load pregenerated patch for: test');
        expect(mockLogger.log.mock.calls).toEqual([
            ['RootTestModule dependencies initialized'],
            ['Applying modification: test - Always Apply this mod'],
            ['Modification applied successfully: test'],
            ['Rolling back modification: test'],
            ['Successfully rolled back modification: test'],
        ]);
    });

    it('should handle errors during dual application', async () => {
        await service.loadModifications();
        const initialContent = await fs.readFile(FIXTURE_PATH, 'utf-8');
        expect(initialContent).toBe(ORIGINAL_CONTENT);

        const mod = new TestFileModification(logger);

        await service.applyModification(mod);

        expect(mockLogger.log.mock.calls).toEqual([
            ['RootTestModule dependencies initialized'],
            ['Applying modification: test - Always Apply this mod'],
            ['Modification applied successfully: test'],
        ]);

        // Now apply again and ensure the contents don't change
        await service.applyModification(mod);
        const errorMessage = mockLogger.warn.mock.calls[0][0];
        expect(errorMessage).toContain('Could not load pregenerated patch for: test');
    });

    afterEach(async () => {
        await service.rollbackAll();
        vi.clearAllMocks();
    });
});
