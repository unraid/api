import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { type DockerContainer } from '@app/graphql/generated/api/types';
import { DaemonConnectionStatus } from '@app/store/types';

type DockerState = {
    status: DaemonConnectionStatus;
    installed: number | null;
    running: number | null;
    containers: DockerContainer[];
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
            state.status = action.payload.status ?? initialState.status;
            state.installed = action.payload.installed ?? initialState.installed;
            state.running = action.payload.running ?? initialState.running;
            state.containers = action.payload.containers ?? initialState.containers;
        },
    },
});

export const { updateDockerState } = docker.actions;
