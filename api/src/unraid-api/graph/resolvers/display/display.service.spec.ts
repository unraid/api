import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { resolve } from 'path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DisplayService } from '@app/unraid-api/graph/resolvers/display/display.service.js';

// Mock fs/promises at the module level
vi.mock('node:fs/promises', async () => {
    const actualFs = (await vi.importActual('node:fs/promises')) as typeof import('node:fs/promises');
    return {
        ...actualFs,
        readFile: vi.fn().mockImplementation(actualFs.readFile),
    };
});

// Mock the store to use dev paths
const devBasePath = resolve(import.meta.dirname, '../../../../../dev');
const mockPaths = {
    'dynamix-base': resolve(devBasePath, 'dynamix'),
    'dynamix-config': [
        resolve(devBasePath, 'dynamix/default.cfg'),
        resolve(devBasePath, 'dynamix/dynamix.cfg'),
    ],
};

vi.mock('@app/store/index.js', async () => {
    const actual = await vi.importActual('@app/store/index.js');
    return {
        ...actual,
        getters: {
            paths: vi.fn(() => mockPaths),
        },
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

    describe('generateDisplay', () => {
        it('should return display with case info and configuration from dev files', async () => {
            const result = await service.generateDisplay();

            expect(result).toEqual({
                id: 'display',
                case: {
                    url: '',
                    icon: 'case-model.png',
                    error: '',
                    base64: '',
                },
                date: '%c',
                time: '%I:%M %p',
                number: '.,',
                scale: false, // -1 converted to false
                tabs: true, // 1 converted to true
                users: 'Tasks:3',
                resize: false, // 0 converted to false
                wwn: false, // 0 converted to false
                total: true, // 1 converted to true
                usage: false, // 0 converted to false
                banner: 'image',
                dashapps: 'icons',
                theme: 'black',
                text: true, // 1 converted to true
                unit: 'C',
                warning: 70,
                critical: 90,
                hot: 45,
                max: 55,
                locale: 'en_US', // default when not specified
                header: '336699',
                headermetacolor: 'FFFFFF',
                background: 'F0F0F0',
                showBannerGradient: 'yes',
                sysinfo: '/Tools/SystemProfiler',
            });
        });

        it('should handle missing case model config file gracefully', async () => {
            // Temporarily override paths to point to non-existent file
            const originalPaths = mockPaths['dynamix-base'];
            mockPaths['dynamix-base'] = '/non/existent/path';

            const result = await service.generateDisplay();

            expect(result.case).toEqual({
                url: '',
                icon: 'default',
                error: '',
                base64: '',
            });

            // Restore original paths
            mockPaths['dynamix-base'] = originalPaths;
        });

        it('should handle missing dynamix config files gracefully', async () => {
            // Temporarily override paths to point to non-existent files
            const originalPaths = mockPaths['dynamix-config'];
            mockPaths['dynamix-config'] = ['/non/existent/default.cfg', '/non/existent/dynamix.cfg'];

            const result = await service.generateDisplay();

            expect(result).toEqual({
                id: 'display',
                case: {
                    url: '',
                    icon: 'case-model.png', // Still reads from case-model.cfg
                    error: '',
                    base64: '',
                },
                // No display config fields since files don't exist
            });

            // Restore original paths
            mockPaths['dynamix-config'] = originalPaths;
        });

        it('should merge configuration from multiple config files', async () => {
            // This test uses the actual dev files which have both default.cfg and dynamix.cfg
            const result = await service.generateDisplay();

            // The result should contain merged configuration from both files
            // dynamix.cfg values should override default.cfg values
            expect(result.theme).toBe('black'); // from dynamix.cfg
            expect(result.unit).toBe('C'); // from dynamix.cfg
            expect(result.locale).toBe('en_US'); // default fallback
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
