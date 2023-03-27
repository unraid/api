import { dashboardLogger } from '@app/core/log';
import { config } from '@app/core/config';
import { generateData } from '@app/common/dashboard/generate-data';
import { pubsub } from '@app/core/pubsub';
import { getters, store } from '@app/store';
import { saveDataPacket } from '@app/store/modules/dashboard';
import { isEqual } from 'lodash';
import { GraphQLClient } from '@app/mothership/graphql-client';
import { SEND_DASHBOARD_PAYLOAD_MUTATION } from '../../mothership/mutations';
import { type DashboardInput } from '../../generated/client/graphql';
import { getDiff } from 'json-difference';
import { ApolloError } from '@apollo/client';

const isNumberBetween = (min: number, max: number) => (num: number) => num > min && num < max;

const logAndReturn = <T>(returnValue: T, logLevel: 'info' | 'debug' | 'trace' | 'error', logLine: string, ...logParams: unknown[]): T => {
	dashboardLogger[logLevel](logLine, ...logParams);
	return returnValue;
};

const ONE_MB = 1_024 * 1_024;
const ONE_HUNDRED_MB = 100 * ONE_MB;

const canSendDataPacket = (dataPacket: DashboardInput | null) => {
	const { lastDataPacketTimestamp, lastDataPacket } = getters.dashboard();
	// Const { lastDataPacketTimestamp, lastDataPacketString, lastDataPacket } = dashboardStore;
	if (!dataPacket) return logAndReturn(false, 'error', 'Not sending update to dashboard becuase the data packet is empty');

	// UPDATE - No data packet has been sent since boot
	if (!lastDataPacketTimestamp) return logAndReturn(true, 'debug', 'Sending update as none have been sent since the API started');

	// NO_UPDATE - This is an exact copy of the last data packet
	if (isEqual(dataPacket, lastDataPacket)) return logAndReturn(false, 'trace', 'Skipping sending update as its the same as the last one');

	if (!lastDataPacket) return logAndReturn(true, 'debug', 'Sending update as no data packets have been stored in state yet');

	const difference = getDiff(lastDataPacket, dataPacket);

	const oldBytesFree = lastDataPacket.array?.capacity.bytes?.free;
	const newBytesFree = dataPacket.array?.capacity.bytes?.free;

	if (oldBytesFree && newBytesFree && difference.added.length === 0 && difference.removed.length === 0 && difference.edited.length === 2) {
		// If size has changed less than 100 MB (and nothing else has changed), don't send an update

		const numberBetweenCheck = isNumberBetween((Number(oldBytesFree) * ONE_MB) - ONE_HUNDRED_MB, (Number(oldBytesFree) * ONE_MB) + ONE_HUNDRED_MB);
		if (numberBetweenCheck(Number(newBytesFree) * ONE_MB)) {
			logAndReturn(false, 'info', 'Size has not changed enough to send a new dashboard payload');
		}
	}

	return logAndReturn(true, 'trace', 'Sending update because the packets are not equal');
};

export const publishToDashboard = async () => {
	try {
		const dataPacket = await generateData();
		// Only update data on change
		if (!canSendDataPacket(dataPacket)) return;

		dashboardLogger.debug('New Data Packet Is: %o', dataPacket);

		// Save new data packet
		store.dispatch(saveDataPacket({ lastDataPacket: dataPacket }));

		// Publish the updated data
		dashboardLogger.addContext('update', dataPacket);
		dashboardLogger.trace('Publishing update');
		dashboardLogger.removeContext('update');

		// Update local clients
		await pubsub.publish('dashboard', {
			dashboard: dataPacket,
		});
		if (dataPacket) {
			const client = GraphQLClient.getInstance();
			if (!client) {
				throw new Error('Invalid Client');
			}

			// Update mothership
			await client.mutate({ mutation: SEND_DASHBOARD_PAYLOAD_MUTATION, variables: { apiKey: getters.config().remote.apikey, data: dataPacket } });
		} else {
			dashboardLogger.error('DataPacket Was Empty');
		}
	} catch (error: unknown) {
		if (error instanceof ApolloError) {
			dashboardLogger.error('Failed publishing with GQL Errors: %s, \nClient Errors: %s', error.graphQLErrors.map(error => error.message).join(','), error.clientErrors.join(', '));
		}

		if (config.debug) dashboardLogger.error(error);
	}
};

