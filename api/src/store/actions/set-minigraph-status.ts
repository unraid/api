import { createAction } from '@reduxjs/toolkit';

import { MinigraphStatus } from '@app/unraid-api/graph/resolvers/cloud/cloud.model.js';

export const setGraphqlConnectionStatus = createAction<{
    status: MinigraphStatus;
    error: string | null;
}>('graphql/status');
