import { defineStore, createPinia, setActivePinia } from 'pinia';
import { useCallbackStore } from './callbackActions';
import { useServerStore } from './server';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useTrialStore = defineStore('trial', () => {
  const callbackStore = useCallbackStore();
  const serverStore = useServerStore();

  const extend = () => {
    console.debug('[extend]');
    callbackStore.send('https://localhost:8008/connect', [{
      server: {
        ...serverStore.serverAccountPayload,
      },
      type: 'trialExtend',
    }]);
  };
  const start = () => {
    console.debug('[start]');
    callbackStore.send('https://localhost:8008/connect', [{
      server: {
        ...serverStore.serverAccountPayload,
      },
      type: 'trialStart',
    }]);
  };

  return {
    // State
    // Actions
    extend,
    start,
  };
});
