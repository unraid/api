import { Inject } from '@nestjs/common';

import type { ConfigFeatures } from './config.interface.js';
import { ConfigRegistry } from './config.registry.js';

/**
 * Custom decorator to inject a config by name.
 * @param feature - The name of the config to inject.
 * @returns Dependency injector for the config.
 */
export function InjectConfig<K extends keyof ConfigFeatures>(feature: K) {
    return Inject(ConfigRegistry.getConfigToken(feature));
}
