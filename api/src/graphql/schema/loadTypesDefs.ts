import type { TypeSource } from '@graphql-tools/utils';
import { mergeTypeDefs } from '@graphql-tools/merge';

export const loadTypeDefs = async () => {
    const logger = (await import('@app/core/log')).logger;

    logger.debug('Loading GraphQL type definitions');

    // TypeScript now knows this returns Record<string, () => Promise<string>>
    const typeModules = import.meta.glob('./types/**/*.graphql', { query: '?raw', import: 'default' });

    const files = await Promise.all(Object.values(typeModules).map((importFn) => importFn()));
    return mergeTypeDefs(files as TypeSource[]);
};
