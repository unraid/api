import { gql } from '@app/unraid-api/cli/generated/index.js';

export const REMOVE_PLUGIN_MUTATION = gql(`
    mutation RemovePlugin($input: PluginManagementInput!) {
        removePlugin(input: $input)
    }
`);
