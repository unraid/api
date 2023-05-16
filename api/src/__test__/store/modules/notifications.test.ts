import { setupNotificationWatch } from '@app/core/modules/notifications/setup-notification-watch';
import { sleep } from '@app/core/utils/misc/sleep';
import { loadDynamixConfigFile } from '@app/store/actions/load-dynamix-config-file';
import { store } from '@app/store/index';
import { expect, test } from 'vitest';

test('loads notifications properly', async () => {
    await store.dispatch(loadDynamixConfigFile()).unwrap();
    const watch = await setupNotificationWatch();
    expect(watch).not.toBeNull();
    await sleep(400);
    expect(store.getState().notifications.notifications).toMatchSnapshot();
    await watch?.close();
});
