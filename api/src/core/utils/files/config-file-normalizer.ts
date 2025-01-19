import { isEqual } from 'lodash-es';

import { getAllowedOrigins } from '@app/common/allowed-origins';
import { initialState } from '@app/store/modules/config';
import {
    MyServersConfig,
    MyServersConfigMemory,
    MyServersConfigMemorySchema,
    MyServersConfigSchema,
} from '@app/types/my-servers-config';

// Define ConfigType and ConfigObject
export type ConfigType = 'flash' | 'memory';

/**
 * Get a writeable configuration based on the mode ('flash' or 'memory').
 */
export const getWriteableConfig = <T extends ConfigType>(
    config: T extends 'memory' ? MyServersConfigMemory : MyServersConfig,
    mode: T
): T extends 'memory' ? MyServersConfigMemory : MyServersConfig => {
    const schema = mode === 'memory' ? MyServersConfigMemorySchema : MyServersConfigSchema;

    const defaultConfig = schema.parse(initialState);
    // Use a type assertion for the mergedConfig to include `connectionStatus` only if `mode === 'memory`
    const mergedConfig = {
        ...defaultConfig,
        ...config,
        remote: {
            ...defaultConfig.remote,
            ...config.remote,
        },
    } as T extends 'memory' ? MyServersConfigMemory : MyServersConfig;

    if (mode === 'memory') {
        (mergedConfig as MyServersConfigMemory).remote.allowedOrigins = getAllowedOrigins().join(', ');
        (mergedConfig as MyServersConfigMemory).connectionStatus = {
            ...(defaultConfig as MyServersConfigMemory).connectionStatus,
            ...(config as MyServersConfigMemory).connectionStatus,
        };
    }

    return schema.parse(mergedConfig) as any; // Narrowing ensures correct typing
};
