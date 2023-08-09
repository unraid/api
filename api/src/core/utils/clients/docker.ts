import Docker from 'dockerode';

const socketPath = '/var/run/docker.sock';
const client = new Docker({
	socketPath,
});

/**
 * Docker client
 */
export const docker = client;