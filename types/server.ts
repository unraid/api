import { Theme } from '~/store/theme';
import { UserProfileLink } from '~/types/userProfile';

export interface ServerStateConfigStatus {
  error?: 'INVALID' | 'NO_KEY_SERVER' | 'UNKNOWN_ERROR' | 'WITHDRAWN';
  valid: boolean;
}
export interface ServerStateCloudStatus {
  error: string | null;
}

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

export type ServerconnectPluginInstalled = 'dynamix.unraid.net.plg' | 'dynamix.unraid.net.staging.plg' | 'dynamix.unraid.net.plg_installFailed' | 'dynamix.unraid.net.staging.plg_installFailed' | '';
export interface Server {
  apiKey?: string;
  apiVersion?: string;
  avatar?: string;
  cloud?: ServerStateCloudStatus;
  config?: ServerStateConfigStatus | undefined;
  connectPluginInstalled?: ServerconnectPluginInstalled;
  connectPluginVersion?: string;
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
  osVersion?: string;
  registered?: boolean;
  regGen?: number;
  regGuid?: string;
  site?: string;
  state?: ServerState;
  theme: Theme | undefined;
  uptime?: number;
  username?: string;
  wanFQDN?: string;
  wanIp?: string;
}

export interface ServerAccountCallbackSendPayload {
  apiVersion?: string;
  connectPluginVersion?: string;
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
  osVersion?: string;
  registered: boolean;
  regGen?: number;
  regGuid?: string;
  site?: string;
  state: ServerState;
  wanFQDN?: string;
}

export type ServerKeyTypeForPurchase = 'Basic'|'Plus'|'Pro'|'Trial';

export interface ServerPurchaseCallbackSendPayload {
  apiVersion?: string;
  connectPluginVersion?: string;
  deviceCount: number;
  email: string;
  guid: string;
  inIframe: boolean;
  keyTypeForPurchase: ServerKeyTypeForPurchase;
  locale: string;
  osVersion?: string;
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
