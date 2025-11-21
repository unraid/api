import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PluginManagementService } from '@app/unraid-api/plugin/plugin-management.service.js';

describe('PluginManagementService', () => {
    let service: PluginManagementService;
    let configStore: string[];
    let configService: {
        get: ReturnType<typeof vi.fn>;
        set: ReturnType<typeof vi.fn>;
    };
    let dependencyService: {
        npm: ReturnType<typeof vi.fn>;
        rebuildVendorArchive: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        configStore = ['unraid-api-plugin-connect', '@unraid/test-plugin'];
        configService = {
            get: vi.fn((key: string, defaultValue?: unknown) => {
                if (key === 'api.plugins') {
                    return configStore ?? defaultValue ?? [];
                }
                if (key === 'api') {
                    return { plugins: configStore ?? defaultValue ?? [] };
                }
                return defaultValue;
            }),
            set: vi.fn((key: string, value: unknown) => {
                if (key === 'api' && typeof value === 'object' && value !== null) {
                    // @ts-expect-error - value is an object
                    if (Array.isArray(value.plugins)) {
                        // @ts-expect-error - value is an object
                        configStore = [...value.plugins];
                    }
                }
                if (key === 'api.plugins' && Array.isArray(value)) {
                    configStore = [...value];
                }
            }),
        };
        dependencyService = {
            npm: vi.fn().mockResolvedValue(undefined),
            rebuildVendorArchive: vi.fn().mockResolvedValue(undefined),
        };

        service = new PluginManagementService(configService as never, dependencyService as never);
    });

    it('rebuilds vendor archive when removing unbundled plugins', async () => {
        await service.removePlugin('@unraid/test-plugin');

        expect(dependencyService.npm).toHaveBeenCalledWith('uninstall', '@unraid/test-plugin');
        expect(dependencyService.rebuildVendorArchive).toHaveBeenCalledTimes(1);
        expect(configStore).not.toContain('@unraid/test-plugin');
    });

    it('skips vendor archive when only bundled plugins are removed', async () => {
        await service.removePlugin('unraid-api-plugin-connect');

        expect(dependencyService.npm).not.toHaveBeenCalled();
        expect(dependencyService.rebuildVendorArchive).not.toHaveBeenCalled();
        expect(configStore).not.toContain('unraid-api-plugin-connect');
    });

    it('does not rebuild vendor archive when bypassing npm uninstall', async () => {
        await service.removePluginConfigOnly('@unraid/test-plugin');

        expect(dependencyService.npm).not.toHaveBeenCalled();
        expect(dependencyService.rebuildVendorArchive).not.toHaveBeenCalled();
        expect(configStore).not.toContain('@unraid/test-plugin');
    });
});
