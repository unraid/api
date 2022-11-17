
import { logger, nchanLogger } from '@app/core';
import { createNchanSubscription } from '@app/core/utils/clients/nchan';

import { watch, FSWatcher } from 'chokidar';
import type NchanSubscriber from 'nchan';
import { getters, store } from '@app/store';
import { setConnectionStatus } from '@app/store/modules/config';
import { StateFileKey } from '@app/store/types';
import { parse, join } from 'path';
import { loadSingleStateFile } from '@app/store/modules/emhttp';

// Configure any excluded nchan channels that we support here
const excludedWatches: StateFileKey[] = [StateFileKey.devs];

export class StateManager {
	public static instance: StateManager | null = null;
	private readonly subs: NchanSubscriber[] = [];
	private readonly fileWatchers: FSWatcher[] = [];
	private fallbackIsRunning = false;

	private constructor() {
		for (const key of Object.values(StateFileKey)) {
			if (!excludedWatches.includes(key)) {
				this.subs.push(
					createNchanSubscription(key),
				);
			}
		}
	}

	public static getInstance(): StateManager {
		if (!StateManager.instance) {
			StateManager.instance = new StateManager();
		}

		return StateManager.instance;
	}

	private getStateFileKeyFromPath(path: string): StateFileKey | undefined {
		const parsed = parse(path);
		return StateFileKey[parsed.name];
	}

	private readonly setupChokidarWatchForState = () => {
		const { states } = getters.paths();
		for (const key of Object.values(StateFileKey)) {
			if (!excludedWatches.includes(key)) {
				const pathToWatch = join(states, `${key}.ini`);
				logger.debug('Setting up watch for path: %s', pathToWatch);
				const stateWatch = watch(pathToWatch);
				stateWatch.on('change', async path => {
					const stateFile = this.getStateFileKeyFromPath(path);
					if (stateFile) {
						try {
							nchanLogger.debug('Loading state file for %s', stateFile);
							await store.dispatch(loadSingleStateFile(stateFile));
						} catch (error: unknown) {
							nchanLogger.error('Failed to load state file: [%s]\nerror:  %o', stateFile, error);
						}
					} else {
						nchanLogger.trace('Failed to resolve a stateFileKey from path: %s', path);
					}
				});
				this.fileWatchers.push(stateWatch);
			}
		}
	};

	private readonly closeNchanSubscriptions = () => {
		nchanLogger.debug('Disabling nchan subscriptions');
		this.subs.forEach(sub => {
			sub?.stop();
		});
	};

	public fallbackToFileWatch = () => {
		if (!this.fallbackIsRunning) {
			this.fallbackIsRunning = true;
			this.closeNchanSubscriptions();
			store.dispatch(setConnectionStatus({ nchan: 'disabled' }));
			this.setupChokidarWatchForState();
		}
	};
}

