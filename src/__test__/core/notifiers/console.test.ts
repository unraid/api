import { expect, test } from 'vitest';
import { ConsoleNotifier } from '../../../core/notifiers/console';

test('Creates a console notifier', () => {
	const notifier = new ConsoleNotifier();
	expect(notifier.level).toBe('info');
	expect(notifier.template).toBe('{{{ data }}}');
});
