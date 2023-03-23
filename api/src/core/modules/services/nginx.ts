import { logger } from '@app/core/log';
import { execa } from 'execa';

export class NginxManager {
	public reloadNginx = async () => {
		try {
			await execa('/etc/rc.d/rc.nginx reload');
			return true;
		} catch (err: unknown) {
			logger.warn('Failed to restart Nginx with error', err);
			return false;
		}
	};
}
