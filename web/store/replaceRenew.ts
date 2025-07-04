/**
 * Change the trigger of this to happen on when on Tools > Registration
 *
 * New key replacement, should happen also on server side.
 * Cron to run hourly, check on how many days are left until regExp…within X days then allow request to be done
 */
import { computed, h, ref } from 'vue';
import { defineStore } from 'pinia';

import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ShieldExclamationIcon,
  XCircleIcon,
} from '@heroicons/vue/24/solid';
import { BrandLoading } from '@unraid/ui';

import type { BadgeProps } from '@unraid/ui';
import type { ValidateGuidResponse } from '~/composables/services/keyServer';
import type { WretchError } from 'wretch';

import { validateGuid } from '~/composables/services/keyServer';
import { useServerStore } from '~/store/server';

/**
 * Uses the shared global Pinia instance from ~/store/globalPinia.ts
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
import '~/store/globalPinia';

export interface BadgePropsExtended extends BadgeProps {
  text?: string;
}

interface CachedValidationResponse extends ValidateGuidResponse {
  key: string;
  timestamp: number;
}

const BrandLoadingIcon = () => h(BrandLoading, { variant: 'white' });

export const REPLACE_CHECK_LOCAL_STORAGE_KEY = 'unraidReplaceCheck';

export const useReplaceRenewStore = defineStore('replaceRenewCheck', () => {
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

  const keyLinkedStatus = ref<'checking' | 'linked' | 'notLinked' | 'error' | 'ready'>('ready');
  const setKeyLinked = (value: typeof keyLinkedStatus.value) => {
    keyLinkedStatus.value = value;
  };
  const keyLinkedOutput = computed((): BadgePropsExtended => {
    // text values are translated in the component
    switch (keyLinkedStatus.value) {
      case 'checking':
        return {
          variant: 'gray',
          icon: BrandLoadingIcon,
          text: 'Checking...',
        };
      case 'linked':
        return {
          variant: 'green',
          icon: CheckCircleIcon,
          text: 'Linked',
        };
      case 'notLinked':
        return {
          variant: 'yellow',
          icon: ExclamationCircleIcon,
          text: 'Not Linked',
        };
      case 'error':
        return {
          variant: 'red',
          icon: ShieldExclamationIcon,
          text: error.value?.message || 'Unknown error',
        };
      case 'ready':
      default:
        return {
          variant: 'gray',
          icon: ExclamationCircleIcon,
          text: 'Unknown',
        };
    }
  });

  const renewStatus = ref<'checking' | 'error' | 'installing' | 'installed' | 'ready'>('ready');
  const setRenewStatus = (status: typeof renewStatus.value) => {
    renewStatus.value = status;
  };

  const replaceStatus = ref<'checking' | 'eligible' | 'error' | 'ineligible' | 'ready'>(
    guid.value ? 'ready' : 'error'
  );
  const setReplaceStatus = (status: typeof replaceStatus.value) => {
    replaceStatus.value = status;
  };
  const replaceStatusOutput = computed((): BadgePropsExtended | undefined => {
    // text values are translated in the component
    switch (replaceStatus.value) {
      case 'checking':
        return {
          variant: 'gray',
          icon: BrandLoadingIcon,
          text: 'Checking...',
        };
      case 'eligible':
        return {
          variant: 'green',
          icon: CheckCircleIcon,
          text: 'Eligible',
        };
      case 'error':
        return {
          variant: 'red',
          icon: ShieldExclamationIcon,
          text: error.value?.message || 'Unknown error',
        };
      case 'ineligible':
        return {
          variant: 'red',
          icon: XCircleIcon,
          text: 'Ineligible for self-replacement',
        };
      case 'ready':
      default:
        return undefined;
    }
  });
  /**
   * validateCache checks the timestamp of the validation response and purges it if it's too old
   */
  const validationResponse = ref<CachedValidationResponse | undefined>(
    sessionStorage.getItem(REPLACE_CHECK_LOCAL_STORAGE_KEY)
      ? JSON.parse(sessionStorage.getItem(REPLACE_CHECK_LOCAL_STORAGE_KEY) as string)
      : undefined
  );

  const purgeValidationResponse = async () => {
    validationResponse.value = undefined;
    await sessionStorage.removeItem(REPLACE_CHECK_LOCAL_STORAGE_KEY);
  };

  const validateCache = async () => {
    if (!validationResponse.value) {
      return;
    }
    // ensure the response timestamp is still valid and not old due to someone keeping their browser open
    const currentTime = new Date().getTime();
    const cacheDuration = import.meta.env.DEV ? 30000 : 604800000; // 30 seconds for testing, 7 days for prod

    const cacheExpired = currentTime - validationResponse.value.timestamp > cacheDuration;
    const cacheResponseNoKey = !validationResponse.value.key;
    const cacheResponseKeyMismatch = validationResponse.value.key !== keyfileShort.value; // also checking if the keyfile is the same as the one we have in the store

    const purgeCache = cacheExpired || cacheResponseNoKey || cacheResponseKeyMismatch;

    if (purgeCache) {
      await purgeValidationResponse();
    }
  };

  const check = async (skipCache: boolean = false) => {
    if (!guid.value) {
      setReplaceStatus('error');
      error.value = { name: 'Error', message: 'Flash GUID required to check replacement status' };
    }
    if (!keyfile.value) {
      setReplaceStatus('error');
      error.value = { name: 'Error', message: 'Keyfile required to check replacement status' };
    }

    try {
      if (skipCache) {
        await purgeValidationResponse();
      } else {
        // validate the cache first - will purge if it's too old
        await validateCache();
      }

      setKeyLinked('checking');
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
      setKeyLinked(response?.linked ? 'linked' : 'notLinked');

      /** cache the response to prevent repeated POSTs in the session */
      if (
        (replaceStatus.value === 'eligible' || replaceStatus.value === 'ineligible') &&
        !validationResponse.value
      ) {
        sessionStorage.setItem(
          REPLACE_CHECK_LOCAL_STORAGE_KEY,
          JSON.stringify({
            key: keyfileShort.value,
            timestamp: Date.now(),
            ...response,
          })
        );
      }

      // if (response?.hasNewerKeyfile) {
      //   setRenewStatus('checking');

      //   const keyLatestResponse: KeyLatestResponse = await keyLatest({
      //     keyfile: keyfile.value,
      //   });

      //   if (keyLatestResponse?.license) {
      //     callbackStore.send(
      //       window.location.href,
      //       [{
      //         keyUrl: keyLatestResponse.license,
      //         type: 'renew',
      //       }],
      //       undefined,
      //       'forUpc',
      //     );
      //   }
      // }
    } catch (err) {
      const catchError = err as WretchError;
      setReplaceStatus('error');
      error.value = catchError?.message ? catchError : { name: 'Error', message: 'Unknown error' };
      console.error('[ReplaceCheck.check]', catchError);
    }
  };

  return {
    // state
    keyLinkedStatus,
    keyLinkedOutput,
    renewStatus,
    replaceStatus,
    replaceStatusOutput,
    // actions
    check,
    purgeValidationResponse,
    setReplaceStatus,
    setRenewStatus,
    error,
  };
});
