import { XCircleIcon } from '@heroicons/vue/24/solid';
import { defineStore, createPinia, setActivePinia } from 'pinia';

// import { useAccountStore } from '~/store/account';
// import { useCallbackStore, useCallbackActionsStore } from '~/store/callbackActions';
// import { useInstallKeyStore } from '~/store/installKey';
// import { useServerStore } from '~/store/server';
import type { ButtonProps } from '~/components/Brand/Button.vue';

import { OBJ_TO_STR } from '~/helpers/functions';

import type {
  Server,
  ServerStateData,
} from '~/types/server';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export type ErrorType = 'account' | 'callback' | 'installKey' | 'server' | 'serverState';
export interface Error {
  actions?: ButtonProps[];
  debugServer?: Server;
  heading: string;
  level: 'error' | 'info' | 'warning';
  message: string;
  ref?: string;
  supportLink?: boolean;
  type: ErrorType;
}

export const useErrorsStore = defineStore('errors', () => {
  // const accountStore = useAccountStore();
  // const callbackStore = useCallbackStore();
  // const callbackActionsStore = useCallbackActionsStore();
  // const installKeyStore = useInstallKeyStore();
  // const serverStore = useServerStore();

  const errors = ref<Error[]>([]);

  const displayedErrors = computed(() => errors.value.filter(error => error.type === 'server' || error.type === 'serverState'));

  const removeErrorByIndex = (index: number) => {
    errors.value = errors.value.filter((_error, i) => i !== index);
  };

  const removeErrorByRef = (ref: string) => {
    errors.value = errors.value.filter(error => error?.ref !== ref);
  };

  const resetErrors = () => {
    errors.value = [];
  };

  const setError = (error: Error) => {
    errors.value.push(error);
  };

  interface BugReportPayload {
    email: string; 
    includeUnraidApiLogs: boolean;
  }

  const openBugReport = async (payload: BugReportPayload) => {
    console.debug('[openBugReport]', payload);
    try {
      // eslint-disable-next-line no-undef
      // @ts-ignore – `FeedbackButton` will be included in 6.10.4+ DefaultPageLayout
      await FeedbackButton();
      // once the modal is visible we need to select the radio to correctly show the bug report form
      let $modal = document.querySelector('.sweet-alert.visible');
      while (!$modal) {
        console.debug('[openBugReport] getting $modal…');
        await new Promise(resolve => setTimeout(resolve, 100));
        $modal = document.querySelector('.sweet-alert.visible');
      }
      console.debug('[openBugReport] $modal', $modal);
      // autofill errors into the bug report form
      if (errors.value.length) {
        let $textarea = $modal.querySelector('#bugreport_panel textarea');
        while (!$textarea) {
          console.debug('[openBugReport] getting $textarea…');
          await new Promise(resolve => setTimeout(resolve, 100));
          $textarea = $modal.querySelector('#bugreport_panel textarea');
        }
        console.debug('[openBugReport] $textarea', $textarea);
        const errorMessages = errors.value.map((error, index) => {
          const index1 = index + 1;
          let message = `• Error ${index1}: ${error.heading}\n`;
          message += `• Error ${index1} Message: ${error.message}\n`;
          message += `• Error ${index1} Level: ${error.level}\n`;
          message += `• Error ${index1} Type: ${error.type}\n`;
          if (error.ref) message += `• Error ${index1} Ref: ${error.ref}\n`;
          if (error.debugServer) message += `• Error ${index1} Debug Server: ${OBJ_TO_STR(error.debugServer)}\n`;
          return message;
        }).join('\n***************\n');
        $textarea.value += `\n##########################\n`;
        $textarea.value += `# Debug Details – Component Errors ${errors.value.length} #\n`;
        $textarea.value += `##########################\n`;
        $textarea.value += errorMessages;
      }
      if (payload.email) {
        // autofill emails
        let $emailInputs = $modal.querySelectorAll('[type="email"]');
        while (!$emailInputs) {
          console.debug('[openBugReport] getting $emailInputs…');
          await new Promise(resolve => setTimeout(resolve, 100));
          $emailInputs = $modal.querySelectorAll('[type="email"]');
        }
        console.debug('[openBugReport] $emailInputs', $emailInputs);
        $emailInputs.forEach($input => {
          $input.value = payload.email;
        });
      } else {
        // focus email input within bugreport_panel
        let $emailInput = $modal.querySelector('#bugreport_panel [type="email"]');
        while (!$emailInput) {
          console.debug('[openBugReport] getting $emailInput…');
          await new Promise(resolve => setTimeout(resolve, 100));
          $emailInput = $modal.querySelector('#bugreport_panel [type="email"]');
        }
        console.debug('[openBugReport] $emailInput', $emailInput);
        $emailInput.focus();
      }
      // select the radio to correctly show the bug report form
      let $myRadio: HTMLInputElement | null = $modal.querySelector('#optBugReport');
      while (!$myRadio) {
        await new Promise(resolve => setTimeout(resolve, 100));
        $myRadio = $modal.querySelector('#optBugReport');
      }
      $myRadio.checked = true;
      // show the correct form in the modal
      let $panels = $modal.querySelectorAll('.allpanels');
      while (!$panels) {
        await new Promise(resolve => setTimeout(resolve, 100));
        $panels = $modal.querySelectorAll('.allpanels');
      }
      $panels.forEach($panel => {
        if ($panel.id === 'bugreport_panel') $panel.style['display'] = 'block';
        else $panel.style['display'] = 'none';
      });
    } catch (error) {
      console.error('[openBugReport]', error);
    }
  }

  return {
    errors,
    removeErrorByIndex,
    removeErrorByRef,
    resetErrors,
    setError,
    openBugReport,
  };
});
