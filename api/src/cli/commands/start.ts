import { cliLogger } from '@app/core/log';
import { API_VERSION } from '@app/environment';
import { execSync } from 'child_process';
/**
 * Start a new API process.
 */
export const start = async () => {
    cliLogger.info('Starting unraid-api@v%s', API_VERSION);

    execSync('pm2 start ecosystem.config.json --update-env', { env: process.env });
    // Start API
};
