/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import pify from 'pify';
import Docker from 'dockerode';
import { getters } from '@app/store';

// Borrowed from https://stackoverflow.com/a/52731696 until pify
// adds their own types, check https://github.com/sindresorhus/pify/issues/74
type UnpackedPromise<T> = T extends Promise<infer U> ? U : T;
type GenericFunction<TS extends any[], R> = (...args: TS) => R;
type Promisify<T> = {
	[K in keyof T]: T[K] extends GenericFunction<infer TS, infer R>
		? (...args: TS) => Promise<UnpackedPromise<R>>
		: never
};

const socketPath = getters.paths()['docker-socket'] ?? '/var/run/docker.sock';
const client = new Docker({
	socketPath,
});

/**
 * Docker client
 */
export const docker = pify(client) as unknown as Promisify<Docker>;
