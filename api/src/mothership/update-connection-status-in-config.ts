import { checkMinigraphql } from '@app/graphql/resolvers/query/cloud/check-minigraphql';
import { checkRelay } from '@app/graphql/resolvers/query/cloud/check-relay';
import { store } from '@app/store';
import { setConnectionStatus } from '@app/store/modules/config';

export const updateConnectionStatusInConfig = async () => {
	const [minigraphql, relay] = await Promise.all([checkMinigraphql(), checkRelay()]);

	store.dispatch(setConnectionStatus({
		minigraph: minigraphql.status,
		relay: relay.status,
	}));
};
