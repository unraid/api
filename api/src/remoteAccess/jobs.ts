import { TEN_MINUTES_MS } from '@app/consts';
import { remoteAccessLogger } from '@app/core/log';
import { type AccessUrlInput, RemoteAccessEventActionType, URL_TYPE } from '@app/graphql/generated/client/graphql';
import { SEND_DYNAMIC_REMOTE_ACCESS_ACK_MUTATION } from '@app/graphql/mothership/mutations';
import { getUrlForField } from '@app/graphql/resolvers/subscription/network';
import { GraphQLClient } from '@app/mothership/graphql-client';
import { DynamicRemoteAccessType } from '@app/remoteAccess/types';
import { type RootState } from '@app/store/index';
import { setRemoteAccessRunningType } from '@app/store/modules/dynamic-remote-access';
import { disableUpnp, enableUpnp, type UpnpEnableReturnValue } from '@app/store/modules/upnp';

export class RemoteAccessJobManager {
	static instance: RemoteAccessJobManager | null = null;
	timeout: NodeJS.Timeout | null = null;

	// eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
	constructor() {}

	static getInstance() {
		if (!RemoteAccessJobManager.instance) {
			RemoteAccessJobManager.instance = new RemoteAccessJobManager();
		}

		return RemoteAccessJobManager.instance;
	}

	async stopRemoteAccess({ getState, dispatch }: { getState: () => RootState; dispatch: any }) {
		const state = getState();
		const { runningType } = state.dynamicRemoteAccess;
		remoteAccessLogger.info(`Disabling: ${runningType} Mode`);

		if (runningType === DynamicRemoteAccessType.UPNP) {
			// Stop
			await dispatch(disableUpnp());

			dispatch(setRemoteAccessRunningType(DynamicRemoteAccessType.DISABLED));
		} else if (state.dynamicRemoteAccess.runningType === DynamicRemoteAccessType.STATIC) {
			// Remove static dynamic remote access
		}
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

	async beginRemoteAccess({ getState, dispatch }: { getState: () => RootState; dispatch: any }) {
		// Stop Close Event
		const state = getState();
		const { dynamicRemoteAccessType, apikey } = state.config.remote;
		if (dynamicRemoteAccessType === DynamicRemoteAccessType.UPNP && !state.upnp.renewalJobRunning) {
			const { portssl } = state.emhttp.var;
			try {
				dispatch(setRemoteAccessRunningType(dynamicRemoteAccessType));
				const upnpEnableResult = await dispatch(enableUpnp({ portssl })).unwrap();

				remoteAccessLogger.debug('UPNP Enable Result', upnpEnableResult);
				const client = GraphQLClient.getInstance();
				if (!client) {
					throw new Error('NO GRAPHQL CLIENT AVAILABLE, CANNOT ENABLE REMOTE ACCESS');
				}

				if (!upnpEnableResult.wanPortForUpnp) {
					throw new Error('Failed to get a WAN Port from UPNP');
				}

				const result = await client.mutate({ mutation: SEND_DYNAMIC_REMOTE_ACCESS_ACK_MUTATION, variables: {
					remoteAccess: {
						type: RemoteAccessEventActionType.ACK,
						apiKey: apikey,

						// URL Passing disabled since it isn't necessary if we refresh the whole network payload once remote access begins
						// Url: this.getRemoteAccessUrlFromUpnp(state, upnpEnableResult),
					} },
				});
				remoteAccessLogger.debug('Result of ack event: ', result);
			} catch (error: unknown) {
				remoteAccessLogger.error('Error Enabling UPNP', error);
			}
		}

		this.extendRemoteAccess({ getState, dispatch });
	}

	public extendRemoteAccess({ getState, dispatch }: { getState: () => RootState; dispatch: any }) {
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = null;
		}

		this.timeout = setTimeout(async () => {
			await this.stopRemoteAccess({ getState, dispatch });
		}, TEN_MINUTES_MS);
	}
}
