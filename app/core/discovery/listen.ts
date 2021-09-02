import stw from 'spread-the-word';
import { discoveryLogger as log } from '../log';

/**
 * Listen to devices on the local network via mDNS.
 */
export const listen = async () => {
	stw
		.on('up', service => {
			if (service.type === 'unraid' && service.txt?.is_setup === 'false') {
				const ipv4 = service.addresses.find(address => address.includes('.'));
				const ipv6 = service.addresses.find(address => address.includes(':'));
				const ipAddress = ipv4 ?? ipv6;
				// No ip?
				if (!ipAddress) {
					return;
				}

				log.info(`Found a new local server [${ipAddress}], visit your my servers dashboard to claim.`);
			}
		})
		.on('down', (remoteService, _response, referrer) => {
			log.debug(`${remoteService.name} is down! (from ${referrer.address})`);
		});

	await stw.listen();
};
