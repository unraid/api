import { createAction } from '@reduxjs/toolkit';

import { type MinigraphStatus } from '@app/graphql/generated/api/types.js';

export const setGraphqlConnectionStatus = createAction<{
    status: MinigraphStatus;
    error: string | null;
}>('graphql/status');
