import { logger } from '@app/core/log';
import { execa } from 'execa';

export class NginxManager {
	public restartNginx = async () => {
		try {
			await execa('/etc/rc.d/rc.nginx reload');
			return true;
		} catch (err: unknown) {
			logger.warn('Failed to restart Nginx');
			return false;
		}
	};
}
