import type { SetupRemoteAccessInput } from "~/composables/gql/graphql";
import { useUnraidApiStore } from "~/store/unraidApi";
import {
  GET_ALLOWED_ORIGINS,
  GET_REMOTE_ACCESS,
  SETUP_REMOTE_ACCESS,
  SET_ADDITIONAL_ALLOWED_ORIGINS,
} from "~/store/unraidApiSettings.fragment";

export const useUnraidApiSettingsStore = defineStore(
  "unraidApiSettings",
  () => {
    const { unraidApiClient } = toRefs(useUnraidApiStore());

    const getAllowedOrigins = async () => {
      const origins = await unraidApiClient.value?.query({
        query: GET_ALLOWED_ORIGINS,
      });

      return origins?.data?.extraAllowedOrigins ?? [];
    }

    const setAllowedOrigins = async (origins: string[]) => {
      const newOrigins = await unraidApiClient.value?.mutate({
        mutation: SET_ADDITIONAL_ALLOWED_ORIGINS,
        variables: { input: { origins } },
      });

      return newOrigins?.data?.setAdditionalAllowedOrigins;
    };

    const getRemoteAccess = async () => {
      const remoteAccess = await unraidApiClient.value?.query({
        query: GET_REMOTE_ACCESS,
      });

      return remoteAccess?.data?.remoteAccess;
    }

    const setupRemoteAccess = async (input: SetupRemoteAccessInput) => {
      const response = await unraidApiClient.value?.mutate({
        mutation: SETUP_REMOTE_ACCESS,
        variables: { input },
      });
      return response?.data?.setupRemoteAccess;
    };

    return {
      getAllowedOrigins,
      setAllowedOrigins,
      getRemoteAccess,
      setupRemoteAccess,
    };
  }
);
