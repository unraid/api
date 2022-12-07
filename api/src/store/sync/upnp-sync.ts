import { FileLoadStatus, StoreSubscriptionHandler } from '@app/store/types';
import { RootState, store } from '@app/store';
import { upnpLogger } from '@app/core';
import { enableUpnp, disableUpnp } from '@app/store/modules/upnp';
import { parseStringToNumberOrNull } from '@app/upnp/helpers';

const shouldUpnpBeEnabled = (state: RootState): boolean => {
	const { useUpnp } = state.emhttp.var;
	const { wanport: wanPort, upnpEnabled, wanaccess } = state.config.remote;
	const wanPortAsNumber = parseStringToNumberOrNull(wanPort);

	return useUpnp && wanPortAsNumber !== null && upnpEnabled === 'yes' && wanaccess === 'yes';
};

export const syncUpnpChanges: StoreSubscriptionHandler = async lastState => {
	const { config: { status: configStatus, remote: { wanport } }, emhttp: { status: emhttpStatus, var: { portssl } }, upnp } = store.getState();
	if (configStatus !== FileLoadStatus.LOADED || emhttpStatus !== FileLoadStatus.LOADED) return;

	const upnpShouldBeEnabledNow = shouldUpnpBeEnabled(store.getState());
	const upnpWasEnabledBefore = shouldUpnpBeEnabled(lastState!);

	const wanPortAsNumber = parseStringToNumberOrNull(wanport);
	const enablementStatusUnchanged = upnpShouldBeEnabledNow === upnpWasEnabledBefore;
	const portsUnchanged = wanPortAsNumber === upnp.wanPortForUpnp && portssl === upnp.localPortForUpnp;

	if (enablementStatusUnchanged && portsUnchanged) return;

	upnpLogger.trace('UPNP Enabled: (%s)  Wan Port: [%s]', upnpShouldBeEnabledNow, wanport);

	if (upnpShouldBeEnabledNow && wanPortAsNumber) {
		void store.dispatch(enableUpnp({ wanPort: wanPortAsNumber, localPort: portssl }));
	} else if (!upnpShouldBeEnabledNow) {
		store.dispatch(disableUpnp());
	}
};

