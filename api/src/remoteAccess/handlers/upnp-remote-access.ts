import { remoteAccessLogger } from '@app/core/log';
import { type AccessUrlInput, URL_TYPE, type AccessUrl } from '@app/graphql/generated/client/graphql';
import { getUrlForField } from '@app/graphql/resolvers/subscription/network';
import { type GenericRemoteAccess } from '@app/remoteAccess/handlers/remote-access-interface';
import { DynamicRemoteAccessType } from '@app/remoteAccess/types';
import { type AppDispatch, type RootState } from '@app/store/index';
import { setWanAccess } from '@app/store/modules/config';
import { disableUpnp, enableUpnp, type UpnpEnableReturnValue } from '@app/store/modules/upnp';

export class UpnpRemoteAccess implements GenericRemoteAccess {
	async stopRemoteAccess({ dispatch }: { getState: () => RootState; dispatch: AppDispatch }) {
		// Stop
		await dispatch(disableUpnp());
	}

	private getRemoteAccessUrlFromUpnp(state: RootState, upnpEnableResult: UpnpEnableReturnValue) {
		const accessUrl: AccessUrlInput = {
			ipv4: null,
			ipv6: null,
			type: URL_TYPE.WAN,
		};
		if (!upnpEnableResult.wanPortForUpnp) {
			return accessUrl;
		}

		try {
			accessUrl.ipv4 = getUrlForField({ url: state.emhttp.nginx.wanFqdn, portSsl: upnpEnableResult.wanPortForUpnp });
		} catch (error: unknown) {
			remoteAccessLogger.debug('Unable to create ipv4 access url', error);
		}

		try {
			accessUrl.ipv6 = getUrlForField({ url: state.emhttp.nginx.wanFqdn6, portSsl: upnpEnableResult.wanPortForUpnp });
		} catch (error: unknown) {
			remoteAccessLogger.debug('Unable to create ipv6 access url', error);
		}

		return accessUrl;
	}

	async beginRemoteAccess({ getState, dispatch }: { getState: () => RootState; dispatch: AppDispatch }): Promise<AccessUrl | null> {
		// Stop Close Event
		const state = getState();
		const { dynamicRemoteAccessType } = state.config.remote;
		if (dynamicRemoteAccessType === DynamicRemoteAccessType.UPNP && !state.upnp.renewalJobRunning) {
			const { portssl } = state.emhttp.var;
			try {
				const upnpEnableResult = await dispatch(enableUpnp({ portssl })).unwrap();

				dispatch(setWanAccess('yes'));

				remoteAccessLogger.debug('UPNP Enable Result', upnpEnableResult);

				if (!upnpEnableResult.wanPortForUpnp) {
					throw new Error('Failed to get a WAN Port from UPNP');
				}

				return this.getRemoteAccessUrlFromUpnp(state, upnpEnableResult);
			} catch (error: unknown) {
				remoteAccessLogger.warn('Caught error, disabling UPNP and re-throwing');
				await dispatch(disableUpnp());
				throw new Error(`UPNP Dynamic Remote Access Error: ${error instanceof Error ? error.message : 'Unknown Error'}`);
			}
		}

		throw new Error('Invalid Parameters Passed to UPNP Remote Access Enabler');
	}
}
