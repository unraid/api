import { relayStore } from '@app/mothership/store';
import { handleReconnection } from '@app/mothership/handle-reconnection';
import { relayLogger } from '@app/core/log';

export const handleError = (error: unknown) => {
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
