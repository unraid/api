import { checkMinigraphql } from '@app/graphql/resolvers/query/cloud/check-minigraphql';
import { store } from '@app/store';
import { setConnectionStatus } from '@app/store/modules/config';

export const updateConnectionStatusInConfig = async () => {
	const minigraphql = await checkMinigraphql();

	store.dispatch(setConnectionStatus({
		minigraph: minigraphql.status,
	}));
};
