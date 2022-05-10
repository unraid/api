import { dashboardLogger } from '../../../core/log';
import { config } from '../../../core/config';
import { generateData } from '../../../common/dashboard/generate-data';
import { pubsub } from '../../../core/pubsub';

type Dashboard = Awaited<ReturnType<typeof generateData>>;

let lastDataPacketTimestamp: number | undefined;
let lastDataPacket: Dashboard;
let lastDataPacketString: string;
const hasDataChanged = (dataPacket: Dashboard) => {
	// UPDATE - No data packet has been sent since boot
	if (!lastDataPacketTimestamp) return true;

	// UPDATE - It's been 5s before last update
	if (Date.now() - 5_000 >= lastDataPacketTimestamp) return true;

	// NO_UPDATE - This is an exact copy of the last data packet
	if (lastDataPacketString === JSON.stringify(dataPacket)) return false;

	// UPDATE - Apps have been installed/started
	if (dataPacket.apps.installed !== lastDataPacket.apps.installed) return true;
	if (dataPacket.apps.started !== lastDataPacket.apps.started) return true;

	// UPDATE - Array state changed
	if (dataPacket.array.state !== lastDataPacket.array.state) return true;

	// Nothing has changed enough for an update to be sent
	return false;
};

let dashboardProducer: NodeJS.Timer | undefined;
const publishToDashboard = async () => {
	try {
		const dashboard = await generateData();

		// Only update data on change
		if (!hasDataChanged(dashboard)) return;

		// Save last data packet
		lastDataPacketTimestamp = Date.now();
		lastDataPacketString = JSON.stringify(dashboard);
		lastDataPacket = dashboard;

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
		dashboardLogger.debug('Publishing data to /dashboard');
		await publishToDashboard();
	}, 1_000);
};
