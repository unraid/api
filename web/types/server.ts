import type { Config, PartialCloudFragment } from '~/composables/gql/graphql';
import type { Theme } from '~/store/theme';
import type { UserProfileLink } from '~/types/userProfile';

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
  | 'STARTER'
  | 'UNLEASHED'
  | 'LIFETIME'
  | undefined;

export type ServerOsVersionBranch = 'stable' | 'next' | 'preview' | 'test';
export type ServerconnectPluginInstalled = 'dynamix.unraid.net.plg' | 'dynamix.unraid.net.staging.plg' | 'dynamix.unraid.net.plg_installFailed' | 'dynamix.unraid.net.staging.plg_installFailed' | '';
export type ServerRebootType = 'thirdPartyDriversDownloading' | 'downgrade' | 'update' | '';

export interface DateFormatOption {
  format: string;
  display: string;
}

export interface TimeFormatOption {
  format: string;
  display: string;
}

export interface ServerDateTimeFormat {
  date: string;
  time: string;
}

export interface ServerUpdateOsResponse {
  version: string; // "6.13.0-beta0.27"
  name: string; // "Unraid 6.13.0-beta0.27"
  date: string; // "2023-12-13"
  isNewer: boolean; // false
  changelog?: string; // "https://raw.githubusercontent.com/unraid/docs/main/docs/unraid-os/release-notes/6.13.0-beta0.27.md"
  sha256?: string;
}

export interface Server {
  apiKey?: string;
  apiVersion?: string;
  avatar?: string;
  caseModel?: string;
  cloud?: PartialCloudFragment | undefined;
  combinedKnownOrigins?: string[];
  config?: Config | undefined;
  connectPluginInstalled?: ServerconnectPluginInstalled;
  connectPluginVersion?: string;
  csrf?: string;
  dateTimeFormat?: ServerDateTimeFormat;
  description?: string;
  deviceCount?: number;
  email?: string;
  expireTime?: number;
  flashBackupActivated?: boolean;
  flashProduct?: string;
  flashVendor?: string;
  guid?: string;
  inIframe?: boolean;
  keyfile?: string;
  lanIp?: string;
  license?: string;
  locale?: string;
  name?: string;
  osVersion?: string;
  osVersionBranch?: ServerOsVersionBranch;
  rebootType?: ServerRebootType;
  rebootVersion?: string;
  registered?: boolean;
  regDev?: number;
  regGen?: number;
  regGuid?: string;
  regTm?: number;
  regTo?: string;
  regTy?: string;
  regExp?: number;
  regUpdatesExpired?: boolean;
  site?: string;
  state?: ServerState;
  theme?: Theme | undefined;
  updateOsResponse?: ServerUpdateOsResponse;
  uptime?: number;
  username?: string;
  wanFQDN?: string;
  wanIp?: string;
}

export interface ServerAccountCallbackSendPayload {
  apiVersion?: string;
  caseModel?: string;
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
  osVersionBranch?: ServerOsVersionBranch;
  registered: boolean;
  regExp?: number;
  regGen?: number;
  regGuid?: string;
  regTy?: string;
  regUpdatesExpired?: boolean;
  site?: string;
  state: ServerState;
  wanFQDN?: string;
}

export type ServerKeyTypeForPurchase = 'Basic' | 'Plus' | 'Pro' | 'Starter' | 'Trial' | 'Unleashed';

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
  osVersionBranch?: ServerOsVersionBranch;
  registered: boolean;
  regExp?: number;
  regUpdatesExpired?: boolean;
  state: ServerState;
  site: string;
}

export type ServerStateDataKeyActions = 'purchase' | 'redeem' | 'upgrade' | 'recover' | 'renew' | 'replace' | 'trialExtend' | 'trialStart' | 'updateOs';

export type ServerStateDataAccountActions = 'signIn' | 'signOut' | 'troubleshoot';

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
  heading: string;
  message: string;
  error?: ServerStateDataError | boolean;
  withKey?: boolean; // @todo potentially remove
}
