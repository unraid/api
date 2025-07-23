import { gql } from '@app/unraid-api/cli/generated/index.js';

export const ADD_PLUGIN_MUTATION = gql(`
    mutation AddPlugin($input: PluginManagementInput!) {
        addPlugin(input: $input)
    }
`);
