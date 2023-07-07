import { KeyIcon } from '@heroicons/vue/24/solid';
import { Theme } from '~/store/theme';
import { UserProfileLink } from '~/types/userProfile';

export type ServerState = 'BASIC'
  | 'PLUS'
  | 'PRO'
  | 'TRIAL'
  | 'EEXPIRED'
  | 'ENOKEYFILE'
  | 'EGUID'
  | 'EGUID1'
  | 'ETRIAL'
  | 'ENOKEYFILE2'
  | 'ENOKEYFILE1'
  | 'ENOFLASH'
  | 'ENOFLASH1'
  | 'ENOFLASH2'
  | 'ENOFLASH3'
  | 'ENOFLASH4'
  | 'ENOFLASH5'
  | 'ENOFLASH6'
  | 'ENOFLASH7'
  | 'EBLACKLISTED'
  | 'EBLACKLISTED1'
  | 'EBLACKLISTED2'
  | 'ENOCONN'
  | undefined;
export interface Server {
  apiKey?: string;
  avatar?: string;
  csrf?: string;
  description?: string;
  deviceCount?: number;
  email?: string;
  expireTime?: number;
  flashProduct?: string;
  flashVendor?: string;
  guid?: string;
  inIframe: boolean;
  keyfile?: string;
  lanIp?: string;
  license?: string;
  locale?: string;
  name?: string;
  pluginInstalled?: boolean;
  registered?: boolean;
  regGen?: number;
  regGuid?: string;
  site?: string;
  state?: ServerState;
  theme: Theme;
  uptime?: number;
  username?: string;
  wanFQDN?: string;
  wanIp?: string;
}

export interface ServerAccountCallbackSendPayload {
  description?: string;
  deviceCount?: number;
  expireTime?: number;
  flashProduct?: string;
  flashVendor?: string;
  guid?: string;
  inIframe: boolean;
  keyfile?: string;
  lanIp?: string;
  locale?: string;
  name?: string;
  registered: boolean;
  regGen?: number;
  regGuid?: string;
  site?: string;
  state: ServerState;
  wanFQDN?: string;
}

export type ServerKeyTypeForPurchase = 'Basic'|'Plus'|'Pro'|'Trial';

export interface ServerPurchaseCallbackSendPayload {
  deviceCount: number;
  email: string;
  guid: string;
  inIframe: boolean;
  keyTypeForPurchase: ServerKeyTypeForPurchase;
  locale: string;
  registered: boolean;
  state: ServerState;
  site: string;
}

export type ServerStateDataKeyActions = 'purchase'|'redeem'|'upgrade'|'recover'|'replace'|'trialExtend'|'trialStart';

export type ServerStateDataAccountActions = 'signIn'|'signOut'|'troubleshoot';

export type ServerStateDataActionType = ServerStateDataKeyActions | ServerStateDataAccountActions;

export interface ServerStateDataAction extends UserProfileLink {
  name: ServerStateDataActionType;
}

export interface ServerStateDataError {
  heading: string;
  message: string;
  reAuthFix: boolean; // @todo potentially remove
}

export interface ServerStateData {
  actions?: ServerStateDataAction[] | undefined;
  humanReadable: string; // @todo create interface of ENUM to string mapping
  heading?: string;
  message?: string;
  error?: ServerStateDataError | boolean;
  withKey?: boolean; // @todo potentially remove
}