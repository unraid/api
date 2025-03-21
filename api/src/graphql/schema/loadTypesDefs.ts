import { mergeTypeDefs } from '@graphql-tools/merge';

import { logger } from '@app/core/log.js';

export const loadTypeDefs = async (additionalTypeDefs: string[] = []) => {
    // TypeScript now knows this returns Record<string, () => Promise<string>>
    const typeModules = import.meta.glob('./types/**/*.graphql', { query: '?raw', import: 'default' });

    try {
        const files = await Promise.all(
            Object.values(typeModules).map(async (importFn) => {
                const content = await importFn();
                if (typeof content !== 'string') {
                    throw new Error('Invalid GraphQL type definition format');
                }
                return content;
            })
        );
        if (!files.length) {
            throw new Error('No GraphQL type definitions found');
        }
        files.push(...additionalTypeDefs);
        return mergeTypeDefs(files);
    } catch (error) {
        logger.error('Failed to load GraphQL type definitions:', error);
        throw error;
    }
};
