/**
 * This file is used to handle callbacks from the server.
 * It is used in the following apps:
 * - auth
 * - craft-unraid
 * - connect @todo
 * - connect-components
 */
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import { createPinia, defineStore, setActivePinia } from 'pinia';

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
export type UpdateOs = 'updateOs';
export type AccountActionTypes = Troubleshoot | SignIn | SignOut | OemSignOut;
export type AccountKeyActionTypes = Recover | Replace | TrialExtend | TrialStart | UpdateOs;
export type PurchaseActionTypes = Purchase | Redeem | Upgrade;

export type ServerActionTypes = AccountActionTypes | AccountKeyActionTypes | PurchaseActionTypes;

/**
 * Represents a server, payload comes from the server to account.unraid.net
 */
export interface ServerData {
  description?: string;
  deviceCount?: number;
  expireTime?: number;
  flashProduct?: string;
  flashVendor?: string;
  guid?: string;
  includeNext?: boolean;
  keyfile?: string;
  locale?: string;
  name?: string;
  registered: boolean;
  regGen?: number;
  regGuid?: string;
  state: string;
  wanFQDN?: string;
}

export interface UserInfo {
  'custom:ips_id'?: string;
  email?: string;
  email_verifed?: 'true' | 'false';
  preferred_username?: string;
  sub?: string;
  username?: string;
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
  type: PurchaseActionTypes | AccountKeyActionTypes;
  keyUrl: string;
}

export interface ExternalUpdateOsAction {
  type: UpdateOs;
  releaseHash: string;
}

export interface ServerPayload {
  type: ServerActionTypes;
  server: ServerData;
  includeNext?: boolean;
}

export interface ServerTroubleshoot {
  type: Troubleshoot;
  server: ServerData;
}

export type ExternalActions = ExternalSignIn | ExternalSignOut | ExternalKeyActions | ExternalUpdateOsAction;

export type UpcActions = ServerPayload | ServerTroubleshoot;

export type SendPayloads = ExternalActions[] | UpcActions[];

/**
 * Payload containing all actions that are sent from account.unraid.net to the server
 */
export interface ExternalPayload {
  type: 'forUpc';
  actions: ExternalActions[];
  sender: string;
}

/**
 * Payload containing all actions that are sent from a server to account.unraid.net
 */
export interface UpcPayload {
  actions: UpcActions[];
  sender: string;
  type: 'fromUpc';
}

export type QueryPayloads = ExternalPayload | UpcPayload;

export interface CallbackActionsStore {
  saveCallbackData: (decryptedData: QueryPayloads) => void;
  encryptionKey: string;
  sendType: 'fromUpc' | 'forUpc';
}

export const useCallbackStoreGeneric = (
  useCallbackActions: () => CallbackActionsStore
) =>
  defineStore('callback', () => {
    const callbackActions = useCallbackActions();
    const send = (url: string, payload: SendPayloads, newTab = false) => {
      console.debug('[callback.send]');
      const stringifiedData = JSON.stringify({
        actions: [...payload],
        sender: window.location.href,
        type: callbackActions.sendType,
      });
      const encryptedMessage = AES.encrypt(
        stringifiedData,
        callbackActions.encryptionKey,
      ).toString();
      // build and go to url
      const destinationUrl = new URL(url);
      destinationUrl.searchParams.set('data', encodeURI(encryptedMessage));
      console.debug('[callback.send]', encryptedMessage, destinationUrl);
      if (newTab) {
        window.open(destinationUrl.toString(), '_blank');
        return;
      }
      window.location.href = destinationUrl.toString();
    };

    const watcher = () => {
      console.debug('[callback.watcher]');
      const currentUrl = new URL(window.location.toString());
      const callbackValue = decodeURI(currentUrl.searchParams.get('data') ?? '');
      console.debug('[callback.watcher]', { callbackValue });
      if (!callbackValue) {
        return console.debug('[callback.watcher] no callback to handle');
      }

      const decryptedMessage = AES.decrypt(callbackValue, callbackActions.encryptionKey);
      const decryptedData: QueryPayloads = JSON.parse(decryptedMessage.toString(Utf8));
      console.debug('[callback.watcher]', decryptedMessage, decryptedData);
      // Parse the data and perform actions
      callbackActions.saveCallbackData(decryptedData);
    };

    return {
      send,
      watcher,
    };
  });
