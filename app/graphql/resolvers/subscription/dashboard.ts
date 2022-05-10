import { dashboardLogger } from '../../../core/log';
import { config } from '../../../core/config';
import { generateData } from '../../../common/dashboard/generate-data';
import { pubsub } from '../../../core/pubsub';

let dashboardProducer: NodeJS.Timer | undefined;
const publishToDashboard = async () => {
	try {
		const dashboard = await generateData();
		await pubsub.publish('dashboard', {
			dashboard
		});
	} catch (error: unknown) {
		dashboardLogger.error('Failed publishing');
		if (config.debug) dashboardLogger.error(error);
	}
};

let connectedToDashboard = 0;

export const stopDashboardProducer = () => {
	connectedToDashboard--;

	// Don't stop if we still have clients using this
	if (connectedToDashboard >= 1) return;

	// Stop dashboard producer
	if (dashboardProducer) {
		dashboardLogger.debug('Stopping dashboard producer');
		clearInterval(dashboardProducer);
		dashboardProducer = undefined;
	}
};

export const startDashboardProducer = () => {
	connectedToDashboard++;

	// Don't start twice
	if (dashboardProducer) return;

	// Start new producer
	dashboardLogger.debug('Starting dashboard producer');
	dashboardProducer = setInterval(async () => {
		dashboardLogger.debug('Publishing');
		await publishToDashboard();
	}, 5_000);
};
