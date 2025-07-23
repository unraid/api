import { gql } from '@app/unraid-api/cli/generated/index.js';

export const UPDATE_SSO_USERS_MUTATION = gql(`
    mutation UpdateSSOUsers($input: JSON!) {
        updateSettings(input: $input) {
            restartRequired
            values
        }
    }
`);
