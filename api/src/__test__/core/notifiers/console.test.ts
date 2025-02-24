import { expect, test, vi } from 'vitest';

import { ConsoleNotifier } from '@app/core/notifiers/console.js';

vi.mock('@app/core/log.js', () => ({
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

test('Creates a console notifier', () => {
    const notifier = new ConsoleNotifier();
    expect(notifier.level).toBe('info');
    expect(notifier.template).toBe('{{{ data }}}');
});
