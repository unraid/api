import { Inject } from '@nestjs/common';

import type { ConfigFeatures } from '@app/unraid-api/config/config.interface.js';

/**
 * Creates a string token representation of the arguements. Pure function.
 *
 * @param configName - The name of the config.
 * @returns A colon-separated string
 */
export function makeConfigToken(configName: string, ...details: string[]) {
    return ['ApiConfig', configName, ...details].join('.');
}

/**
 * Custom decorator to inject a config by name.
 * @param feature - The name of the config to inject.
 * @returns Dependency injector for the config.
 */
export function InjectConfig<K extends keyof ConfigFeatures>(feature: K) {
    return Inject(makeConfigToken(feature));
}
