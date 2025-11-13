import { store } from '@app/store/index.js';
import { loadStateFileSync } from '@app/store/services/state-file-loader.js';
import { StateFileKey } from '@app/store/types.js';

export const isSafeModeEnabled = (): boolean => {
    const safeModeFromStore = store.getState().emhttp?.var?.safeMode;
    if (typeof safeModeFromStore === 'boolean') {
        return safeModeFromStore;
    }

    const varState = loadStateFileSync(StateFileKey.var);
    if (varState) {
        return Boolean(varState.safeMode);
    }

    return false;
};
