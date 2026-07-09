import { onBeforeMount, onMounted } from 'vue';

import { devConfig } from '~/helpers/env';

import type { Server } from '~/types/server';

import { useCallbackActionsStore } from '~/store/callbackActions';
import { useServerStore } from '~/store/server';

/**
 * Hydrates the server store from a `server` prop (JSON string when mounted as a
 * web component, or an object in dev/testing) and wires up the callback watcher.
 *
 * Shared by the standalone header entry points so the consolidated header and the
 * legacy `UserProfile` header behave identically when receiving server state.
 */
export function useServerProp(getServer: () => Server | string | undefined) {
  const callbackStore = useCallbackActionsStore();
  const serverStore = useServerStore();

  onBeforeMount(() => {
    const server = getServer();
    if (!server) {
      throw new Error('Server data not present');
    }

    if (typeof server === 'object') {
      serverStore.setServer(server);
    } else if (typeof server === 'string') {
      serverStore.setServer(JSON.parse(server));
    }

    // look for any callback params
    callbackStore.watcher();

    if (serverStore.guid && serverStore.keyfile) {
      if (callbackStore.callbackData) {
        console.debug(
          'Renew callback detected, skipping auto check for key replacement, renewal eligibility, and OS Update.'
        );
      }
    } else {
      console.warn(
        'A valid keyfile and USB Flash boot device are required to check for key renewals, key replacement eligibiliy, and OS update availability.'
      );
    }
  });

  onMounted(() => {
    if (devConfig.VITE_MOCK_USER_SESSION && devConfig.NODE_ENV === 'development') {
      document.cookie = 'unraid_session_cookie=mockusersession';
    }
  });
}
