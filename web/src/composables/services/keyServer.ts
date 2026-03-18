import { request } from '~/composables/services/request';

const KeyServer = request.url('https://keys.lime-technology.com');

export type ValidateGuidLicenseType =
  | 'Trial'
  | 'Basic'
  | 'Plus'
  | 'Pro'
  | 'Starter'
  | 'Unleashed'
  | 'Lifetime';

export type ValidateGuidSku =
  | 'new-basic'
  | 'new-plus'
  | 'new-pro'
  | 'new-starter'
  | 'new-unleashed'
  | 'new-lifetime'
  | 'upgrade-basic-plus'
  | 'upgrade-basic-pro'
  | 'upgrade-plus-pro'
  | 'upgrade-basic-unleashed'
  | 'upgrade-plus-unleashed'
  | 'upgrade-starter-unleashed'
  | 'upgrade-starter-lifetime'
  | 'upgrade-unleashed-lifetime'
  | 'renew-starter'
  | 'renew-unleashed'
  | 'extension';

export interface ValidateGuidResponse {
  registered: boolean;
  purchasable: boolean;
  upgradable: boolean;
  upgradeAllowed: ValidateGuidLicenseType[];
  allowedPurchaseableSkus: ValidateGuidSku[];
  replaceable: boolean;
  linked: boolean;
  highestRegType: ValidateGuidLicenseType | null;
  updateExpiration: string | null;
  isUpdatesExpired: boolean | null;
  cognitoId?: string;
  hasNewerKeyfile?: true;
  updatesRenewable?: boolean;
  renewalPreviewDate?: string;
  manualExtensionAllowed?: boolean;
}
export interface ValidateGuidPayload {
  guid: string;
  keyfile?: string;
}
export const validateGuid = async (payload: ValidateGuidPayload): Promise<ValidateGuidResponse> =>
  await KeyServer.url('/validate/guid').formUrl(payload).post().json();

export interface KeyLatestPayload {
  keyfile: string;
}
export interface KeyLatestResponse {
  license: string;
}
export const keyLatest = async (payload: KeyLatestPayload): Promise<KeyLatestResponse> =>
  await KeyServer.url('/key/latest').formUrl(payload).post().json();
