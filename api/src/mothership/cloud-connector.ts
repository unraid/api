import { cloudConnectorLogger, logger } from '@app/core/log';
import { subscribeToMothership } from '@app/mothership/subscribe-to-mothership';

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
		cloudConnectorLogger.trace('Checking cloud connection');
		await subscribeToMothership();

		this.isRunning = false;
	}
}

export const cloudConnector = new CloudConnector();
