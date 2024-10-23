import { execSync } from 'child_process';

export const status = async () => {
	execSync('pm2 status unraid-api', { stdio: 'inherit' });
};
