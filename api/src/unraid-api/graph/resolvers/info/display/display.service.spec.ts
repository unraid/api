import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import * as ini from 'ini';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DisplayService } from '@app/unraid-api/graph/resolvers/info/display/display.service.js';

// Mock fs/promises at the module level only for specific test cases
vi.mock('node:fs/promises', async () => {
    const actualFs = (await vi.importActual('node:fs/promises')) as typeof import('node:fs/promises');
    return {
        ...actualFs,
        readFile: vi.fn().mockImplementation(actualFs.readFile),
    };
});

describe('DisplayService', () => {
    let service: DisplayService;

    beforeEach(async () => {
        // Reset all mocks
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [DisplayService],
        }).compile();

        service = module.get<DisplayService>(DisplayService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('updateCfgFile', () => {
        it('should preserve quoted yes/no-style display values', async () => {
            const tempDir = await mkdtemp(join(tmpdir(), 'display-service-'));
            const configPath = join(tempDir, 'dynamix.cfg');

            try {
                await writeFile(configPath, '[display]\nterminalButton="yes"\n');
                await (service as any).updateCfgFile(configPath, 'display', { theme: 'white' });

                const written = await readFile(configPath, 'utf-8');
                expect(written).toContain('terminalButton="yes"');

                const parsed = ini.parse(written) as {
                    display?: { terminalButton?: string; theme?: string };
                };
                expect(parsed.display?.terminalButton).toBe('yes');
                expect(parsed.display?.theme).toBe('white');
            } finally {
                await rm(tempDir, { recursive: true, force: true });
            }
        });
    });

    describe('generateDisplay', () => {
        it('should return display with case info and configuration from dev files', async () => {
            const result = await service.generateDisplay();

            // Verify basic structure
            expect(result).toHaveProperty('id', 'info/display');
            expect(result).toHaveProperty('case');
            expect(result.case).toHaveProperty('url');
            expect(result.case).toHaveProperty('icon');
            expect(result.case).toHaveProperty('error');
            expect(result.case).toHaveProperty('base64');

            // Verify case info is properly loaded (should have an icon from case-model.cfg)
            expect(result.case!.icon).toBeTruthy();
            expect(result.case!.error).toBe('');
        });

        it('should handle missing case model config file gracefully', async () => {
            // Mock fs.readFile to simulate missing file by throwing an error
            const fs = await import('node:fs/promises');

            vi.mocked(fs.readFile).mockImplementation(async (path, options) => {
                if (path.toString().includes('case-model.cfg')) {
                    const error = new Error('ENOENT: no such file or directory');
                    (error as any).code = 'ENOENT';
                    throw error;
                }
                // Use the original implementation for other files
                const actualFs = (await vi.importActual(
                    'node:fs/promises'
                )) as typeof import('node:fs/promises');
                return actualFs.readFile(path, options);
            });

            const result = await service.generateDisplay();

            expect(result.case).toEqual({
                id: 'display/case',
                url: '',
                icon: 'custom',
                error: 'could-not-read-config-file',
                base64: '',
            });

            // Reset the mock to default behavior
            const actualFs = (await vi.importActual(
                'node:fs/promises'
            )) as typeof import('node:fs/promises');
            vi.mocked(fs.readFile).mockImplementation(actualFs.readFile);
        });

        it('should handle missing dynamix config files gracefully', async () => {
            // This test validates that the service handles missing config files
            // The loadState function will return null for non-existent files
            // We can test this by temporarily creating a service instance
            // that would encounter missing files in production
            const result = await service.generateDisplay();

            // Should still return basic structure even if some config is missing
            expect(result).toHaveProperty('id', 'info/display');
            expect(result).toHaveProperty('case');
            // The actual config depends on what's in the dev files
        });

        it('should merge configuration from multiple config files', async () => {
            // This test uses the actual dev files which have both default.cfg and dynamix.cfg
            const result = await service.generateDisplay();

            // The result should contain merged configuration from both files
            // dynamix.cfg values should override default.cfg values
            expect(result.theme).toBe('black');
            expect(result.unit).toBe('C');
            expect(result.scale).toBe(false); // -1 converted to false
            expect(result.tabs).toBe(true); // 1 converted to true
            expect(result.resize).toBe(false); // 0 converted to false
            expect(result.wwn).toBe(false); // 0 converted to false
            expect(result.total).toBe(true); // 1 converted to true
            expect(result.usage).toBe(false); // 0 converted to false
            expect(result.text).toBe(true); // 1 converted to true
            expect(result.warning).toBe(70);
            expect(result.critical).toBe(90);
            expect(result.hot).toBe(45);
            expect(result.max).toBe(55);
            expect(result.locale).toBe('en_US'); // default fallback when not specified
        });

        it('should handle empty case model config file', async () => {
            // Create a test that simulates an empty case-model.cfg
            const fs = await import('node:fs/promises');

            vi.mocked(fs.readFile).mockImplementation(async (path, options) => {
                if (path.toString().includes('case-model.cfg')) {
                    return Buffer.from('   \n'); // Empty/whitespace only
                }
                // Use the original implementation for other files
                const actualFs = (await vi.importActual(
                    'node:fs/promises'
                )) as typeof import('node:fs/promises');
                return actualFs.readFile(path, options);
            });

            const result = await service.generateDisplay();

            expect(result.case).toEqual({
                id: 'display/case',
                url: '',
                icon: 'default',
                error: '',
                base64: '',
            });

            // Reset the mock to default behavior
            const actualFs = (await vi.importActual(
                'node:fs/promises'
            )) as typeof import('node:fs/promises');
            vi.mocked(fs.readFile).mockImplementation(actualFs.readFile);
        });
    });
});
