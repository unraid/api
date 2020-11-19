import stw from 'spread-the-word';
import { log, discoveryLogger } from '../log';

/**
 * Listen to devices on the local network via mDNS.
 */
export const listen = (): void => {
	stw
		.on('up', service => {
			if (service.type === 'unraid') {
				if (service.txt?.is_setup === 'false') {
					const ipv4 = service.addresses.find(address => address.includes('.'));
					const ipv6 = service.addresses.find(address => address.includes(':'));
					discoveryLogger.info(`Found a new local server [${ipv4 ?? ipv6}], visit your my servers dashboard to claim.`);
				}
			}
			// Console.log(`${service.name} is up! (from ${referrer.address}`);
		})
		.on('down', (remoteService, _res, referrer) => {
			discoveryLogger.debug(`${remoteService.name} is down! (from ${referrer.address})`);
		});

	stw.listen();
};
