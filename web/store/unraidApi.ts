import {
  type ApolloClient as ApolloClientType,
  type InMemoryCache as InMemoryCacheType,
} from "@apollo/client";
import { ArrowPathIcon } from "@heroicons/vue/24/solid";
// import { logErrorMessages } from '@vue/apollo-util';
import { defineStore, createPinia, setActivePinia } from "pinia";
import type { UserProfileLink } from "~/types/userProfile";

import { WebguiUnraidApiCommand } from "~/composables/services/webgui";
import { useErrorsStore } from "~/store/errors";
import { useServerStore } from "~/store/server";

import "~/helpers/create-apollo-client";

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useUnraidApiStore = defineStore("unraidApi", () => {
  const errorsStore = useErrorsStore();
  const serverStore = useServerStore();
  const unraidApiClient = ref<ApolloClientType<InMemoryCacheType> | null>(null);
  watch(unraidApiClient, (newVal) => {
    if (newVal) {
      const apiResponse = serverStore.fetchServerFromApi();
      if (apiResponse) {
        // we have a response, so we're online
        unraidApiStatus.value = "online";
      }
    }
  });

  // const unraidApiErrors = ref<any[]>([]);
  const unraidApiStatus = ref<
    "connecting" | "offline" | "online" | "restarting"
  >("offline");
  const prioritizeCorsError = ref(false); // Ensures we don't overwrite this specific error message with a non-descriptive network error message

  const unraidApiRestartAction = computed((): UserProfileLink | undefined => {
    const { connectPluginInstalled, stateDataError } = serverStore;
    if (
      unraidApiStatus.value !== "offline" ||
      !connectPluginInstalled ||
      stateDataError
    ) {
      return undefined;
    }
    return {
      click: () => restartUnraidApiClient(),
      emphasize: true,
      icon: ArrowPathIcon,
      text: "Restart unraid-api",
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
    unraidApiStatus.value = "offline";
  };
  /**
   * Can both start and restart the unraid-api depending on it's current status
   */
  const restartUnraidApiClient = async () => {
    const command = unraidApiStatus.value === "offline" ? "start" : "restart";
    unraidApiStatus.value = "restarting";
    try {
      await WebguiUnraidApiCommand({
        csrf_token: serverStore.csrf,
        command,
      });
    } catch (error) {
      let errorMessage = "Unknown error";
      if (typeof error === "string") {
        errorMessage = error.toUpperCase();
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      errorsStore.setError({
        heading: "Error: unraid-api restart",
        message: errorMessage,
        level: "error",
        ref: "restartUnraidApiClient",
        type: "request",
      });
    }
  };

  return {
    unraidApiClient,
    unraidApiStatus,
    prioritizeCorsError,
    unraidApiRestartAction,
    closeUnraidApiClient,
    restartUnraidApiClient,
  };
});
