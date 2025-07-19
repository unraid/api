import { gql } from '@app/unraid-api/cli/generated/index.js';

export const SSO_USERS_QUERY = gql(`
    query GetSSOUsers {
        settings {
            api {
                ssoSubIds
            }
        }
    }
`);
