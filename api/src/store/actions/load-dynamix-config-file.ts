import { parseConfig } from '@app/core/utils/misc/parse-config';
import {
    createAsyncThunk,
} from '@reduxjs/toolkit';
import { access } from 'fs/promises';
import { F_OK } from 'constants';
import { type RecursivePartial, type RecursiveNullable } from '@app/types';
import { type DynamixConfig } from '@app/core/types/ini';

/**
 * Load the dynamix.cfg into the store.
 *
 * Note: If the file doesn't exist this will fallback to default values.
 */
export const loadDynamixConfigFile = createAsyncThunk<
    RecursiveNullable<RecursivePartial<DynamixConfig>>,
    string | undefined
>('config/load-dynamix-config-file', async (filePath) => {
    const store = await import('@app/store');
    const paths = store.getters.paths();
    const path = filePath ?? paths['dynamix-config'];
    const fileExists = await access(path, F_OK)
        .then(() => true)
        .catch(() => false);
    const file: RecursivePartial<DynamixConfig> = fileExists
        ? parseConfig<RecursivePartial<DynamixConfig>>({
              filePath: path,
              type: 'ini',
          })
        : {};

    return file;
});
