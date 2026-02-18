import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import * as ini from 'ini';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { loadDynamixConfigFromDiskSync } from '@app/store/actions/load-dynamix-config-file.js';
import { getters, store } from '@app/store/index.js';
import { updateDynamixConfig } from '@app/store/modules/dynamix.js';
import { DisplayService } from '@app/unraid-api/graph/resolvers/info/display/display.service.js';

const { mockedPaths, dispatchMock } = vi.hoisted(() => ({
    mockedPaths: vi.fn(),
    dispatchMock: vi.fn(),
}));

vi.mock('@app/store/index.js', () => ({
    getters: {
        paths: mockedPaths,
    },
    store: {
        dispatch: dispatchMock,
    },
}));

vi.mock('@app/store/actions/load-dynamix-config-file.js', () => ({
    loadDynamixConfigFromDiskSync: vi.fn(),
}));

vi.mock('@app/store/modules/dynamix.js', () => ({
    updateDynamixConfig: vi.fn((payload: unknown) => ({
        type: 'dynamix/updateDynamixConfig',
        payload,
    })),
}));

describe('DisplayService mutations', () => {
    let service: DisplayService;
    let tempDir: string;
    let displayCfg: string;

    beforeEach(async () => {
        vi.clearAllMocks();
        service = new DisplayService();

        tempDir = await mkdtemp(join(tmpdir(), 'display-mutations-'));
        displayCfg = join(tempDir, 'dynamix.cfg');

        await writeFile(displayCfg, '[display]\ntheme="white"\nlocale="en_US"\n');

        mockedPaths.mockReturnValue({
            'dynamix-base': tempDir,
            'dynamix-config': [join(tempDir, 'default.cfg'), displayCfg],
        });

        vi.mocked(loadDynamixConfigFromDiskSync).mockReturnValue({
            display: {
                theme: 'black',
                locale: 'fr_FR',
            },
        } as any);

        vi.mocked(updateDynamixConfig).mockReturnValue({
            type: 'dynamix/updateDynamixConfig',
            payload: { display: { theme: 'black', locale: 'fr_FR' } },
        } as any);

        vi.mocked(store.dispatch).mockReturnValue(undefined as any);
    });

    afterEach(async () => {
        await rm(tempDir, { recursive: true, force: true });
        vi.unstubAllGlobals();
    });

    it('setTheme updates dynamix cfg and refreshes in-memory config', async () => {
        const result = await service.setTheme('black');

        const contents = await readFile(displayCfg, 'utf-8');
        const parsed = ini.parse(contents) as { display?: { theme?: string } };

        expect(parsed.display?.theme).toBe('black');
        expect(loadDynamixConfigFromDiskSync).toHaveBeenCalledWith([
            join(tempDir, 'default.cfg'),
            displayCfg,
        ]);
        expect(updateDynamixConfig).toHaveBeenCalled();
        expect(store.dispatch).toHaveBeenCalled();
        expect(result.theme).toBe('black');
    });

    it('setLocale updates dynamix cfg and refreshes in-memory config', async () => {
        const result = await service.setLocale('fr_FR');

        const contents = await readFile(displayCfg, 'utf-8');
        const parsed = ini.parse(contents) as { display?: { locale?: string } };

        expect(parsed.display?.locale).toBe('fr_FR');
        expect(loadDynamixConfigFromDiskSync).toHaveBeenCalledWith([
            join(tempDir, 'default.cfg'),
            displayCfg,
        ]);
        expect(updateDynamixConfig).toHaveBeenCalled();
        expect(store.dispatch).toHaveBeenCalled();
        expect(result.locale).toBe('fr_FR');
    });

    it('throws when dynamix config path is unavailable', async () => {
        mockedPaths.mockReturnValue({
            'dynamix-base': tempDir,
        });

        await expect(service.setTheme('black')).rejects.toThrow('Dynamix config path not found');
        await expect(service.setLocale('fr_FR')).rejects.toThrow('Dynamix config path not found');
    });

    it('maps language feed response into graphql language objects', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                en_US: { Desc: 'English', URL: 'https://example.com/en_US.txz' },
                fr_FR: { Desc: 'French', URL: 'https://example.com/fr_FR.txz' },
            }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await service.getAvailableLanguages();

        expect(fetchMock).toHaveBeenCalledWith(
            'https://assets.ca.unraid.net/feed/languageSelection.json'
        );
        expect(result).toEqual([
            {
                code: 'en_US',
                name: 'English',
                url: 'https://example.com/en_US.txz',
            },
            {
                code: 'fr_FR',
                name: 'French',
                url: 'https://example.com/fr_FR.txz',
            },
        ]);
    });

    it('returns english fallback when language feed request fails', async () => {
        const fetchMock = vi.fn().mockRejectedValue(new Error('network failure'));
        vi.stubGlobal('fetch', fetchMock);

        const result = await service.getAvailableLanguages();

        expect(result).toEqual([{ code: 'en_US', name: 'English' }]);
    });
});
