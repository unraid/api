import { KeyIcon } from '@heroicons/vue/24/solid';
import { UserProfileLink } from '~/types/userProfile';

export enum ServerState {
  BASIC = 'BASIC',
  PLUS = 'PLUS',
  PRO = 'PRO',
  TRIAL = 'TRIAL',
  EEXPIRED = 'EEXPIRED',
  ENOKEYFILE = 'ENOKEYFILE',
  EGUID = 'EGUID',
  EGUID1 = 'EGUID1',
  ETRIAL = 'ETRIAL',
  ENOKEYFILE2 = 'ENOKEYFILE2',
  ENOKEYFILE1 = 'ENOKEYFILE1',
  ENOFLASH = 'ENOFLASH',
  EBLACKLISTED = 'EBLACKLISTED',
  EBLACKLISTED1 = 'EBLACKLISTED1',
  EBLACKLISTED2 = 'EBLACKLISTED2',
  ENOCONN = 'ENOCONN',
}
export interface Server {
  // state?: ServerState;
  state?: string;
  name?: string;
  description?: string;
  deviceCount?: number;
  flashProduct?: string;
  flashVendor?: string;
  guid?: string;
  regGuid?: string;
  site?: string;
  wanFQDN?: string;
  regGen?: number;
  license?: string;
  keyfile?: string;
  locale?: string;
  uptime?: number;
  expireTime?: number;
  lanIp?: string;
}

// @todo convert to object with text and click payload
export type ServerStateDataActionType = 'signIn'|'signOut'|'purchase'|'redeem'|'upgrade'|'recover'|'replace'|'trialExtend'|'trialStart';

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
  heading: string;
  message: string;
  error?: ServerStateDataError;
  withKey?: boolean; // @todo potentially remove
}