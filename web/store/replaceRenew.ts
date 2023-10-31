import {
  CheckCircleIcon,
  XCircleIcon,
  ShieldExclamationIcon,
} from '@heroicons/vue/24/solid';
import { defineStore, createPinia, setActivePinia } from 'pinia';
import type { WretchError } from 'wretch';

import {
  keyLatest,
  validateGuid,
  type KeyLatestResponse,
  type ValidateGuidResponse,
} from '~/composables/services/keyServer';
// import { WebguiNotify } from '~/composables/services/webgui';
import { useCallbackStore } from '~/store/callbackActions';
// import { useInstallKeyStore } from '~/store/installKey';
import { useServerStore } from '~/store/server';
import type { UiBadgeProps } from '~/types/ui/badge';
import BrandLoadingWhite from '~/components/Brand/LoadingWhite.vue';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export interface UiBadgePropsExtended extends UiBadgeProps {
  text?: string;
}

interface CachedValidationResponse extends ValidateGuidResponse {
  key: string;
  timestamp: number;
}

export const REPLACE_CHECK_LOCAL_STORAGE_KEY = 'unraidReplaceCheck';

export const useReplaceRenewStore = defineStore('replaceRenewCheck', () => {
  const callbackStore = useCallbackStore();
  // const installKeyStore = useInstallKeyStore();
  const serverStore = useServerStore();

  const guid = computed(() => serverStore.guid);
  const keyfile = computed(() => serverStore.keyfile);
  const keyfileShort = computed(() => keyfile.value?.slice(-10));

  const error = ref<{
    name: string;
    message: string;
    stack?: string | undefined;
    cause?: unknown;
  } | null>(null);

  const renewStatus = ref<'checking' | 'error' | 'installing' | 'installed' | 'ready'>('ready');
  const setRenewStatus = (status: typeof renewStatus.value) => {
    renewStatus.value = status;
  };

  const replaceStatus = ref<'checking' | 'eligible' | 'error' | 'ineligible' | 'ready'>(guid.value ? 'ready' : 'error');
  const setReplaceStatus = (status: typeof replaceStatus.value) => {
    replaceStatus.value = status;
  };
  const replaceStatusOutput = computed((): UiBadgePropsExtended | undefined => {
    // text values are translated in the component
    switch (replaceStatus.value) {
      case 'checking':
        return {
          color: 'gamma',
          icon: BrandLoadingWhite,
          text: 'Checking...',
        };
      case 'eligible':
        return {
          color: 'green',
          icon: CheckCircleIcon,
          text: 'Eligible',
        };
      case 'error':
        return {
          color: 'red',
          icon: ShieldExclamationIcon,
          text: error.value?.message || 'Unknown error',
        };
      case 'ineligible':
        return {
          color: 'red',
          icon: XCircleIcon,
          text: 'Ineligible',
        };
      case 'ready':
      default:
        return undefined;
    }
  });
  /**
   * onBeforeMount checks the timestamp of the validation response and purges it if it's too old
   */
  const validationResponse = ref<CachedValidationResponse | undefined>(
    sessionStorage.getItem(REPLACE_CHECK_LOCAL_STORAGE_KEY)
      ? JSON.parse(sessionStorage.getItem(REPLACE_CHECK_LOCAL_STORAGE_KEY) as string)
      : undefined
  );

  const purgeValidationResponse = () => {
    validationResponse.value = undefined;
    sessionStorage.removeItem(REPLACE_CHECK_LOCAL_STORAGE_KEY);
  };

  const check = async () => {
    if (!guid.value) {
      setReplaceStatus('error');
      error.value = { name: 'Error', message: 'Flash GUID required to check replacement status' };
    }
    if (!keyfile.value) {
      setReplaceStatus('error');
      error.value = { name: 'Error', message: 'Keyfile required to check replacement status' };
    }

    try {
      setReplaceStatus('checking');
      error.value = null;
      /**
       * If the session already has a validation response, use that instead of making a new request
       */
      let response: ValidateGuidResponse | undefined;
      if (validationResponse.value) {
        response = validationResponse.value;
      } else {
        response = await validateGuid({
          guid: guid.value,
          keyfile: keyfile.value,
        });
      }

      setReplaceStatus(response?.replaceable ? 'eligible' : 'ineligible');

      /** cache the response to prevent repeated POSTs in the session */
      if ((replaceStatus.value === 'eligible' || replaceStatus.value === 'ineligible') && !validationResponse.value) {
        sessionStorage.setItem(REPLACE_CHECK_LOCAL_STORAGE_KEY, JSON.stringify({
          key: keyfileShort.value,
          timestamp: Date.now(),
          ...response,
        }));
      }

      if (response?.hasNewerKeyfile) {
        setRenewStatus('checking');

        const keyLatestResponse: KeyLatestResponse = await keyLatest({
          keyfile: keyfile.value,
        });

        if (keyLatestResponse?.license) {
          callbackStore.send(
            window.location.origin,
            [{
              keyUrl: keyLatestResponse.license,
              type: 'renew',
            }],
            false,
            'forUpc',
          );
          // setRenewStatus('installing');

          // await installKeyStore.install({
          //   keyUrl: keyLatestResponse.license,
          //   type: 'renew',
          // }).then(() => {
          //   setRenewStatus('installed');
          //   // reset the validation response so we can check again on the subsequent page load. Will also prevent the keyfile from being installed again on page refresh.
          //   purgeValidationResponse();
          //   /** @todo this doesn't work */
          //   WebguiNotify({
          //       cmd: 'add',
          //       csrf_token: serverStore.csrf,
          //       e: 'Keyfile Renewed and Installed (event)',
          //       s: 'Keyfile Renewed and Installed (subject)',
          //       d: 'While license keys are perpetual, certain keyfiles are not. Your keyfile has automatically been renewed and installed in the background. Thanks for your support!',
          //       m: 'Your keyfile has automatically been renewed and installed in the background. Thanks for your support!',
          //     })
          // });
        }
      }
    } catch (err) {
      const catchError = err as WretchError;
      setReplaceStatus('error');
      error.value = catchError?.message ? catchError : { name: 'Error', message: 'Unknown error' };
      console.error('[ReplaceCheck.check]', catchError);
    }
  };

  /**
   * If we already have a validation response, set the status to eligible or ineligible
   */
  onBeforeMount(() => {
    if (validationResponse.value) {
      // ensure the response timestamp is still valid and not old due to someone keeping their browser open
      const currentTime = new Date().getTime();
      const cacheDuration = import.meta.env.DEV ? 30000 : 604800000; // 30 seconds for testing, 7 days for prod
      // also checking if the keyfile is the same as the one we have in the store
      if (currentTime - validationResponse.value.timestamp > cacheDuration || !validationResponse.value.key || validationResponse.value.key !== keyfileShort.value) {
        // cache is expired, purge it
        purgeValidationResponse();
      } else {
        // if the cache is valid return the existing response
        setReplaceStatus(validationResponse.value?.replaceable ? 'eligible' : 'ineligible');
      }
    }
  });

  return {
    // state
    renewStatus,
    replaceStatus,
    replaceStatusOutput,
    // actions
    check,
    setReplaceStatus,
    setRenewStatus,
  };
});
