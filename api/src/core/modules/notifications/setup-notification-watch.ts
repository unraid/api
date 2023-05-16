import { getters, store } from '@app/store/index';
import { clearNotification, loadNotification } from '@app/store/modules/notifications';
import { FileLoadStatus } from '@app/store/types';
import { type FSWatcher, watch } from 'chokidar';
import { join } from 'node:path';

const handleNotificationAdd = (path: string) => {
    store.dispatch(loadNotification({ path }));
};

const handleNotificationRemove = (path: string) => {
    store.dispatch(clearNotification({ path }));
};

let watcher: FSWatcher | null = null;

export const setupNotificationWatch = async (): Promise<FSWatcher | null> => {
    const { notify, status } = getters.dynamix();
    if (status === FileLoadStatus.LOADED && notify?.path) {
        if (watcher) {
            await watcher.close()
        }
        watcher = watch(join(notify.path, 'unread'), {})
            .on('add', (path) => {
                handleNotificationAdd(path);
            })
            .on('unlink', (path) => {
                handleNotificationRemove(path);
            });

        return watcher;
    }
    return null;
};
