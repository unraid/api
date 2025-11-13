import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@app/unraid-api/config/api-config.module.js', () => ({
    loadApiConfig: vi.fn(),
}));

vi.mock('@app/environment.js', () => ({
    getPackageJson: vi.fn(),
}));

vi.mock('@app/core/utils/files/file-exists.js', () => ({
    fileExists: vi.fn(),
}));

const { loadApiConfig } = await import('@app/unraid-api/config/api-config.module.js');
const { getPackageJson } = await import('@app/environment.js');
const { fileExists } = await import('@app/core/utils/files/file-exists.js');
const { PluginService } = await import('./plugin.service.js');

const CONNECT_PACKAGE = 'unraid-api-plugin-connect';

describe('PluginService.listPlugins', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        Reflect.set(PluginService, 'plugins', undefined);
    });

    it('skips connect plugin when no .plg file is present', async () => {
        vi.mocked(loadApiConfig).mockResolvedValue({ plugins: [CONNECT_PACKAGE] } as any);
        vi.mocked(getPackageJson).mockReturnValue({
            peerDependencies: {
                [CONNECT_PACKAGE]: '1.0.0',
                'unraid-api-plugin-example': '1.0.0',
            },
        } as any);
        vi.mocked(fileExists).mockResolvedValue(false);

        const plugins = await PluginService.listPlugins();

        expect(plugins).toEqual([]);
        expect(vi.mocked(fileExists)).toHaveBeenCalledTimes(2);
    });

    it('keeps connect plugin when a .plg file exists', async () => {
        vi.mocked(loadApiConfig).mockResolvedValue({ plugins: [CONNECT_PACKAGE] } as any);
        vi.mocked(getPackageJson).mockReturnValue({
            peerDependencies: {
                [CONNECT_PACKAGE]: '1.0.0',
                'unraid-api-plugin-example': '1.0.0',
            },
        } as any);
        vi.mocked(fileExists).mockImplementation(async (path) => path.endsWith('.plg'));

        const plugins = await PluginService.listPlugins();

        expect(plugins).toEqual([[CONNECT_PACKAGE, '1.0.0']]);
        expect(vi.mocked(fileExists)).toHaveBeenCalled();
    });
});
