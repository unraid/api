import { dashboardLogger } from '@app/core/log';
import { config } from '@app/core/config';
import { generateData } from '@app/common/dashboard/generate-data';
import { pubsub } from '@app/core/pubsub';

type Dashboard = Awaited<ReturnType<typeof generateData>>;

const isNumberBetween = (min: number, max: number) => (num: number) => num > min && num < max;

const logAndReturn = <T>(returnValue: T, logLevel: 'info' | 'debug' | 'trace', logLine: string, ...logParams: any[]): T => {
	dashboardLogger[logLevel](logLine, ...logParams);
	return returnValue;
};

const ONE_MB = 1_024 * 1_024;
const ONE_HUNDRED_MB = 100 * ONE_MB;

let lastDataPacketTimestamp: number | undefined;
let lastDataPacket: Dashboard;
let lastDataPacketString: string;
const canSendDataPacket = (dataPacket: Dashboard) => {
	// UPDATE - No data packet has been sent since boot
	if (!lastDataPacketTimestamp) return logAndReturn(true, 'debug', 'Sending update as none have been sent since the API started');

	// NO_UPDATE - This is an exact copy of the last data packet
	if (lastDataPacketString === JSON.stringify(dataPacket)) return logAndReturn(false, 'trace', 'Skipping sending update as its the same as the last one');

	// UPDATE - Apps have been installed/started
	if (dataPacket.apps.installed !== lastDataPacket.apps.installed) return logAndReturn(true, 'debug', 'Sending update as docker containers have been un/installed');
	if (dataPacket.apps.started !== lastDataPacket.apps.started) return logAndReturn(true, 'debug', 'Sending update as docker containers have been started/stopped');

	// UPDATE - Array state changed
	if (dataPacket.array.state !== lastDataPacket.array.state) return logAndReturn(true, 'debug', 'Sending update as array state has changed');

	// UPDATE - Array free has changed by more than 100MB in either direction
	if (!isNumberBetween(Number(lastDataPacket.array.capacity.bytes.free) - ONE_HUNDRED_MB, Number(lastDataPacket.array.capacity.bytes.free) + ONE_HUNDRED_MB)(Number(dataPacket.array.capacity.bytes.free))) return logAndReturn(true, 'trace', 'Sending update as array free size has changed by more than 100MB');

	// UPDATE - Vms have been added/started
	if (dataPacket.vms.installed !== lastDataPacket.vms.installed) return logAndReturn(true, 'debug', 'Sending update as VMs have been installed');
	if (dataPacket.vms.started !== lastDataPacket.vms.started) return logAndReturn(true, 'debug', 'Sending update as VMs have been started');

	// UPDATE - Twofactor config has changed
	if (dataPacket.twoFactor.local.enabled !== lastDataPacket.twoFactor.local.enabled) return logAndReturn(true, 'debug', 'Sending update as local twoFactor has been updated');
	if (dataPacket.twoFactor.remote.enabled !== lastDataPacket.twoFactor.remote.enabled) return logAndReturn(true, 'debug', 'Sending update as remote twoFactor has been updated');

	// UPDATE - Vars changed
	if (dataPacket.vars.flashGuid !== lastDataPacket.vars.flashGuid) return logAndReturn(true, 'debug', 'Sending update as flashGuid has changed');
	if (dataPacket.vars.regState !== lastDataPacket.vars.regState) return logAndReturn(true, 'debug', 'Sending update as regState has changed');
	if (dataPacket.vars.regTy !== lastDataPacket.vars.regTy) return logAndReturn(true, 'debug', 'Sending update as regTy has changed');

	// UPDATE - Display changed
	if (dataPacket.display.case.icon !== lastDataPacket.display.case.icon) return logAndReturn(true, 'debug', 'Sending update as case icon has changed');
	if (dataPacket.display.case.url !== lastDataPacket.display.case.url) return logAndReturn(true, 'debug', 'Sending update as case with custom url has changed');

	// UPDATE - Config changed
	if (dataPacket.config.valid !== lastDataPacket.config.valid) return logAndReturn(true, 'debug', 'Sending update as config.valid has changed');
	if (dataPacket.config.error !== lastDataPacket.config.error) return logAndReturn(true, 'debug', 'Sending update as config.error has changed');

	// UPDATE - OS name changed
	if (dataPacket.os.hostname !== lastDataPacket.os.hostname) return logAndReturn(true, 'debug', 'Sending update as os.hostname has changed');

	// UPDATE - It's been 1h since last update
	if (Date.now() - 360_000 >= lastDataPacketTimestamp) return logAndReturn(true, 'debug', 'Sending update as its been more than 1h since the last one');

	// Nothing has changed enough for an update to be sent
	return logAndReturn(false, 'trace', 'Skipping sending update as not enough data has changed');
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
