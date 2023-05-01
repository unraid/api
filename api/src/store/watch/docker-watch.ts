import { store } from '@app/store';
import { dockerLogger } from '@app/core/log';
import { updateDockerState } from '@app/store/modules/docker';
import { getDockerContainers } from '@app/core/modules/index';
import { ContainerState } from '@app/graphql/generated/api/types';
import { docker } from '@app/core/utils/index';
import DockerEE from 'docker-event-emitter';

export const setupDockerWatch = async () => {
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

	const dee = new DockerEE(docker);
	// On Docker event update info with { apps: { installed, started } }
	dee.on('container', async (data: { Type: 'container'; Action: 'start' | 'stop'; from: string }) => {
		// Only listen to container events
		dockerLogger.debug('EVENT FROM DOCKER %o', data)

		dockerLogger.addContext('data', data);
		dockerLogger.debug(`[${data.from}] ${data.Type}->${data.Action}`);
		dockerLogger.removeContext('data');

		const containers = await getDockerContainers({ useCache: false });

		// Get all of the current containers
		const installed = containers.length;
		const running = containers.filter(container => container.state === ContainerState.RUNNING).length;

		// Update state
		store.dispatch(updateDockerState({ containers, installed, running }));
	});

	await dee.start()
	dockerLogger.debug('Binding to docker events');
};
