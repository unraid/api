import { logger } from '@app/core/log';
import { pubsub } from '@app/core/pubsub';
import { Slot } from '@app/core/types/states/slots';
import { addTogether } from '@app/core/utils/misc/add-together';
import { store } from '@app/store';
import { FileLoadStatus, StoreSubscriptionHandler } from '@app/store/types';
import isEqual from 'lodash/isEqual';

type ArrayEvent = {
	array: {
		state: string;
		capacity: {
			bytes: {
				free: string;
				used: string;
				total: string;
			};
			disks: {
				free: string;
				used: string;
				total: string;
			};
		};
		boot: Slot | null;
		parities: Slot[];
		disks: Slot[];
		caches: Slot[];
	};
};

const createArrayEvent = (state: Parameters<StoreSubscriptionHandler>[0]): ArrayEvent | null => {
	// Var state isn't loaded
	if (state === null || Object.keys(state.emhttp.var).length === 0) return null;

	const { emhttp } = state;

	// Array state
	const mdState = emhttp.var.mdState.toLowerCase();
	const arrayState = mdState.startsWith('error') ? mdState.split(':')[1] : mdState;

	// All known disks
	const allDisks = emhttp.disks.filter(disk => disk.device);

	// Array boot/parities/disks/caches
	const boot = allDisks.find(disk => disk.name === 'flash') ?? null;
	const parities = allDisks.filter(disk => disk.name.startsWith('parity'));
	const disks = allDisks.filter(disk => disk.name.startsWith('disk'));
	const caches = allDisks.filter(disk => disk.name.startsWith('cache'));

	// Disk sizes
	const disksTotalBytes = addTogether(disks.map(_ => _.fsSize * 1_024));
	const disksFreeBytes = addTogether(disks.map(_ => _.fsFree * 1_024));

	// Max disks
	const maxDisks = emhttp.var.maxArraysz ?? disks.length;

	// Array capacity
	const capacity = {
		bytes: {
			free: `${disksFreeBytes}`,
			used: `${disksTotalBytes - disksFreeBytes}`,
			total: `${disksTotalBytes}`,
		},
		disks: {
			free: `${maxDisks - disks.length}`,
			used: `${disks.length}`,
			total: `${maxDisks}`,
		},
	};

	const event = {
		array: {
			state: arrayState,
			capacity,
			boot,
			parities,
			disks,
			caches,
		},
	};

	logger.addContext('event', event);
	logger.trace('New event created');
	logger.removeContext('event');

	return event;
};

export const syncArray: StoreSubscriptionHandler = async lastState => {
	try {
		// Skip until we have emhttp states loaded
		const { emhttp } = store.getState();
		if (emhttp.status !== FileLoadStatus.LOADED) return;

		const lastEvent = createArrayEvent(lastState);
		const currentEvent = createArrayEvent(store.getState());

		// Skip if either event resolved to null
		if (lastEvent === null || currentEvent === null) return;

		// Skip this if it's the same as the last one
		if (isEqual(lastEvent, currentEvent)) return;

		logger.debug('Array was updated, publishing event');

		// Publish to graphql
		await pubsub.publish('array', currentEvent);
	} catch (error: unknown) {
		if (!(error instanceof Error)) throw new Error(`Failed publishing array event with unknown error "${String(error)}"`);
		logger.error('Failed publishing array event with "%s"', error.message);
	}
};
