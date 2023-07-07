import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import { defineStore, createPinia, setActivePinia } from 'pinia';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export type SignIn = 'signIn';
export type SignOut = 'signOut';
export type OemSignOut = 'oemSignOut';
export type Troubleshoot = 'troubleshoot';
export type Recover = 'recover';
export type Replace = 'replace';
export type TrialExtend = 'trialExtend';
export type TrialStart = 'trialStart';
export type Purchase = 'purchase';
export type Redeem = 'redeem';
export type Upgrade = 'upgrade';

export type AccountAction = SignIn | SignOut | OemSignOut | Troubleshoot;
export type AccountKeyAction =  Recover | Replace | TrialExtend | TrialStart;
export type PurchaseAction = Purchase | Redeem | Upgrade;

export type ServerAction = AccountAction | AccountKeyAction | PurchaseAction;

export interface ServerData {
  description?: string;
  deviceCount?: number;
  expireTime?: number;
  flashProduct?: string;
  flashVendor?: string;
  guid?: string;
  keyfile?: string;
  locale?: string;
  name?: string;
  registered: boolean;
  regGen?: number;
  regGuid?: string;
  state: string;
  wanFQDN?: string;
}

export interface ServerPayload {
  server: ServerData;
  type: ServerAction;
}

export interface ExternalSignIn {
  type: SignIn;
  apiKey: string;
  user: UserInfo;
}
export interface ExternalSignOut {
  type: SignOut | OemSignOut;
}
export interface ExternalKeyActions {
  type: PurchaseAction | AccountKeyAction;
  keyUrl: string;
}

export type ExternalActions =
  | ExternalSignIn
  | ExternalSignOut
  | ExternalKeyActions;

export type UpcActions = ServerPayload;

export interface ExternalPayload {
  actions: ExternalActions[];
  sender: string;
  type: 'forUpc';
}
export interface UpcPayload {
  actions: UpcActions[];
  sender: string;
  type: 'fromUpc';
}

export type SendPayloads = ExternalActions[] | UpcActions[];

export type QueryPayloads = ExternalPayload | UpcPayload;

export interface UserInfo {
  'custom:ips_id'?: string;
  email?: string;
  email_verifed?: 'true' | 'false';
  preferred_username?: string;
  sub?: string;
  username?: string;
}

interface CallbackActionsStore {
  redirectToCallbackType: (decryptedData: QueryPayloads) => void;
  encryptionKey: string;
  sendType: 'fromUpc' | 'forUpc';
}

export const useCallbackStoreGeneric = (
  useCallbackActions: () => CallbackActionsStore,
) =>
  defineStore('callback', () => {
    const callbackActions = useCallbackActions();
    const encryptionKey = 'Uyv2o8e*FiQe8VeLekTqyX6Z*8XonB';
    const defaultSendType = 'fromUpc';

    const send = (url: string, payload: SendPayloads, sendType?: 'fromUpc' | 'forUpc') => {
      console.debug('[callback.send]');
      const stringifiedData = JSON.stringify({
        actions: [
          ...payload,
        ],
        sender: window.location.href,
        type: sendType ?? defaultSendType,
      });
      const encryptedMessage = AES.encrypt(stringifiedData, encryptionKey).toString();
      // build and go to url
      const destinationUrl = new URL(url);
      destinationUrl.searchParams.set('data', encodeURI(encryptedMessage));
      console.debug('[callback.send]', encryptedMessage, destinationUrl);
      window.location.href = destinationUrl.toString();
      return;
    };

    const watcher = () => {
      console.debug('[callback.watcher]');
      const currentUrl = new URL(window.location.toString());
      const callbackValue = decodeURI(currentUrl.searchParams.get('data') ?? '');
      console.debug('[callback.watcher]', { callbackValue });
      if (!callbackValue) {
        return console.debug('[callback.watcher] no callback to handle');
      }

      const decryptedMessage = AES.decrypt(callbackValue, encryptionKey);
      const decryptedData: QueryPayloads = JSON.parse(decryptedMessage.toString(Utf8));
      console.debug('[callback.watcher]', decryptedMessage, decryptedData);
      // Parse the data and perform actions
      callbackActions.redirectToCallbackType(decryptedData);
    };

    return {
      send,
      watcher,
    };
  });
