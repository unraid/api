import { gql } from '@app/unraid-api/cli/generated/index.js';

export const UPDATE_SANDBOX_MUTATION = gql(`
    mutation UpdateSandboxSettings($input: JSON!) {
        updateSettings(input: $input) {
            restartRequired
            values
        }
    }
`);
