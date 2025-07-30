import type { JWTPayload } from 'jose';
import { createLocalJWKSet, createRemoteJWKSet, jwtVerify } from 'jose';
import { CommandRunner, SubCommand } from 'nest-commander';

import { JWKS_LOCAL_PAYLOAD, JWKS_REMOTE_LINK } from '@app/consts.js';
import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { SSO_USERS_QUERY } from '@app/unraid-api/cli/queries/sso-users.query.js';

@SubCommand({
    name: 'validate-token',
    aliases: ['validate', 'v'],
    description: 'Returns JSON: { error: string | null, valid: boolean }',
    arguments: '<token>',
})
export class ValidateTokenCommand extends CommandRunner {
    JWKSOffline: ReturnType<typeof createLocalJWKSet>;
    JWKSOnline: ReturnType<typeof createRemoteJWKSet>;
    constructor(
        private readonly logger: LogService,
        private readonly internalClient: CliInternalClientService
    ) {
        super();
        this.JWKSOffline = createLocalJWKSet(JWKS_LOCAL_PAYLOAD);
        this.JWKSOnline = createRemoteJWKSet(new URL(JWKS_REMOTE_LINK));
    }

    private logAndExit = (data: { error: string | null; valid: boolean; username?: string }) => {
        const isError = data.error !== null;

        // Restore the appropriate console method
        if (isError) {
            console.error = console.constructor.prototype.error;
        } else {
            console.log = console.constructor.prototype.log;
        }

        // Log the JSON response
        const json = JSON.stringify(data);
        if (isError) {
            this.logger.error(json);
            process.exit(1);
        } else {
            this.logger.info(json);
            process.exit(0);
        }
    };

    async run(passedParams: string[]): Promise<void> {
        if (passedParams.length !== 1) {
            this.logAndExit({ error: 'Please pass token argument only', valid: false });
        }

        const token = passedParams[0];

        if (typeof token !== 'string' || token.trim() === '') {
            this.logAndExit({ error: 'Invalid token provided', valid: false });
        }

        if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(token)) {
            this.logAndExit({ error: 'Token format is invalid', valid: false });
        }

        let caughtError: null | unknown = null;
        let tokenPayload: null | JWTPayload = null;
        try {
            // this.logger.debug('Attempting to validate token with local key');
            tokenPayload = (await jwtVerify(token, this.JWKSOffline)).payload;
        } catch (error: unknown) {
            try {
                // this.logger.debug('Local validation failed for key, trying remote validation');
                tokenPayload = (await jwtVerify(token, this.JWKSOnline)).payload;
            } catch (error: unknown) {
                caughtError = error;
            }
        }

        if (caughtError) {
            if (caughtError instanceof Error) {
                this.logAndExit({
                    error: `Caught error validating jwt token: ${caughtError.message}`,
                    valid: false,
                });
            } else {
                this.logAndExit({ error: 'Caught unknown error validating jwt token', valid: false });
            }
        }

        if (tokenPayload === null) {
            this.logAndExit({ error: 'No data in JWT to use for user validation', valid: false });
        }

        const username = tokenPayload?.sub;

        if (!username) {
            return this.logAndExit({ error: 'No ID found in token', valid: false });
        }
        const client = await this.internalClient.getClient();

        let result;
        try {
            result = await client.query({
                query: SSO_USERS_QUERY,
            });
        } catch (error) {
            this.logAndExit({ error: 'Failed to query SSO users', valid: false });
        }

        if (result!.errors && result!.errors.length > 0) {
            this.logAndExit({ error: 'Failed to retrieve SSO configuration', valid: false });
        }

        const ssoUsers = result!.data?.settings?.api?.ssoSubIds || [];

        if (ssoUsers.length === 0) {
            this.logAndExit({
                error: 'No local user token set to compare to - please set any valid SSO IDs you would like to sign in with',
                valid: false,
            });
        }
        if (ssoUsers.includes(username)) {
            this.logAndExit({ error: null, valid: true, username });
        } else {
            this.logAndExit({ error: 'Username on token does not match', valid: false });
        }
    }
}
