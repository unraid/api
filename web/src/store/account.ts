import { computed } from 'vue';
import { defineStore } from 'pinia';

import { ACCOUNT_CALLBACK } from '~/helpers/urls';

import type {
  DowngradeOs,
  MyKeys,
  ServerData,
  SignIn,
  SignOut,
  UpdateOs,
} from '@unraid/shared-callbacks';

import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import { useCallbackActionsStore } from '~/store/callbackActions';
import { useServerStore } from '~/store/server';

type AccountCallbackActionType = MyKeys | SignIn | SignOut | DowngradeOs | UpdateOs;

export const useAccountStore = defineStore('account', () => {
  const callbackStore = useCallbackActionsStore();
  const activationCodeStore = useActivationCodeDataStore();
  const serverStore = useServerStore();

  const activationCode = computed(() => activationCodeStore.activationCode);
  const serverAccountPayload = computed(() => serverStore.serverAccountPayload);
  const serverReplacePayload = computed(() => serverStore.serverReplacePayload);
  const inIframe = computed(() => serverStore.inIframe);
  const sendType = computed(() => callbackStore.sendType);

  const buildServerPayload = (payload: ServerData): ServerData => {
    const activationCodeValue = activationCode.value;
    if (!activationCodeValue) {
      return payload;
    }

    const { code, partner, system } = activationCodeValue;
    const activationCodeData = {
      ...(code ? { code } : {}),
      ...(partner ? { partner } : {}),
      ...(system ? { system } : {}),
    };

    if (!Object.keys(activationCodeData).length) {
      return payload;
    }

    return {
      ...payload,
      activationCodeData,
    };
  };

  const buildAccountActionPayload = (type: AccountCallbackActionType, payload?: ServerData) => [
    {
      server: buildServerPayload(payload ?? serverAccountPayload.value),
      type,
    },
  ];

  const sendAccountAction = (
    type: AccountCallbackActionType,
    actionType?: 'newTab' | 'replace',
    payload?: ServerData
  ) => {
    return callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      buildAccountActionPayload(type, payload),
      actionType ?? (inIframe.value ? 'newTab' : undefined),
      sendType.value
    );
  };

  const generateMyKeysUrl = () =>
    callbackStore.generateUrl(
      ACCOUNT_CALLBACK.toString(),
      buildAccountActionPayload('myKeys'),
      sendType.value,
      undefined
    );

  const downgradeOs = async (autoRedirectReplace?: boolean) => {
    return sendAccountAction(
      'downgradeOs',
      inIframe.value ? 'newTab' : autoRedirectReplace ? 'replace' : undefined
    );
  };

  const myKeys = () => sendAccountAction('myKeys');
  const manage = () => myKeys();
  const recover = () => myKeys();
  const replace = () => myKeys();
  const replaceTpm = () => sendAccountAction('myKeys', undefined, serverReplacePayload.value);
  const signIn = () => {
    sendAccountAction('signIn');
  };
  const signOut = () => {
    sendAccountAction('signOut');
  };
  const trialExtend = () => myKeys();
  const trialStart = () => myKeys();

  const updateOs = async (autoRedirectReplace?: boolean) => {
    return sendAccountAction(
      'updateOs',
      inIframe.value ? 'newTab' : autoRedirectReplace ? 'replace' : undefined
    );
  };

  return {
    downgradeOs,
    manage,
    myKeys,
    recover,
    replace,
    replaceTpm,
    signIn,
    signOut,
    trialExtend,
    trialStart,
    updateOs,
    generateMyKeysUrl,
    openInNewTab: computed(() => inIframe.value),
  };
});
