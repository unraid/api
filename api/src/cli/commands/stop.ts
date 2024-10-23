import { execSync } from 'child_process';

export const stop = async () => {
    execSync('pm2 stop unraid-api');
};
