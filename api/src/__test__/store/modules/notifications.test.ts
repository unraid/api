import { setupNotificationWatch } from '@app/core/modules/notifications/setup-notification-watch';
import { sleep } from '@app/core/utils/misc/sleep';
import { store } from '@app/store/index';
import { loadDynamixConfigFile } from '@app/store/modules/dynamix';
import { expect, test } from 'vitest';

test('loads notifications properly', async () => {
    await store.dispatch(loadDynamixConfigFile());
    const watch = setupNotificationWatch();
    expect(watch).not.toBeNull();
    await sleep(400);
    expect(store.getState().notifications.notifications).toMatchSnapshot();
    await watch?.close();
});
