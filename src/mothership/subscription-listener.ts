import { debounce } from '@app/mothership/debounce';
import { relayLogger } from '@app/core/log';
import { sendMessage } from '@app/mothership/send-message';

const subscriptionCache: Record<string, unknown> = {};
export const subscriptionListener = (id: string | number, name: string) => (data: unknown) => {
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
