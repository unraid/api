/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import Docker from 'dockerode';

const socketPath = '/var/run/docker.sock';
const client = new Docker({
	socketPath,
});

/**
 * Docker client
 */
export const docker = client;