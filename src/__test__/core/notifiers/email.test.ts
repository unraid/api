import { expect, test } from 'vitest';
import { EmailNotifier } from '../../../core/notifiers/email';

test('Creates an email notifier', () => {
	const notifier = new EmailNotifier({ to: 'admin@example.com' });
	expect(notifier.level).toBe('info');
	expect(notifier.template).toBe('{{{ data }}}');
});
