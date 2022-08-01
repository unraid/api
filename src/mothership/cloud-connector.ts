import { logger, relayLogger } from '@app/core/log';
import { checkRelayConnection } from './check-relay-connected';
import { checkGraphqlConnection } from '@app/mothership/subscribe-to-servers';

class CloudConnector {
	public static instance: CloudConnector;
	private isRunning = false;

	constructor() {
		if (CloudConnector.instance) {
			// eslint-disable-next-line no-constructor-return
			return CloudConnector.instance;
		}

		CloudConnector.instance = this;
	}

	public async checkCloudConnections() {
		if (this.isRunning) {
			logger.trace('Skipping cloud check since one is already running');
		} else {
			this.isRunning = true;
			logger.trace('Checking cloud connections');

			const relayConnected = await checkRelayConnection();
			if (relayConnected) await checkGraphqlConnection();
			this.isRunning = false;
		}
	}
}

export const cloudConnector = new CloudConnector();
