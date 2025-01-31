import camelCaseKeys from 'camelcase-keys';

import { logger } from '@app/core/log';
import { parseConfig } from '@app/core/utils/misc/parse-config';

/**
 * Loads state from path.
 * @param filePath Path to state file.
 */
export const loadState = <T extends Record<string, unknown>>(filePath: string): T | undefined => {
    try {
        const config = camelCaseKeys(
            parseConfig<T>({
                filePath,
                type: 'ini',
            }),
            {
                deep: true,
            }
        ) as T;

        logger.trace({ config }, '"%s" was loaded', filePath);

        return config;
    } catch (error: unknown) {
        logger.trace(
            'Failed loading state file "%s" with "%s"',
            filePath,
            error instanceof Error ? error.message : error
        );
    }

    return undefined;
};
