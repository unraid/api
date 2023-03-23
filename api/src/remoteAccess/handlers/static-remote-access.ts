import { remoteAccessLogger } from '@app/core/log';
import { type AccessUrlInput, URL_TYPE, type AccessUrl } from '@app/graphql/generated/client/graphql';
import { getServerIps } from '@app/graphql/resolvers/subscription/network';
import { type GenericRemoteAccess } from '@app/remoteAccess/handlers/remote-access-interface';
import { DynamicRemoteAccessType } from '@app/remoteAccess/types';
import { setWanAccessAndReloadNginx } from '@app/store/actions/set-wan-access-with-reload';
import { type AppDispatch, type RootState } from '@app/store/index';

export class StaticRemoteAccess implements GenericRemoteAccess {
	private getRemoteAccessUrl(state: RootState) {
		const accessUrl: AccessUrlInput = {
			ipv4: null,
			ipv6: null,
			type: URL_TYPE.WAN,
		};

		const urlsForServer = getServerIps(state);
		const url = urlsForServer.urls.find(url => url.type === URL_TYPE.WAN);

		return url ?? accessUrl;
	}

	async beginRemoteAccess({ getState, dispatch }: { getState: () => RootState; dispatch: AppDispatch }): Promise<AccessUrl | null> {
		const { config: { remote: { dynamicRemoteAccessType } } } = getState();
		if (dynamicRemoteAccessType === DynamicRemoteAccessType.STATIC) {
			remoteAccessLogger.debug('Enabling remote access for Static Client');
			await dispatch(setWanAccessAndReloadNginx('yes'));
			return this.getRemoteAccessUrl(getState());
		}

		throw new Error('Invalid Parameters Passed to Static Remote Access Enabler');
	}

	async stopRemoteAccess({ dispatch }: { getState: () => RootState; dispatch: AppDispatch }): Promise<void> {
		await dispatch(setWanAccessAndReloadNginx('no'));
	}
}
