import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as safeModeUtils from '@app/core/utils/safe-mode.js';
import { PluginService } from '@app/unraid-api/plugin/plugin.service.js';

type PluginServicePrivateApi = {
    plugins?: Promise<unknown>;
    importPlugins(): Promise<unknown>;
};

const PrivatePluginService = PluginService as unknown as PluginServicePrivateApi;

describe('PluginService.getPlugins safe mode handling', () => {
    beforeEach(() => {
        PrivatePluginService.plugins = undefined;
    });

    afterEach(() => {
        PrivatePluginService.plugins = undefined;
        vi.restoreAllMocks();
    });

    it('returns an empty array and skips imports when safe mode is enabled', async () => {
        const safeModeSpy = vi.spyOn(safeModeUtils, 'isSafeModeEnabled').mockReturnValue(true);
        const importSpy = vi
            .spyOn(PrivatePluginService, 'importPlugins')
            .mockResolvedValue([{ name: 'example', version: '1.0.0' }]);

        const plugins = await PluginService.getPlugins();

        expect(plugins).toEqual([]);
        expect(safeModeSpy).toHaveBeenCalledTimes(1);
        expect(importSpy).not.toHaveBeenCalled();
    });

    it('loads plugins when safe mode is disabled', async () => {
        const expected = [{ name: 'example', version: '1.0.0' }];
        vi.spyOn(safeModeUtils, 'isSafeModeEnabled').mockReturnValue(false);
        const importSpy = vi.spyOn(PrivatePluginService, 'importPlugins').mockResolvedValue(expected);

        const plugins = await PluginService.getPlugins();

        expect(plugins).toBe(expected);
        expect(importSpy).toHaveBeenCalledTimes(1);
    });
});
