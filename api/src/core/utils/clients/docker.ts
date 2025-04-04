import Docker from 'dockerode';
import { PathsConfig } from '../../../config/paths.config.js';

const createDockerClient = () => {
    const paths = PathsConfig.getInstance();
    const socketPath = paths.dockerSocket;
    return new Docker({
        socketPath,
    });
};

/**
 * Docker client
 */
export const docker = createDockerClient();
export { createDockerClient };
