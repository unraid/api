import { remoteAccessLogger } from '@app/core/log';
import { RemoteAccessEventActionType, type RemoteAccessEventFragmentFragment } from '@app/graphql/generated/client/graphql';
import { RemoteAccessJobManager } from '@app/remoteAccess/jobs';
import { DynamicRemoteAccessType } from '@app/remoteAccess/types';
import { type RootState } from '@app/store/index';
import { setAllowedRemoteAccessUrls } from '@app/store/modules/dynamic-remote-access';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const handleRemoteAccessEvent = createAsyncThunk<void, RemoteAccessEventFragmentFragment, { state: RootState }>('dynamicRemoteAccess/handleRemoteAccessEvent', async (event, { getState, dispatch }) => {
	const state = getState();
	const pluginApiKey = state.config.remote.apikey;
	if (pluginApiKey !== event.data.apiKey) {
		remoteAccessLogger.error('Remote Access Event Not For This Client');
		return;
	}

	const { dynamicRemoteAccessType } = state.config.remote;
	if (!dynamicRemoteAccessType || dynamicRemoteAccessType === DynamicRemoteAccessType.DISABLED) {
		remoteAccessLogger.error('Received Remote Access Event, but Dynamic Remote Access is not enabled.');
		return;
	}

	switch (event.data.type) {
		case RemoteAccessEventActionType.INIT:
			remoteAccessLogger.debug('RECEIVED INIT EVENT FOR REMOTE ACCESS');
			// Init - Begin listening, transmit an ACK event back from the client.
			if (event.data.url) {
				// @todo use this URL to set the only allowed access url
				dispatch(setAllowedRemoteAccessUrls(event.data.url));
			}

			await RemoteAccessJobManager.getInstance().beginRemoteAccess({ getState, dispatch });
			// @TODO Move this logic into the remote access manager class

			break;
		case RemoteAccessEventActionType.ACK:
			// Ack - these events come from the API (this client), so we don't need to respond
			break;
		case RemoteAccessEventActionType.PING:
			// Ping - would continue remote access if necessary;
			RemoteAccessJobManager.getInstance().extendRemoteAccess({ getState, dispatch });
			break;
		case RemoteAccessEventActionType.END:
			// End
			await RemoteAccessJobManager.getInstance().stopRemoteAccess({ getState, dispatch });
			break;
		default:
			break;
	}
});
