import type DockerEE from 'docker-event-emitter';
import { watch } from 'chokidar';

import { dockerLogger } from '@app/core/log.js';
import { store } from '@app/store/index.js';
import { updateDockerState } from '@app/store/modules/docker.js';
import { setupDockerWatch } from '@app/store/watch/docker-watch.js';
import { PathsConfig } from '../../config/paths.config.js';

export const setupVarRunWatch = () => {
    const paths = PathsConfig.getInstance();
    let dockerWatcher: null | typeof DockerEE = null;
    watch(paths.varRun, { ignoreInitial: false })
        .on('add', async (path) => {
            if (path === paths.dockerSocket) {
                dockerLogger.debug('Starting docker watch');
                dockerWatcher = await setupDockerWatch();
            }
        })
        .on('unlink', (path) => {
            if (path === paths.dockerSocket && dockerWatcher) {
                dockerLogger.debug('Stopping docker watch');
                dockerWatcher?.stop?.();

                store.dispatch(updateDockerState({ installed: null, running: null, containers: [] }));
            }
        });
};
