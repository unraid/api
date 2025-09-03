import { gql } from '@app/unraid-api/cli/generated/index.js';

export const VALIDATE_OIDC_SESSION_QUERY = gql(`
    query ValidateOidcSession($token: String!) {
        validateOidcSession(token: $token) {
            valid
            username
        }
    }
`);
