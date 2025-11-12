import { join } from 'node:path';

import type { SliceState } from '@app/store/modules/emhttp.js';
import type { StateFileToIniParserMap } from '@app/store/types.js';
import { parseConfig } from '@app/core/utils/misc/parse-config.js';
import { store } from '@app/store/index.js';
import { updateEmhttpState } from '@app/store/modules/emhttp.js';
import { parse as parseDevices } from '@app/store/state-parsers/devices.js';
import { parse as parseNetwork } from '@app/store/state-parsers/network.js';
import { parse as parseNfs } from '@app/store/state-parsers/nfs.js';
import { parse as parseNginx } from '@app/store/state-parsers/nginx.js';
import { parse as parseShares } from '@app/store/state-parsers/shares.js';
import { parse as parseSlots } from '@app/store/state-parsers/slots.js';
import { parse as parseSmb } from '@app/store/state-parsers/smb.js';
import { parse as parseUsers } from '@app/store/state-parsers/users.js';
import { parse as parseVar } from '@app/store/state-parsers/var.js';
import { StateFileKey } from '@app/store/types.js';

type ParserReturnMap = {
    [StateFileKey.var]: ReturnType<typeof parseVar>;
    [StateFileKey.devs]: ReturnType<typeof parseDevices>;
    [StateFileKey.network]: ReturnType<typeof parseNetwork>;
    [StateFileKey.nginx]: ReturnType<typeof parseNginx>;
    [StateFileKey.shares]: ReturnType<typeof parseShares>;
    [StateFileKey.disks]: ReturnType<typeof parseSlots>;
    [StateFileKey.users]: ReturnType<typeof parseUsers>;
    [StateFileKey.sec]: ReturnType<typeof parseSmb>;
    [StateFileKey.sec_nfs]: ReturnType<typeof parseNfs>;
};

const PARSER_MAP: { [K in StateFileKey]: StateFileToIniParserMap[K] } = {
    [StateFileKey.var]: parseVar,
    [StateFileKey.devs]: parseDevices,
    [StateFileKey.network]: parseNetwork,
    [StateFileKey.nginx]: parseNginx,
    [StateFileKey.shares]: parseShares,
    [StateFileKey.disks]: parseSlots,
    [StateFileKey.users]: parseUsers,
    [StateFileKey.sec]: parseSmb,
    [StateFileKey.sec_nfs]: parseNfs,
};

/**
 * Synchronously loads an emhttp state file, updates the Redux store slice, and returns the parsed state.
 *
 * Designed for bootstrap contexts (CLI, plugin loading, etc.) where dispatching the async thunks is
 * impractical but we still need authoritative emhttp state from disk.
 */
export const loadStateFileSync = <K extends StateFileKey>(
    stateFileKey: K
): ParserReturnMap[K] | null => {
    const state = store.getState();
    const statesDirectory = state.paths?.states;

    if (!statesDirectory) {
        return null;
    }

    const filePath = join(statesDirectory, `${stateFileKey}.ini`);

    try {
        const parser = PARSER_MAP[stateFileKey] as StateFileToIniParserMap[K];
        const rawConfig = parseConfig<Record<string, unknown>>({
            filePath,
            type: 'ini',
        });
        const config = rawConfig as Parameters<StateFileToIniParserMap[K]>[0];
        const parsed = (parser as (input: any) => ParserReturnMap[K])(config);

        store.dispatch(
            updateEmhttpState({
                field: stateFileKey,
                state: parsed as Partial<SliceState[keyof SliceState]>,
            })
        );

        return parsed;
    } catch (error) {
        return null;
    }
};
