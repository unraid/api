import { store } from '@app/store';
import { DockerEventEmitter } from '@gridplus/docker-events';
import { dockerLogger } from '@app/core/log';
import { docker } from '@app/core/utils/clients/docker';
import { updateDockerState } from '@app/store/modules/docker';

type ContainerState = 'created' | 'running' | 'exited';

export const setupDockerWatch = () => {
	// Only watch container events equal to start/stop
	const watchedEvents = [
		'die',
		'kill',
		'oom',
		'pause',
		'restart',
		'start',
		'stop',
		'unpause',
	].map(event => `event=${event}`);

	// Create docker event emitter instance
	dockerLogger.addContext('events', watchedEvents);
	dockerLogger.debug('Creating docker event emitter instance');
	dockerLogger.removeContext('events');

	const dee = new DockerEventEmitter(watchedEvents);

	// On Docker event update info with { apps: { installed, started } }
	dee.on('*', async (data: { Type: 'container'; Action: 'start' | 'stop'; from: string }) => {
		// Only listen to container events
		if (data.Type !== 'container') {
			dockerLogger.debug(`[${data.Type as string}] ${data.from} ${data.Action}`);
			return;
		}

		dockerLogger.addContext('data', data);
		dockerLogger.debug(`[${data.from}] ${data.Type}->${data.Action}`);
		dockerLogger.removeContext('data');

		// Get all of the current containers
		const containers = await docker.listContainers({ all: true });
		const installed = containers.length;
		const running = containers.filter(container => container.State as ContainerState === 'running').length;

		// Update state
		store.dispatch(updateDockerState({ containers, installed, running }));
	});

	dockerLogger.debug('Binding to docker events');
	dee.listen();
};
