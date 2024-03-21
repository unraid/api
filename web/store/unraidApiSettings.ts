import type { SetupRemoteAccessInput } from "~/composables/gql/graphql";
import { useUnraidApiStore } from "~/store/unraidApi";
import {
  SETUP_REMOTE_ACCESS,
  SET_ADDITIONAL_ALLOWED_ORIGINS,
} from "~/store/unraidApiSettings.fragment";

export const useUnraidApiSettingsStore = defineStore(
  "unraidApiSettings",
  () => {
    const { unraidApiClient } = toRefs(useUnraidApiStore());

    const setAllowedOrigins = async (origins: string[]) => {
      const newOrigins = await unraidApiClient.value?.mutate({
        mutation: SET_ADDITIONAL_ALLOWED_ORIGINS,
        variables: { input: { origins } },
      });

      return newOrigins?.data?.setAdditionalAllowedOrigins;
    };

    const setupRemoteAccess = async (input: SetupRemoteAccessInput) => {
      const response = await unraidApiClient.value?.mutate({
        mutation: SETUP_REMOTE_ACCESS,
        variables: { input },
      });
      return response?.data?.setupRemoteAccess;
    };

    return {
      setAllowedOrigins,
      setupRemoteAccess,
    };
  }
);
