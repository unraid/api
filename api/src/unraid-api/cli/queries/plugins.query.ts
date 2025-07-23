import { gql } from '@app/unraid-api/cli/generated/index.js';

export const PLUGINS_QUERY = gql(`
    query GetPlugins {
        plugins {
            name
            version
            hasApiModule
            hasCliModule
        }
    }
`);
