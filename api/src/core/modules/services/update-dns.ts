import { logger } from '@app/core/log';
import { execa } from 'execa';

export class UpdateDNSManager {
	public updateDNS = async () => {
		try {
			await execa('/usr/bin/php', ['/usr/local/emhttp/plugins/dynamix/include/UpdateDNS.php']);
			return true;
		} catch (err: unknown) {
			logger.warn('Failed to call Update DNS with error: ', err);
			return false;
		}
	};
}
