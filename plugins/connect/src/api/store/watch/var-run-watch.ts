import type DockerEE from 'docker-event-emitter';
import { watch } from 'chokidar';

import { dockerLogger } from '@app/core/log.js';
import { getters, store } from '@app/store/index.js';
import { updateDockerState } from '@app/store/modules/docker.js';
import { setupDockerWatch } from '@app/store/watch/docker-watch.js';

export const setupVarRunWatch = () => {
    const paths = getters.paths();
    let dockerWatcher: null | typeof DockerEE = null;
    watch(paths['var-run'], { ignoreInitial: false })
        .on('add', async (path) => {
            if (path === paths['docker-socket']) {
                dockerLogger.debug('Starting docker watch');
                dockerWatcher = await setupDockerWatch();
            }
        })
        .on('unlink', (path) => {
            if (path === paths['docker-socket'] && dockerWatcher) {
                dockerLogger.debug('Stopping docker watch');
                dockerWatcher?.stop?.();

                store.dispatch(updateDockerState({ installed: null, running: null, containers: [] }));
            }
        });
};
