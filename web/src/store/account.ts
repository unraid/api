import { computed } from 'vue';
import { defineStore } from 'pinia';

import { ACCOUNT_CALLBACK } from '~/helpers/urls';

import type { DowngradeOs, MyKeys, SignIn, SignOut, UpdateOs } from '@unraid/shared-callbacks';

import { useCallbackActionsStore } from '~/store/callbackActions';
import { useServerStore } from '~/store/server';

type AccountCallbackActionType = MyKeys | SignIn | SignOut | DowngradeOs | UpdateOs;

export const useAccountStore = defineStore('account', () => {
  const callbackStore = useCallbackActionsStore();
  const serverStore = useServerStore();

  const serverCallbackPayload = computed(() => serverStore.serverCallbackPayload);
  const inIframe = computed(() => serverStore.inIframe);
  const sendType = computed(() => callbackStore.sendType);

  const buildAccountActionPayload = (type: AccountCallbackActionType) => [
    {
      server: {
        ...serverCallbackPayload.value,
      },
      type,
    },
  ];

  const sendAccountAction = (type: AccountCallbackActionType, actionType?: 'newTab' | 'replace') => {
    return callbackStore.send(
      ACCOUNT_CALLBACK.toString(),
      buildAccountActionPayload(type),
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
  const recover = () => myKeys();
  const replace = () => myKeys();
  const replaceTpm = () => myKeys();
  const signIn = () => {
    sendAccountAction('signIn');
  };
  const signOut = () => {
    sendAccountAction('signOut');
  };
  const trialExtend = () => myKeys();

  const updateOs = async (autoRedirectReplace?: boolean) => {
    return sendAccountAction(
      'updateOs',
      inIframe.value ? 'newTab' : autoRedirectReplace ? 'replace' : undefined
    );
  };

  return {
    downgradeOs,
    myKeys,
    recover,
    replace,
    replaceTpm,
    signIn,
    signOut,
    trialExtend,
    updateOs,
    generateMyKeysUrl,
    openInNewTab: computed(() => inIframe.value),
  };
});
