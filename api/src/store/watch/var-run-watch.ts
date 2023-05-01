import { dockerLogger } from '@app/core/log';
import { getters } from '@app/store/index';
import { setupDockerWatch } from '@app/store/watch/docker-watch';
import { watch } from 'chokidar';
import type DockerEE from 'docker-event-emitter';

export const setupVarRunWatch = () => {
    const paths = getters.paths()
    let dockerWatcher: null | typeof DockerEE = null;
    watch(paths['var-run'], { ignoreInitial: false }).on('add', async (path) => {
        if (path === paths['docker-socket']) {
            dockerLogger.debug('Starting docker watch');
            dockerWatcher = await setupDockerWatch()
        }
    }).on('unlink', (path) => {
        if (path === paths['docker-socket'] && dockerWatcher) {
            dockerLogger.debug('Stopping docker watch')
            dockerWatcher?.stop?.()
        }
    })

}