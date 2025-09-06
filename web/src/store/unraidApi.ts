import { computed, ref, watch } from 'vue';
// import { logErrorMessages } from '@vue/apollo-util';
import { defineStore } from 'pinia';

import { ArrowPathIcon } from '@heroicons/vue/24/solid';
import { client } from '~/helpers/create-apollo-client';

import type { ApolloClient as ApolloClientType, NormalizedCacheObject } from '@apollo/client';
import type { UserProfileLink } from '~/types/userProfile';

import { WebguiUnraidApiCommand } from '~/composables/services/webgui';
import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';

export const useUnraidApiStore = defineStore('unraidApi', () => {
  const errorsStore = useErrorsStore();
  const serverStore = useServerStore();
  const unraidApiClient = ref<ApolloClientType<NormalizedCacheObject> | null>(client);

  // const unraidApiErrors = ref<any[]>([]);
  const unraidApiStatus = ref<'connecting' | 'offline' | 'online' | 'restarting'>('connecting');
  const prioritizeCorsError = ref(false); // Ensures we don't overwrite this specific error message with a non-descriptive network error message

  const offlineError = computed(() => {
    if (unraidApiStatus.value === 'offline') {
      return new Error('The Unraid API is currently offline.');
    }
  });
  // maintains an error in global store while api is offline
  watch(
    offlineError,
    (error) => {
      const errorId = 'unraidApiOffline';
      if (error) {
        errorsStore.setError({
          heading: 'Warning: API is offline!',
          message: error.message,
          ref: errorId,
          level: 'warning',
          type: 'unraidApiState',
        });
      } else {
        errorsStore.removeErrorByRef(errorId);
      }
    },
    { immediate: true }
  );

  const unraidApiRestartAction = computed((): UserProfileLink | undefined => {
    const { connectPluginInstalled, stateDataError } = serverStore;
    if (unraidApiStatus.value !== 'offline' || !connectPluginInstalled || stateDataError) {
      return undefined;
    }
    return {
      click: () => restartUnraidApiClient(),
      emphasize: true,
      icon: ArrowPathIcon,
      text: 'Restart unraid-api',
    };
  });

  /**
   * Automatically called when an apiKey is unset in the serverStore
   */
  const closeUnraidApiClient = async () => {
    if (!unraidApiClient.value) {
      return;
    }
    if (unraidApiClient.value) {
      await unraidApiClient.value.clearStore();
      unraidApiClient.value.stop();
      // (wsLink.value as any).subscriptionClient.close(); // needed if we start using subscriptions
    }
    unraidApiClient.value = null;
    unraidApiStatus.value = 'offline';
  };
  /**
   * Can both start and restart the unraid-api depending on it's current status
   */
  const restartUnraidApiClient = async () => {
    const command = unraidApiStatus.value === 'offline' ? 'start' : 'restart';
    unraidApiStatus.value = 'restarting';
    try {
      await WebguiUnraidApiCommand({
        csrf_token: serverStore.csrf,
        command,
      });
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (typeof error === 'string') {
        errorMessage = error.toUpperCase();
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      errorsStore.setError({
        heading: 'Error: unraid-api restart',
        message: errorMessage,
        level: 'error',
        ref: 'restartUnraidApiClient',
        type: 'request',
      });
    }
  };

  return {
    unraidApiClient,
    unraidApiStatus,
    offlineError,
    prioritizeCorsError,
    unraidApiRestartAction,
    closeUnraidApiClient,
    restartUnraidApiClient,
  };
});
