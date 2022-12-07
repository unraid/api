import type { StoreSubscriptionHandler } from '@app/store/types';
import { FileLoadStatus } from '@app/store/types';
import type { RootState } from '@app/store';
import { store } from '@app/store';
import { logger, upnpLogger } from '@app/core';
import { enableUpnp, disableUpnp } from '@app/store/modules/upnp';
import { parseStringToNumberOrNull } from '@app/upnp/helpers';

const shouldUpnpBeEnabled = (state: RootState | null): boolean => {
	if (state === null) {
		return false;
	}

	const { useUpnp } = state.emhttp.var;
	const { wanport: wanPort, upnpEnabled, wanaccess } = state.config.remote;
	const wanPortAsNumber = parseStringToNumberOrNull(wanPort);

	return useUpnp && wanPortAsNumber !== null && upnpEnabled === 'yes' && wanaccess === 'yes';
};

export const syncUpnpChanges: StoreSubscriptionHandler = async lastState => {
	const { config: { status: configStatus, remote: { wanport } }, emhttp: { status: emhttpStatus, var: { portssl } } } = store.getState();
	if (configStatus !== FileLoadStatus.LOADED || emhttpStatus !== FileLoadStatus.LOADED) return;

	const upnpShouldBeEnabledNow = shouldUpnpBeEnabled(store.getState());
	const upnpWasEnabledBefore = shouldUpnpBeEnabled(lastState);

	const wanPortAsNumber = parseStringToNumberOrNull(wanport);
	const enablementStatusUnchanged = upnpShouldBeEnabledNow === upnpWasEnabledBefore;
	const portsUnchanged = wanport === lastState?.config.remote.wanport && portssl === lastState.emhttp.var.portssl;

	if (enablementStatusUnchanged && portsUnchanged) return;

	upnpLogger.trace('UPNP Enabled: (%s)  Wan Port: [%s]', upnpShouldBeEnabledNow, wanport);

	if (upnpShouldBeEnabledNow && wanPortAsNumber) {
		logger.info('Enabling UPNP For Port %s', wanPortAsNumber);
		await store.dispatch(enableUpnp({ wanPortForUpnp: wanPortAsNumber, localPortForUpnp: portssl, errors: { removal: null, renewal: null, mapping: null } }));
	} else if (!upnpShouldBeEnabledNow) {
		await store.dispatch(disableUpnp());
	}
};

