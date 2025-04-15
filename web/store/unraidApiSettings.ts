import { defineStore } from 'pinia';
import { useLazyQuery, useMutation } from '@vue/apollo-composable';

import type { SetupRemoteAccessInput } from '~/composables/gql/graphql';

import {
  GET_ALLOWED_ORIGINS,
  GET_REMOTE_ACCESS,
  SET_ADDITIONAL_ALLOWED_ORIGINS,
  SETUP_REMOTE_ACCESS,
} from '~/store/unraidApiSettings.fragment';

export const useUnraidApiSettingsStore = defineStore('unraidApiSettings', () => {
  const { load: loadOrigins, result: origins } = useLazyQuery(GET_ALLOWED_ORIGINS);

  const { mutate: mutateOrigins } = useMutation(SET_ADDITIONAL_ALLOWED_ORIGINS);
  const { load: loadRemoteAccess, result: remoteAccessResult } = useLazyQuery(GET_REMOTE_ACCESS);

  const { mutate: setupRemoteAccessMutation } = useMutation(SETUP_REMOTE_ACCESS);
  const getAllowedOrigins = async () => {
    await loadOrigins();
    return origins?.value?.extraAllowedOrigins ?? [];
  };

  const setAllowedOrigins = async (origins: string[]) => {
    const result = await mutateOrigins({ input: { origins } });
    return result?.data?.setAdditionalAllowedOrigins;
  };

  const getRemoteAccess = async () => {
    await loadRemoteAccess();
    return remoteAccessResult?.value?.remoteAccess;
  };

  const setupRemoteAccess = async (input: SetupRemoteAccessInput) => {
    const response = await setupRemoteAccessMutation({ input });
    return response?.data?.setupRemoteAccess;
  };

  return {
    getAllowedOrigins,
    setAllowedOrigins,
    getRemoteAccess,
    setupRemoteAccess,
  };
});
