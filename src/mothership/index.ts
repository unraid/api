import { createStream as createRotatingFileStream, RotatingFileStream } from 'rotating-file-stream';
import { debounce } from '@app/mothership/debounce';
import { relayLogger } from '@app/core/log';
import { apiManager } from '@app/core/api-manager';
import { wsState } from '@app/mothership/should-be-connect-to-cloud';
import { relayStore } from '@app/mothership/store';
import { MothershipJobs } from './jobs';

const convertToFuzzyTime = (min: number, max: number): number => Math.floor((Math.random() * (max - min + 1)) + min);

let outgoingStream: RotatingFileStream;
const saveOutgoingWebsocketMessageToDisk = (message: string) => {
	// Start stream if it doesn't exist
	if (!outgoingStream) {
		outgoingStream = createRotatingFileStream('/var/log/unraid-api/relay-outgoing-messages.log', {
			size: '10M', // Rotate every 10 MegaBytes written
			interval: '1d', // Rotate daily
			compress: 'gzip', // Compress rotated files
			maxFiles: parseInt(process.env.LOG_MOTHERSHIP_MESSAGES_MAX_FILES ?? '2', 10), // Keep a maximum of 2 log files
		});
	}

	outgoingStream.write(`[${new Date().toISOString()}] ${message}\n`);
};

let incomingStream: RotatingFileStream;
const saveIncomingWebsocketMessageToDisk = (message: string) => {
	// Start stream if it doesn't exist
	if (!incomingStream) {
		incomingStream = createRotatingFileStream('/var/log/unraid-api/relay-incoming-messages.log', {
			size: '10M', // Rotate every 10 MegaBytes written
			interval: '1d', // Rotate daily
			compress: 'gzip', // Compress rotated files
			maxFiles: parseInt(process.env.LOG_MOTHERSHIP_MESSAGES_MAX_FILES ?? '2', 10), // Keep a maximum of 2 log files
		});
	}

	incomingStream.write(`[${new Date().toISOString()}] ${message}\n`);
};

/**
 * Send a message to relay if it's open
 * @param type ka = keep-alive, error or data
 */
function sendMessage(name: string, type: 'ka');
function sendMessage(name: string, type: 'error', id: string | number, payload: { error: Record<string, unknown> });
function sendMessage(name: string, type: 'data', id: string | number, payload: { data: Record<string, unknown> });
function sendMessage(name: string, type: string, id?: unknown, payload?: Record<string, unknown>): void {
	if (!relayStore.relay?.isOpened) return;
	const data = {
		id,
		payload,
		type,
	};
	const message = JSON.stringify(data);

	// Log the message
	if (type === 'ka') {
		relayLogger.trace('Sending keep-alive message');
	} else {
		relayLogger.addContext('message', message);
		relayLogger.trace('Sending update to subscription %s for %s', id, name);
		relayLogger.removeContext('message');
	}

	// Log all messages
	if (process.env.LOG_MOTHERSHIP_MESSAGES) saveOutgoingWebsocketMessageToDisk(JSON.stringify({ name, data }));

	relayStore.relay.send(message);
}

const subscriptionCache: Record<string, unknown> = {};
const subscriptionListener = (id: string | number, name: string) => (data: unknown) => {
	relayLogger.trace('Got message from listener for %s', name);

	// Bail as we've already sent mothership a message exactly like this
	if (subscriptionCache[name] === data) return;

	// Update the subscription cache
	if (subscriptionCache[name] === undefined) subscriptionCache[name] = data;

	switch (true) {
		// Array needs dampening as it generates too many events during intense IO
		case name === 'array':
			debounce(sendMessage(name, 'data', id, { data } as { data: Record<string, unknown> }), 1_000);
			break;
		default:
			sendMessage(name, 'data', id, { data } as { data: Record<string, unknown> });
			break;
	}
};

const handleReconnection = (reason: string, code: number): { reason: string; timeout?: number } => {
	switch (code) {
		// Client disconnected
		case 5:
			// Bail as the API has disconnected itself
			return { reason: 'API disconnected itself', timeout: convertToFuzzyTime(10_000, 60_000) };

		// Client disconnected
		case 6:
			// Bail as the API has disconnected itself
			return { reason: 'API disconnected itself', timeout: convertToFuzzyTime(10_000, 60_000) };

		// Relay is updating
		case 12:
			return { reason: 'Relay is restarting', timeout: convertToFuzzyTime(10_000, 60_000) };

		case 401:
			// Bail as the key is invalid and we need a valid one to connect
			// Tell api manager to delete the key as it's invalid
			apiManager.expire('my_servers');
			return { reason: 'API key is invalid' };

		case 426:
			// Bail as we cannot reconnect
			wsState.outOfDate = true;
			return { reason: 'API is out of date' };

		case 429: {
			// Reconnect after ~30s
			return { reason: 'You are rate limited', timeout: convertToFuzzyTime(15_000, 45_000) };
		}

		case 500: {
			// Reconnect after ~60s
			return { reason: 'Relay returned a 500 error', timeout: convertToFuzzyTime(45_000, 75_000) };
		}

		case 503: {
			// Reconnect after ~60s
			return { reason: 'Relay is unreachable', timeout: convertToFuzzyTime(45_000, 75_000) };
		}

		default: {
			// Reconnect after ~60s
			return { reason: reason || 'unknown', timeout: convertToFuzzyTime(45_000, 75_000) };
		}
	}
};

const handleError = (error: unknown) => {
	const reason = (error as any).reason as string;
	const code = (error as any).code as number ?? 500;
	const { timeout, reason: reconnectionReason } = handleReconnection(reason, code);
	relayStore.reason = reconnectionReason;
	relayStore.code = code;

	relayLogger.debug('Disconnected with status="%s" reason="%s"', code, reconnectionReason);
	if (!timeout) return;

	relayStore.timeout = Date.now() + timeout;
	setTimeout(() => {
		relayStore.timeout = undefined;
		relayStore.reason = undefined;
		relayStore.code = undefined;
	}, timeout);
};

let interval: NodeJS.Timer;
const startKeepAlive = () => {
	// If we had an old timer running make sure to clear it
	if (interval) clearInterval(interval);

	interval = setInterval(() => {
		// If we disconnect stop sending keep alive messages
		if (!relayStore.relay?.isOpened) {
			clearInterval(interval);
			return;
		}

		// Send keep alive message
		relayLogger.trace('Sending keep alive message');
		sendMessage('ka', 'ka');
	}, 30_000);
};

interface Message {
	id: string;
	type: 'query' | 'mutation' | 'start' | 'stop';
	payload: any;
}

const messageIdLookup = new Map<string, { subId: number; field: string }>();

