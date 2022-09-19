import { cloudConnectorLogger, logger } from '@app/core/log';
import { checkRelayConnection } from '@app/mothership/check-relay-connected';
import { subscribeToMinigraphServers } from '@app/mothership/subscribe-to-servers';

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
			return;
		}

		this.isRunning = true;
		cloudConnectorLogger.trace('Checking cloud connections');
		const relayConnected = await checkRelayConnection();
		cloudConnectorLogger.trace('Relay is connected?', relayConnected);
		if (relayConnected) {
			await subscribeToMinigraphServers();
		} else {
			cloudConnectorLogger.trace('Skipping connection to minigraph since relay is disconnected')
		}

		this.isRunning = false;
	}
}

export const cloudConnector = new CloudConnector();
