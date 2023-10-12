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
import { defineStore } from 'pinia';

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
export type Renew = 'renew';
export type Upgrade = 'upgrade';
export type UpdateOs = 'updateOs';
export type AccountActionTypes = Troubleshoot | SignIn | SignOut | OemSignOut;
export type AccountKeyActionTypes = Recover | Replace | TrialExtend | TrialStart | UpdateOs;
export type PurchaseActionTypes = Purchase | Redeem | Renew | Upgrade;

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
  keyfile?: string;
  locale?: string;
  name?: string;
  osVersion?: string;
  osVersionBranch?: 'stable' | 'next' | 'preview' | 'test';
  registered: boolean;
  regExp?: number;
  regUpdatesExpired?: boolean;
  regGen?: number;
  regGuid?: string;
  regTy?: string;
  state: string;
  wanFQDN?: string;
}

export interface UserInfo {
  'custom:ips_id'?: string;
  'custom:preview_releases'?: string;
  'custom:test_releases'?: string;
  email?: string;
  email_verifed?: 'true' | 'false';
  preferred_username?: string;
  sub?: string;
  username?: string;
  /**
   * @param identities {string} JSON string containing @type Identity[]
   */
  identities: string;
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
  sha256: string;
}

export interface ServerPayload {
  type: ServerActionTypes;
  server: ServerData;
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

    const send = (url: string, payload: SendPayloads, newTab?: boolean, sendType?: string) => {
      console.debug('[callback.send]');
      const stringifiedData = JSON.stringify({
        actions: [...payload],
        sender: window.location.href.replace('/Tools/Update', '/Main'),
        type: sendType ?? callbackActions.sendType,
      });
      const encryptedMessage = AES.encrypt(
        stringifiedData,
        callbackActions.encryptionKey,
      ).toString();
      /**
       * Build and go to url
       * @note – /Tools/Update redirects to account.unraid.net/server/update-os we need to prevent any callback sends to that url to prevent redirect loops
       */
      const destinationUrl = new URL(url.replace('/Tools/Update', '/Main'));
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
