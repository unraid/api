import { defineStore, createPinia, setActivePinia } from 'pinia';

import { addPreventClose, removePreventClose } from '~/composables/preventClose';
import { startTrial, type StartTrialResponse } from '~/composables/services/keyServer';

import { useCallbackActionsStore } from '~/store/callbackActions';
import { useDropdownStore } from '~/store/dropdown';
import { useServerStore } from '~/store/server';
import type { ExternalPayload, TrialExtend, TrialStart } from '~/store/callback';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
*/
setActivePinia(createPinia());

export const useTrialStore = defineStore('trial', () => {
  const callbackActionsStore = useCallbackActionsStore();
  const dropdownStore = useDropdownStore();
  const serverStore = useServerStore();

  type TrialStatus = 'failed' | 'ready' | TrialExtend | TrialStart | 'success';
  const trialStatus = ref<TrialStatus>('ready');

  const trialModalLoading = computed(() => trialStatus.value === 'trialExtend' || trialStatus.value === 'trialStart');
  const trialModalVisible = computed(() => trialStatus.value === 'failed' || trialStatus.value === 'trialExtend' || trialStatus.value === 'trialStart');
  interface TrialStatusCopy {
    heading: string;
    subheading?: string;
  }
  const trialStatusCopy = computed((): TrialStatusCopy | null => {
    switch (trialStatus.value) {
      case 'failed':
        return {
          heading: 'Trial Key Creation Failed',
          subheading: 'Key server did not return a trial key. Please try again later.',
        };
      case 'trialExtend':
        return {
          heading: 'Extending your free trial by 15 days',
          subheading: 'Please keep this window open',
        };
      case 'trialStart':
        return {
          heading: 'Starting your free 30 day trial',
          subheading: 'Please keep this window open',
        };
      case 'success':
        return {
          heading: 'Trial Key Created',
          subheading: 'Please wait while the page reloads to install your trial key',
        };
      case 'ready':
        return null;
    }
  });

  const requestTrial = async (type?: TrialExtend | TrialStart) => {
    console.debug('[requestTrial]');
    try {
      const payload = {
        guid: serverStore.guid,
        timestamp: Math.floor(Date.now() / 1000),
      };
      const response: StartTrialResponse = await startTrial(payload).json();
      console.debug('[requestTrial]', response);
      if (!response.license) {
        trialStatus.value = 'failed';
        return console.error('[requestTrial]', 'No license returned', response);
      }
      // manually create a payload to mimic a callback for key installs
      const trialStartData: ExternalPayload = {
        actions: [
          {
            keyUrl: response.license,
            type: type ?? 'trialStart',
          },
        ],
        sender: window.location.href,
        type: 'forUpc',
      };
      console.debug('[requestTrial]', trialStartData);
      trialStatus.value = 'success';
      return callbackActionsStore.redirectToCallbackType(trialStartData);
    } catch (error) {
      trialStatus.value = 'failed';
      console.error('[requestTrial]', error);
    }
  };

  const setTrialStatus = (status: TrialStatus) => {
    trialStatus.value = status;
  };

  watch(trialStatus, (newVal, oldVal) => {
    console.debug('[trialStatus]', newVal, oldVal);
    // opening
    if (newVal === 'trialExtend' || newVal === 'trialStart') {
      addPreventClose();
      dropdownStore.dropdownHide(); // close the dropdown when the trial modal is opened
      setTimeout(() => {
        requestTrial(newVal);
      }, 1500);
    }
    // allow closure
    if (newVal === 'failed' || newVal === 'success') {
      removePreventClose();
    }
  });

  return {
    // State
    trialModalLoading,
    trialModalVisible,
    trialStatus,
    // Getters
    trialStatusCopy,
    // Actions
    requestTrial,
    setTrialStatus,
  };
});
