import { startAppListening } from '@app/store/listeners/listener-middleware';
import { loginUser, logoutUser } from '@app/store/modules/config';
import { FileLoadStatus } from '@app/store/types';

export const enableLoginListener = () => startAppListening({
	predicate(_, currentState, previousState) {
		if (currentState.config.status === FileLoadStatus.LOADED) {
			if (currentState.config.remote.username === '' && previousState.config.remote.username !== '') {
				return true;
			}
		}

		return false;
	},
	async effect(_, { dispatch }) {
		await dispatch(logoutUser({ reason: 'Logged out manually' }));
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
