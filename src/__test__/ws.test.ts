import { v4 as randomUUID } from 'uuid';
import { expect, test, vi } from 'vitest';
import { getWsConnectionCount, getWsConnectionCountInChannel, hasSubscribedToChannel, hasUnsubscribedFromChannel, wsHasConnected } from '../ws';

vi.mock('@app/core/log', () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn()
	},
	graphqlLogger: {
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn()
	}
}));

test('Returns 0 when no connections exist', () => {
	expect(getWsConnectionCount()).toBe(0);
});

test('Handles subscribe and unsubscribe', () => {
	const id = randomUUID();
	const channel = randomUUID();

	expect(getWsConnectionCount()).toBe(0);

	// Connection started
	wsHasConnected(id);

	// Subscribed to channel
	hasSubscribedToChannel(id, channel);
	expect(getWsConnectionCount()).toBe(1);

	// Unsubscribe from channel
	hasUnsubscribedFromChannel(id, channel);
	expect(getWsConnectionCount()).toBe(0);
});

test('Gets count of subscriptions in a single channel', () => {
	const id = randomUUID();
	const channel = randomUUID();

	expect(getWsConnectionCount()).toBe(0);
	expect(getWsConnectionCountInChannel(channel)).toBe(0);

	// Connection started
	wsHasConnected(id);

	// Subscribed to channel
	hasSubscribedToChannel(id, channel);
	expect(getWsConnectionCount()).toBe(1);
	expect(getWsConnectionCountInChannel(channel)).toBe(1);

	// Unsubscribe from channel
	hasUnsubscribedFromChannel(id, channel);
	expect(getWsConnectionCount()).toBe(0);
	expect(getWsConnectionCountInChannel(channel)).toBe(0);
});
