import { dashboardLogger } from '../../../core/log';
import { config } from '../../../core/config';
import { generateData } from '../../../common/dashboard/generate-data';
import { pubsub } from '../../../core/pubsub';

type Dashboard = Awaited<ReturnType<typeof generateData>>;

const isNumberBetween = (min: number, max: number) => (num: number) => num > min && num < max;

const ONE_MB = 1_024 * 1_024;

let lastDataPacketTimestamp: number | undefined;
let lastDataPacket: Dashboard;
let lastDataPacketString: string;
const canSendDataPacket = (dataPacket: Dashboard) => {
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

	// UPDATE - Array total has changed
	if (dataPacket.array.capacity.bytes.total !== lastDataPacket.array.capacity.bytes.total) return true;

	// UPDATE - Array used has changed by more than 1MB in either direction
	if (!isNumberBetween(lastDataPacket.array.capacity.bytes.used - ONE_MB, lastDataPacket.array.capacity.bytes.used + ONE_MB)(dataPacket.array.capacity.bytes.used)) return true;

	// UPDATE - Vms have been added/started
	if (dataPacket.vms.installed !== lastDataPacket.vms.installed) return true;
	if (dataPacket.vms.started !== lastDataPacket.vms.started) return true;

	// UPDATE - Twofactor config has changed
	if (dataPacket.twoFactor.local.enabled !== lastDataPacket.twoFactor.local.enabled) return true;
	if (dataPacket.twoFactor.remote.enabled !== lastDataPacket.twoFactor.remote.enabled) return true;

	// UPDATE - Vars changed
	if (dataPacket.vars.flashGuid !== lastDataPacket.vars.flashGuid) return true;
	if (dataPacket.vars.regState !== lastDataPacket.vars.regState) return true;
	if (dataPacket.vars.regTy !== lastDataPacket.vars.regTy) return true;

	// Nothing has changed enough for an update to be sent
	return false;
};

let dashboardProducer: NodeJS.Timer | undefined;
const publishToDashboard = async () => {
	try {
		const dataPacket = await generateData();

		// Only update data on change
		if (!canSendDataPacket(dataPacket)) return;

		// Save last data packet
		lastDataPacketTimestamp = Date.now();
		lastDataPacketString = JSON.stringify(dataPacket);
		lastDataPacket = dataPacket;

		// Publish the updated data
		dashboardLogger.trace('Publishing update');
		await pubsub.publish('dashboard', {
			dashboard: dataPacket
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
	dashboardLogger.trace('Starting dashboard producer');
	dashboardProducer = setInterval(async () => {
		await publishToDashboard();
	}, 1_000);
};
