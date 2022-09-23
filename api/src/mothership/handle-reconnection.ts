import { logger } from '@app/core';
import { wsState } from '@app/mothership/should-be-connect-to-cloud';
import { convertToFuzzyTime } from '@app/mothership/utils/convert-to-fuzzy-time';
import { store } from '@app/store';
import { logoutUser } from '@app/store/modules/config';

export const handleReconnection = (reason: string, code: number): { reason: string; timeout?: number } => {
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
			// Clear the key from the store

			store.dispatch(logoutUser())
				.catch(err => {
					logger.error('Error logging user out in handle-reconnection');
					logger.trace(err);
				});
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
