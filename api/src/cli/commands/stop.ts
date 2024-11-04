import { PM2_PATH } from '@app/consts';
import { execSync } from 'child_process';

export const stop = async () => {
    execSync(`${PM2_PATH} stop unraid-api`, { stdio: 'inherit' });
};
