import { startAppListening } from '@app/store/listeners/listener-middleware';
import { loadConfigFile, loginUser, logoutUser } from '@app/store/modules/config';
import { FileLoadStatus } from '@app/store/types';
import { isAnyOf } from '@reduxjs/toolkit';

const configLoadMatcher = isAnyOf(loadConfigFile.fulfilled);

export const enableLoginListener = () => startAppListening({
	matcher: configLoadMatcher,
	async effect(action, { getState, dispatch }) {
		if (getState().config.status === FileLoadStatus.LOADED && loadConfigFile.fulfilled.match(action) && !action.payload.remote.apikey) {
			await dispatch(logoutUser({ reason: 'Logged out manually' }));
		}
	},
});

export const enableLogoutListener = () => startAppListening({
	predicate(_, currentState, previousState) {
		if (currentState.config.status === FileLoadStatus.LOADED) {
			if (currentState.config.remote.username !== '' && previousState.config.remote.username === '') {
				return true;
			}
		}

		return false;
	},
	async effect(_, { getState, dispatch }) {
		const { config: { remote: { username, avatar, email } } } = getState();
		await dispatch(loginUser({
			avatar,
			username,
			email,
		}));
	},
});
