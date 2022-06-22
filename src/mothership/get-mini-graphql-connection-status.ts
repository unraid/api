import { miniGraphqlStore } from '@app/mothership/store';

export const getMinigraphqlConnectionStatus = () => miniGraphqlStore.connected;
