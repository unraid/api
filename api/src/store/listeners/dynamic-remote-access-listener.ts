import { startAppListening } from '@app/store/listeners/listener-middleware';
import { type RootState } from '@app/store';
import { remoteAccessLogger } from '@app/core/log';
import { loadConfigFile } from '@app/store/modules/config';
import { FileLoadStatus } from '@app/store/types';
import { isAnyOf } from '@reduxjs/toolkit';
import { DynamicRemoteAccessType } from '@app/remoteAccess/types';
import { RemoteAccessJobManager } from '@app/remoteAccess/jobs';

const shouldDyanamicRemoteAccessBeEnabled = (state: RootState | null): boolean => {
	if (state?.config.status !== FileLoadStatus.LOADED || state?.emhttp.status !== FileLoadStatus.LOADED) {
		return false;
	}

	if (state.config.remote.dynamicRemoteAccessType && state.config.remote.dynamicRemoteAccessType !== DynamicRemoteAccessType.DISABLED) {
		return true;
	}

	return false;
};

const isStateOrConfigUpdate = isAnyOf(loadConfigFile.fulfilled);

export const enableDynamicRemoteAccessListener = () => startAppListening({
	predicate(action, currentState, previousState) {
		// @TODO: One of our actions is incorrectly configured. Sometimes the action is an anonymous function. We need to fix this.
		if ((isStateOrConfigUpdate(action) || !action?.type)
		&& (shouldDyanamicRemoteAccessBeEnabled(currentState) !== shouldDyanamicRemoteAccessBeEnabled(previousState))) {
			return true;
		}

		return false;
	}, async effect(_, { getState, dispatch }) {
		const state = getState();
		const remoteAccessType = state.config.remote?.dynamicRemoteAccessType;
		if (!remoteAccessType) {
			return;
		}

		if (remoteAccessType === DynamicRemoteAccessType.DISABLED) {
			remoteAccessLogger.info('[Listener] Disabling Dynamic Remote Access Feature');
			await RemoteAccessJobManager.getInstance().stopRemoteAccess({ getState, dispatch });
			// @TODO disable running DRA here
		} else {
			remoteAccessLogger.info('[Listener] Enabling Remote Access Feature');
			// @TODO don't need to do anything here
		}
	},
});

