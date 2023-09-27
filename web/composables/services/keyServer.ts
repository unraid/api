import { request } from '~/composables/services/request';

const KeyServer = request.url('https://keys.lime-technology.com');

export interface StartTrialPayload {
  guid: string;
  timestamp: number; // timestamp in seconds
}
export interface StartTrialResponse {
  license?: string;
  trial?: string
}
export const startTrial = (payload: StartTrialPayload) => KeyServer
  .url('/account/trial')
  .formUrl(payload)
  .post();

export interface ValidateGuidPayload {
  purchaseable: true,
  registered: false,
  replaceable: false,
  upgradeable: false,
  upgradeAllowed: 'pro' | 'plus' | 'unleashed'[],
}
export const validateGuid = (payload: { guid: string }) => KeyServer
  .url('/validate/guid')
  .formUrl(payload)
  .post();
