import { remoteAccessLogger } from '@app/core/log';
import { type AccessUrl } from '@app/graphql/generated/client/graphql';
import { type GenericRemoteAccess } from '@app/remoteAccess/handlers/remote-access-interface';
import { DynamicRemoteAccessType } from '@app/remoteAccess/types';
import { type AppDispatch, type RootState } from '@app/store/index';
import { setWanAccess } from '@app/store/modules/config';

export class StaticRemoteAccess implements GenericRemoteAccess {
	async beginRemoteAccess({ getState, dispatch }: { getState: () => RootState; dispatch: AppDispatch }): Promise<AccessUrl | null> {
		const state = getState();
		const { dynamicRemoteAccessType } = state.config.remote;
		if (dynamicRemoteAccessType === DynamicRemoteAccessType.STATIC) {
			remoteAccessLogger.debug('Enabling remote access for Static Client');
			dispatch(setWanAccess('yes'));
			return null;
		}

		throw new Error('Invalid Parameters Passed to Static Remote Access Enabler');
	}

	async stopRemoteAccess({ dispatch }: { getState: () => RootState; dispatch: AppDispatch }): Promise<void> {
		dispatch(setWanAccess('no'));
	}
}
