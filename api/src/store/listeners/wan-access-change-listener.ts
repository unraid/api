import { remoteAccessLogger } from '@app/core/log.js';
import { reloadNginxAndUpdateDNS } from '@app/store/actions/reload-nginx-and-update-dns.js';
import { startAppListening } from '@app/store/listeners/listener-middleware.js';
import { loadConfigFile } from '@app/store/modules/config.js';

export const enableWanAccessChangeListener = () =>
    startAppListening({
        predicate: (action, state, previousState) => {
            if (
                action.type === loadConfigFile.fulfilled.type &&
                previousState.config.remote.wanaccess !== '' &&
                state.config.remote.wanaccess !== previousState.config.remote.wanaccess
            ) {
                return true;
            }
            return false;
        },
        async effect(_, { dispatch }) {
            remoteAccessLogger.info('Wan access value changed, reloading Nginx and Calling Update DNS');
            await dispatch(reloadNginxAndUpdateDNS());
        },
    });
