import { parseConfig } from '@app/core/utils/misc/parse-config';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { access } from 'fs/promises';
import { F_OK } from 'constants';
import { type RecursivePartial, type RecursiveNullable } from '@app/types';
import { type DynamixConfig } from '@app/core/types/ini';
import { batchProcess } from '@app/utils';

/**
 * Loads a configuration file from disk, parses it to a RecursivePartial of the provided type, and returns it.
 *
 * If the file is inaccessible, an empty object is returned instead.
 *
 * @param path The path to the configuration file on disk.
 * @returns A parsed RecursivePartial of the provided type.
 */
async function loadConfigFile<ConfigType>(path: string): Promise<RecursivePartial<ConfigType>> {
    const fileIsAccessible = await access(path, F_OK)
        .then(() => true)
        .catch(() => false);
    return fileIsAccessible
        ? parseConfig<RecursivePartial<ConfigType>>({
              filePath: path,
              type: 'ini',
          })
        : {};
}

/**
 * Load the dynamix.cfg into the store.
 *
 * Note: If the file doesn't exist this will fallback to default values.
 */
export const loadDynamixConfigFile = createAsyncThunk<
    RecursiveNullable<RecursivePartial<DynamixConfig>>,
    string | undefined
>('config/load-dynamix-config-file', async (filePath) => {
    if (filePath) {
        return loadConfigFile<DynamixConfig>(filePath);
    }
    const store = await import('@app/store');
    const paths = store.getters.paths()['dynamix-config'];
    const { data: configs } = await batchProcess(paths, (path) => loadConfigFile<DynamixConfig>(path));
    const [defaultConfig = {}, customConfig = {}] = configs;
    return { ...defaultConfig, ...customConfig };
});
