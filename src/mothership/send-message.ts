import { relayLogger } from '@app/core/log';
import { relayStore } from '@app/mothership/store';
/**
 * Send a message to relay if it's open
 * @param type ka = keep-alive, error or data
 */
export function sendMessage(name: string, type: 'ka');
export function sendMessage(name: string, type: 'error', id: string | number, payload: { error: Record<string, unknown> });
export function sendMessage(name: string, type: 'data', id: string | number, payload: { data: Record<string, unknown> });
export function sendMessage(name: string, type: string, id?: unknown, payload?: Record<string, unknown>): void {
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
