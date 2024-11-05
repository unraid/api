import { PM2_PATH } from '@app/consts';
import { execSync } from 'child_process';

export const status = async () => {
	execSync(`${PM2_PATH} status unraid-api`, { stdio: 'inherit' });
	process.exit(0);
};
