import { expect, test, vi } from 'vitest';

import { UnraidLocalNotifier } from '@app/core/notifiers/unraid-local';

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
	const notifier = new UnraidLocalNotifier({ level: 'info' });
	expect(notifier.level).toBe('normal');
	expect(notifier.template).toBe('{{ message }}');
	const rendered = notifier.render({ message: 'Remote access started' });
	expect(rendered).toEqual('Remote access started');
});
