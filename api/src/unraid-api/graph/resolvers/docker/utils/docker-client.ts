import Docker from 'dockerode';

let instance: Docker | undefined;

export function getDockerClient(): Docker {
    if (!instance) {
        instance = new Docker({
            socketPath: '/var/run/docker.sock',
        });
    }
    return instance;
}
