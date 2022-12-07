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
	const { upnpEnabled, wanaccess } = state.config.remote;

	return useUpnp && upnpEnabled === 'yes' && wanaccess === 'yes';
};

export const syncUpnpChanges: StoreSubscriptionHandler = async lastState => {
	const { config: { status: configStatus, remote: { wanport } }, emhttp: { status: emhttpStatus, var: { portssl } } } = store.getState();
	if (configStatus !== FileLoadStatus.LOADED || emhttpStatus !== FileLoadStatus.LOADED) return;

	const upnpShouldBeEnabledNow = shouldUpnpBeEnabled(store.getState());
	const upnpWasEnabledBefore = shouldUpnpBeEnabled(lastState);

	const enablementStatusUnchanged = upnpShouldBeEnabledNow === upnpWasEnabledBefore;
	const portsUnchanged = wanport === lastState?.config.remote.wanport && portssl === lastState.emhttp.var.portssl;

	if (enablementStatusUnchanged && portsUnchanged) return;

	upnpLogger.trace('UPNP Enabled: (%s)  Wan Port: [%s]', upnpShouldBeEnabledNow, wanport === '' ? 'Will Generate New WAN Port' : wanport);

	if (upnpShouldBeEnabledNow) {
		await store.dispatch(enableUpnp({ wanport, portssl }));
	} else {
		upnpLogger.warn('Disabling UPNP');
		await store.dispatch(disableUpnp());
	}
};

