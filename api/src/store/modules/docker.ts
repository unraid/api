import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import merge from 'lodash/merge';
import type { ContainerInfo } from 'dockerode';
import { DaemonConnectionStatus } from '@app/store/types';

type DockerState = {
	status: DaemonConnectionStatus;
	installed: number | null;
	running: number | null;
	containers: ContainerInfo[];
};

const initialState: DockerState = {
	status: DaemonConnectionStatus.DISCONNECTED,
	installed: null,
	running: null,
	containers: [],
};

export const docker = createSlice({
	name: 'docker',
	initialState,
	reducers: {
		updateDockerState(state, action: PayloadAction<Partial<typeof initialState>>) {
			return merge(state, action.payload);
		},
	},
});

export const { updateDockerState } = docker.actions;
