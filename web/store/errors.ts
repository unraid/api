import { ref } from 'vue';
import { defineStore } from 'pinia';

import { OBJ_TO_STR } from '~/helpers/functions';

import type { BrandButtonProps } from '@unraid/ui';
import type { Server } from '~/types/server';

/**
 * Uses the shared global Pinia instance from ~/store/globalPinia.ts
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
import '~/store/globalPinia';

export type ErrorType =
  | 'account'
  | 'callback'
  | 'installKey'
  | 'request'
  | 'server'
  | 'serverState'
  | 'unraidApiGQL'
  | 'unraidApiState';

export interface Error {
  actions?: BrandButtonProps[];
  debugServer?: Server;
  forumLink?: boolean;
  heading: string; // if adding new errors be sure to add translations key value pairs
  level: 'error' | 'info' | 'warning';
  message: string;
  ref?: string;
  supportLink?: boolean;
  type: ErrorType;
}

export const useErrorsStore = defineStore('errors', () => {
  const errors = ref<Error[]>([]);

  // const displayedErrors = computed(() => errors.value.filter(error => error.type === 'server' || error.type === 'serverState'));

  const removeErrorByIndex = (index: number) => {
    errors.value = errors.value.filter((_error, i) => i !== index);
  };

  const removeErrorByRef = (ref: string) => {
    errors.value = errors.value.filter((error) => error?.ref !== ref);
  };

  const resetErrors = () => {
    errors.value = [];
  };

  const setError = (error: Error) => {
    console.error('[setError]', error);
    errors.value.push(error);
  };

  interface TroubleshootPayload {
    email: string;
    includeUnraidApiLogs: boolean;
  }

  const openTroubleshoot = async (payload: TroubleshootPayload) => {
    try {
      // @ts-expect-error – `FeedbackButton` will be included in 6.10.4+ DefaultPageLayout
      await FeedbackButton();
      // once the modal is visible we need to select the radio to correctly show the bug report form
      let $modal = document.querySelector('.sweet-alert.visible');
      while (!$modal) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        $modal = document.querySelector('.sweet-alert.visible');
      }
      // autofill errors into the bug report form
      if (errors.value.length) {
        let $textarea: HTMLInputElement | null = $modal.querySelector('#troubleshootDetails');
        while (!$textarea) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          $textarea = $modal.querySelector('#troubleshootDetails');
        }
        const errorMessages = errors.value
          .map((error, index) => {
            const index1 = index + 1;
            let message = `• Error ${index1}: ${error.heading}\n`;
            message += `• Error ${index1} Message: ${error.message}\n`;
            message += `• Error ${index1} Level: ${error.level}\n`;
            message += `• Error ${index1} Type: ${error.type}\n`;
            if (error.ref) {
              message += `• Error ${index1} Ref: ${error.ref}\n`;
            }
            if (error.debugServer) {
              message += `• Error ${index1} Debug Server:\n${OBJ_TO_STR(error.debugServer)}\n`;
            }
            return message;
          })
          .join('\n***************\n');
        $textarea.value += '\n##########################\n';
        $textarea.value += `# Debug Details – Component Errors ${errors.value.length} #\n`;
        $textarea.value += '##########################\n';
        $textarea.value += errorMessages;
      }
      // autofill emails
      let $emailInput: HTMLInputElement | null = $modal.querySelector('#troubleshootEmail');
      while (!$emailInput) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        $emailInput = $modal.querySelector('#troubleshootEmail');
      }
      if (payload.email) {
        $emailInput.value = payload.email;
      } else {
        $emailInput.focus();
      }
      // select the radio to correctly show the bug report form
      let $myRadio: HTMLInputElement | null = $modal.querySelector('#optTroubleshoot');
      while (!$myRadio) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        $myRadio = $modal.querySelector('#optTroubleshoot');
      }
      $myRadio.checked = true;
      // show the correct form in the modal
      let $panels = $modal.querySelectorAll('.allpanels');
      while (!$panels) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        $panels = $modal.querySelectorAll('.allpanels');
      }
      $panels.forEach(($panel: Element) => {
        if ($panel.id === 'troubleshoot_panel') {
          // @ts-expect-error - the webgui feedback modal has different "panel" elements, so we'll automatically select the troubleshooting option for the user
          $panel.style.display = 'block';
        } else {
          // @ts-expect-error - the webgui feedback modal has different "panel" elements, so we'll automatically select the troubleshooting option for the user
          $panel.style.display = 'none';
        }
      });
    } catch (error) {
      console.error('[openTroubleshoot]', error);
    }
  };

  return {
    errors,
    removeErrorByIndex,
    removeErrorByRef,
    resetErrors,
    setError,
    openTroubleshoot,
  };
});
