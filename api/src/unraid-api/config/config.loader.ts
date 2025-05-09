import { isDefined } from 'class-validator';

import * as Env from '@app/environment.js';
import { store } from '@app/store/index.js';

/**
 * Provides environment-related app configuration for the NestJS Config.
 *
 * These values are not namespaced. They are expected to be constant for the lifetime of the app,
 * so no sync logic is required.
 *
 * @returns
 */
export const loadAppEnvironment = () => {
    const configEntries = Object.entries(Env).filter(
        ([, value]) => typeof value !== 'function' && isDefined(value)
    );
    return Object.fromEntries(configEntries);
};

/**
 * Provides the legacy redux store's state under the `store` key.
 *
 * This is used to (initially) provide the store to the NestJS Config.
 * It will not keep them in sync.
 *
 * @returns
 */
export const loadLegacyStore = () => {
    return {
        store: store.getState(),
    };
};
