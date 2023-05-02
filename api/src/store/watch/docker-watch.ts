import { store } from '@app/store';
import { dockerLogger } from '@app/core/log';
import { updateDockerState } from '@app/store/modules/docker';
import { getDockerContainers } from '@app/core/modules/index';
import { docker } from '@app/core/utils/index';
import DockerEE from 'docker-event-emitter';
import { debounce } from 'lodash';

const updateContainerCache = async () => {
    try {
        await getDockerContainers({ useCache: false });
    } catch (err) {
        dockerLogger.warn('Caught error getting containers %o', err);
        store.dispatch(
            updateDockerState({
                installed: null,
                running: null,
                containers: [],
            })
        );
    }
};

const debouncedContainerCacheUpdate = debounce(updateContainerCache, 500);

export const setupDockerWatch = async (): Promise<DockerEE> => {
    // Only watch container events equal to start/stop
    const watchedActions = [
        'die',
        'kill',
        'oom',
        'pause',
        'restart',
        'start',
        'stop',
        'unpause',
    ];

    // Create docker event emitter instance
    dockerLogger.debug('Creating docker event emitter instance');

    const dee = new DockerEE(docker);
    // On Docker event update info with { apps: { installed, started } }
    dee.on(
        'container',
        async (data: {
            Type: 'container';
            Action: 'start' | 'stop';
            from: string;
        }) => {
            // Only listen to container events
            if (!watchedActions.includes(data.Action)) {
                return;
            }
            dockerLogger.addContext('data', data);
            dockerLogger.debug(`[${data.from}] ${data.Type}->${data.Action}`);
            dockerLogger.removeContext('data');
            await debouncedContainerCacheUpdate();
        }
    );
    // Get docker container count on first start
    await debouncedContainerCacheUpdate();
    await dee.start();
    dockerLogger.debug('Binding to docker events');
    return dee;
};
