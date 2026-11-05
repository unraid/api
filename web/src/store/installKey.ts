import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import type { ExternalKeyActions } from '@unraid/shared-callbacks';

import { WebguiInstallKey } from '~/composables/services/webgui';
import { useErrorsStore } from '~/store/errors';

interface InstallKeySuccessResponse {
  message?: string;
  status: string;
}

interface InstallKeyErrorResponse {
  error: string;
}

const isInstallKeySuccessResponse = (response: unknown): response is InstallKeySuccessResponse =>
  typeof response === 'object' &&
  response !== null &&
  !Array.isArray(response) &&
  'status' in response &&
  typeof response.status === 'string' &&
  (!('message' in response) || typeof response.message === 'string') &&
  !('error' in response);

const isInstallKeyErrorResponse = (response: unknown): response is InstallKeyErrorResponse =>
  typeof response === 'object' &&
  response !== null &&
  'error' in response &&
  typeof response.error === 'string';

const parseInstallKeyErrorMessage = (message: string): string | undefined => {
  try {
    const parsed: unknown = JSON.parse(message);
    return isInstallKeyErrorResponse(parsed) ? parsed.error : undefined;
  } catch {
    return undefined;
  }
};

const getInstallKeyErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'json' in error) {
    const errorJson = error.json;
    if (isInstallKeyErrorResponse(errorJson)) {
      return errorJson.error;
    }
  }
  if (typeof error === 'string') {
    return parseInstallKeyErrorMessage(error) ?? error.toUpperCase();
  }
  if (error instanceof Error) {
    return parseInstallKeyErrorMessage(error.message) ?? error.message;
  }
  return 'Unknown error';
};

const rethrowInstallRequestError = (error: unknown): never => {
  throw error;
};

export const useInstallKeyStore = defineStore('installKey', () => {
  const errorsStore = useErrorsStore();

  const keyInstallStatus = ref<'failed' | 'installing' | 'ready' | 'success'>('ready');

  const keyAction = ref<ExternalKeyActions>();
  const keyActionType = computed(() => keyAction.value?.type);
  const keyUrl = computed(() => keyAction.value?.keyUrl);
  /**
   * Extracts key type from key url. Works for both .key and .unkey.
   */
  const keyType = computed((): string | undefined => {
    if (!keyUrl.value) {
      return undefined;
    }
    const parts = keyUrl.value.split('/');
    return parts[parts.length - 1].replace(/\.key|\.unkey/g, '');
  });

  const install = async (action: ExternalKeyActions) => {
    console.log('[installKey.install]', action);
    keyInstallStatus.value = 'installing';
    keyAction.value = action;

    if (!keyUrl.value) {
      keyInstallStatus.value = 'failed';
      return console.error('[install] no key to install');
    }

    try {
      const installResponse: unknown = await WebguiInstallKey.query({ url: keyUrl.value })
        .get()
        .error('Error', rethrowInstallRequestError)
        .error('TypeError', rethrowInstallRequestError)
        .json();
      console.log('[install] WebguiInstallKey installResponse', installResponse);

      if (!isInstallKeySuccessResponse(installResponse)) {
        const errorMessage = isInstallKeyErrorResponse(installResponse)
          ? installResponse.error
          : 'Invalid response from InstallKey.php';
        throw new Error(errorMessage);
      }

      keyInstallStatus.value = 'success';
    } catch (error) {
      console.error('[install] WebguiInstallKey error', error);
      keyInstallStatus.value = 'failed';
      errorsStore.setError({
        heading: 'Failed to install key',
        message: getInstallKeyErrorMessage(error),
        level: 'error',
        ref: 'installKey',
        type: 'installKey',
      });
    }
  };

  return {
    // State
    keyInstallStatus,
    // getters
    keyActionType,
    keyType,
    keyUrl,
    // Actions
    install,
  };
});
