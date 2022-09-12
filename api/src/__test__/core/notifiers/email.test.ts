import { expect, test, vi } from 'vitest';
import { EmailNotifier } from '@app/core/notifiers/email';

vi.mock('@app/core/log', () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
	graphqlLogger: {
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

test('Creates an email notifier', () => {
	const notifier = new EmailNotifier({ to: 'admin@example.com' });
	expect(notifier.level).toBe('info');
	expect(notifier.template).toBe('{{{ data }}}');
});
