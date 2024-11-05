import { PM2_PATH } from '@app/consts';
import { execSync } from 'child_process';

export const stop = async (exit = false) => {
    execSync(`${PM2_PATH} stop unraid-api`, { stdio: 'inherit' });
    if (exit) {
        process.exit(0);
    }
};
