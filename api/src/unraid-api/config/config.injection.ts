import { Inject } from '@nestjs/common';

import type { ConfigFeatures } from '@app/unraid-api/config/config.interface.js';
import { ConfigRegistry } from '@app/unraid-api/config/config.registry.js';

/**
 * Custom decorator to inject a config by name.
 * @param feature - The name of the config to inject.
 * @returns Dependency injector for the config.
 */
export function InjectConfig<K extends keyof ConfigFeatures>(feature: K) {
    return Inject(ConfigRegistry.getConfigToken(feature));
}
