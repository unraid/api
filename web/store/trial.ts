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

  const requestTrial = async (type?: TrialExtend | TrialStart) => {
    try {
      const payload = {
        guid: serverStore.guid,
        timestamp: Math.floor(Date.now() / 1000),
      };
      const response: StartTrialResponse = await startTrial(payload);
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
      trialStatus.value = 'success';
      return callbackActionsStore.saveCallbackData(trialStartData);
    } catch (error) {
      trialStatus.value = 'failed';
      console.error('[requestTrial]', error);
    }
  };

  const setTrialStatus = (status: TrialStatus) => {
    trialStatus.value = status;
  };

  watch(trialStatus, (newVal) => {
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
    // Actions
    requestTrial,
    setTrialStatus,
  };
});
