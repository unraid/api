import { TEN_MINUTES_MS } from '@app/consts';
import { remoteAccessLogger } from '@app/core/log';
import { NginxManager } from '@app/core/modules/services/nginx';
import { UnraidLocalNotifier } from '@app/core/notifiers/unraid-local';
import { RemoteAccessEventActionType, type RemoteAccessInput } from '@app/graphql/generated/client/graphql';
import { SEND_DYNAMIC_REMOTE_ACCESS_MUTATION } from '@app/graphql/mothership/mutations';
import { GraphQLClient } from '@app/mothership/graphql-client';
import { type IRemoteAccessController } from '@app/remoteAccess/handlers/remote-access-interface';
import { StaticRemoteAccess } from '@app/remoteAccess/handlers/static-remote-access';
import { UpnpRemoteAccess } from '@app/remoteAccess/handlers/upnp-remote-access';
import { DynamicRemoteAccessType } from '@app/remoteAccess/types';
import { type AppDispatch, type RootState } from '@app/store/index';
import { setDynamicRemoteAccessError, setRemoteAccessRunningType } from '@app/store/modules/dynamic-remote-access';
export class RemoteAccessController implements IRemoteAccessController {
	static _instance: RemoteAccessController | null = null;
	activeRemoteAccess: UpnpRemoteAccess | StaticRemoteAccess | null = null;
	notifier: UnraidLocalNotifier = new UnraidLocalNotifier({ level: 'info' });
	timeout: NodeJS.Timeout | null = null;

	// eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
	constructor() {}

	public static get instance(): RemoteAccessController {
		if (!RemoteAccessController._instance) {
			RemoteAccessController._instance = new RemoteAccessController();
		}

		return RemoteAccessController._instance;
	}

	async sendRemoteAccessEvent({ apiKey, type, url }: RemoteAccessInput): Promise<boolean> {
		const client = GraphQLClient.getInstance();
		if (!client) {
			throw new Error('NO GRAPHQL CLIENT AVAILABLE, CANNOT ENABLE REMOTE ACCESS');
		}

		const result = await client.mutate({ mutation: SEND_DYNAMIC_REMOTE_ACCESS_MUTATION, variables: {
			remoteAccess: {
				type,
				apiKey,
				url,
			} },
		});
		if (result?.data?.remoteSession !== true) {
			remoteAccessLogger.warn('Received failure in remote access enable session event');
			return false;
		}

		remoteAccessLogger.debug('Successfully sent event for remote access');

		return true;
	}

	async beginRemoteAccess({ getState, dispatch }: { getState: () => RootState; dispatch: AppDispatch }) {
		// Stop Close Event
		const state = getState();
		const { config: { remote: { dynamicRemoteAccessType, apikey } },
			dynamicRemoteAccess: { runningType } } = state;

		if (!dynamicRemoteAccessType) {
			// Should never get here
			return null;
		}

		remoteAccessLogger.debug('Beginning remote access', runningType, dynamicRemoteAccessType);
		if (runningType !== dynamicRemoteAccessType) {
			await this.activeRemoteAccess?.stopRemoteAccess({ getState, dispatch });
		}

		switch (dynamicRemoteAccessType) {
			case DynamicRemoteAccessType.DISABLED:
				this.activeRemoteAccess = null;
				remoteAccessLogger.debug('Recieved begin event, but DRA is disabled.');
				break;
			case DynamicRemoteAccessType.UPNP:
				remoteAccessLogger.debug('UPNP DRA Begin');
				this.activeRemoteAccess = new UpnpRemoteAccess();
				break;
			case DynamicRemoteAccessType.STATIC:
				remoteAccessLogger.debug('Static DRA Begin');
				this.activeRemoteAccess = new StaticRemoteAccess();
				break;
			default:
				break;
		}

		// Essentially a super call to the active type
		try {
			const result = await this.activeRemoteAccess?.beginRemoteAccess({ getState, dispatch });
			await this.sendRemoteAccessEvent({ apiKey: apikey, type: RemoteAccessEventActionType.ACK, url: result });
			dispatch(setRemoteAccessRunningType(dynamicRemoteAccessType));
			this.extendRemoteAccess({ getState, dispatch });
			await this.notifier.send({ title: 'Remote Access Started', data: { message: 'Remote access has been started' } });
		} catch (error: unknown) {
			dispatch(setDynamicRemoteAccessError(error instanceof Error ? error.message : 'Unknown Error'));
		}

		return null;
	}

	public extendRemoteAccess({ getState, dispatch }: { getState: () => RootState; dispatch: AppDispatch }) {
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = null;
		}

		this.timeout = setTimeout(async () => {
			await this.stopRemoteAccess({ getState, dispatch });
		}, TEN_MINUTES_MS);
	}

	async stopRemoteAccess({ getState, dispatch }: { getState: () => RootState; dispatch: AppDispatch }) {
		remoteAccessLogger.debug('Stopping remote access');
		const { config: { remote: { apikey } } } = getState();
		await this.activeRemoteAccess?.stopRemoteAccess({ getState, dispatch });

		dispatch(setRemoteAccessRunningType(DynamicRemoteAccessType.DISABLED));
		await this.notifier.send({ title: 'Remote Access Stopped', data: { message: 'Remote access has been stopped' } });

		if (apikey) {
			remoteAccessLogger.debug('Sending end event');

			await this.sendRemoteAccessEvent({
				apiKey: apikey,
				type: RemoteAccessEventActionType.END,
			});
		}
	}
}
