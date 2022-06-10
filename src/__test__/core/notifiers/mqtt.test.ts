import { expect, test, vi } from 'vitest';
import { MqttNotifier } from '../../../core/notifiers';

vi.mock('../../../core/log', () => ({
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

test('Creates a mqtt notifier', () => {
	const notifier = new MqttNotifier({ connectionUri: 'mqtt://127.0.0.1', username: 'admin', password: 'secret123', topic: 'unraid-api' });
	expect(notifier.level).toBe('info');
	expect(notifier.template).toBe('{{{ data }}}');
});
