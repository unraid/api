import { PM2_PATH } from '@app/consts';
import { cliLogger } from '@app/core/log';
import { API_VERSION } from '@app/environment';
import { execSync } from 'child_process';
/**
 * Start a new API process.
 */
export const start = async () => {
    cliLogger.info('Starting unraid-api@v%s', API_VERSION);

    execSync(`${PM2_PATH} start ecosystem.config.json --update-env`, { env: process.env, stdio: 'inherit' });
    // Start API
};
