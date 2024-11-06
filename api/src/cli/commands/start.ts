import { PM2_PATH } from '@app/consts';
import { cliLogger } from '@app/core/log';
import { execSync } from 'child_process';
import { join } from 'node:path';
/**
 * Start a new API process.
 */
export const start = async () => {
    cliLogger.info('Starting unraid-api with command', `${PM2_PATH} start ${join(import.meta.dirname, 'ecosystem.config.json')} --update-env`);

    execSync(`${PM2_PATH} start ${join(import.meta.dirname, '../../', 'ecosystem.config.json')} --update-env`, {
        env: process.env,
        stdio: 'inherit',
    });
};
