import { subscribeToNchan } from '@app/core/utils/clients/nchan';

export const setupNchanWatch = async () => {
	await subscribeToNchan('devs');
	await subscribeToNchan('disks');
	await subscribeToNchan('network');
	await subscribeToNchan('sec');
	await subscribeToNchan('sec_nfs');
	await subscribeToNchan('shares');
	await subscribeToNchan('users');
	await subscribeToNchan('var');
};
