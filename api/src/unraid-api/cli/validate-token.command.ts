import type { JWTPayload } from 'jose';
import { createLocalJWKSet, createRemoteJWKSet, decodeJwt, jwtVerify } from 'jose';
import { Command, CommandRunner } from 'nest-commander';

import { JWKS_LOCAL_PAYLOAD, JWKS_REMOTE_LINK } from '@app/consts';
import { store } from '@app/store';
import { loadConfigFile } from '@app/store/modules/config';
import { LogService } from '@app/unraid-api/cli/log.service';

const createJsonErrorString = (errorMessage: string) =>
    JSON.stringify({
        error: errorMessage,
        valid: false,
    });

@Command({
    name: 'validate-token',
    description: 'Returns JSON: { error: string | null, valid: boolean }',
    arguments: '<token>',
})
export class ValidateTokenCommand extends CommandRunner {
    JWKSOffline: ReturnType<typeof createLocalJWKSet>;
    JWKSOnline: ReturnType<typeof createRemoteJWKSet>;
    constructor(private readonly logger: LogService) {
        super();
        this.JWKSOffline = createLocalJWKSet(JWKS_LOCAL_PAYLOAD);
        this.JWKSOnline = createRemoteJWKSet(new URL(JWKS_REMOTE_LINK));
    }
    async run(passedParams: string[]): Promise<void> {
        if (passedParams.length !== 1) {
            this.logger.error('Please pass token argument only');
        }

        const token = passedParams[0];

        let caughtError: null | unknown = null;
        let tokenPayload: null | JWTPayload = null;
        try {
            this.logger.debug('Attempting to validate token with local key');
            tokenPayload = (await jwtVerify(token, this.JWKSOffline)).payload;
        } catch (error: unknown) {
            try {
                this.logger.debug('Local validation failed for key, trying remote validation');
                tokenPayload = (await jwtVerify(token, this.JWKSOnline)).payload;
            } catch (error: unknown) {
                caughtError = error;
            }
        }

        if (caughtError) {
            if (caughtError instanceof Error) {
                this.logger.error(
                    createJsonErrorString(`Caught error validating jwt token: ${caughtError.message}`)
                );
            } else {
                this.logger.error(createJsonErrorString('Caught error validating jwt token'));
            }
        }

        if (tokenPayload === null) {
            this.logger.error(createJsonErrorString('No data in JWT to use for user validation'));
        }

        const username = tokenPayload!.username ?? tokenPayload!['cognito:username'];
        const configFile = await store.dispatch(loadConfigFile()).unwrap();
        if (!configFile.remote?.accesstoken) {
            this.logger.error(createJsonErrorString('No local user token set to compare to'));
        }

        const existingUserPayload = decodeJwt(configFile.remote?.accesstoken);
        if (username === existingUserPayload.username) {
            this.logger.info(JSON.stringify({ error: null, valid: true }));
        } else {
            this.logger.error(
                createJsonErrorString('Username on token does not match logged in user name')
            );
        }
    }
}
