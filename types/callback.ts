import type { CognitoUser, ChallengeName } from 'amazon-cognito-identity-js';
import type {
  ServerAccountCallbackSendPayload,
  ServerPurchaseCallbackSendPayload,
  ServerStateDataActionType,
} from '~/types/server';

/**
 * These user interfaces are mimiced from the Auth repo
 */
export interface UserInfo {
  'custom:ips_id'?: string;
  email?: string;
  email_verifed?: 'true' | 'false';
  preferred_username?: string;
  sub?: string;
  username?: string;
}
export interface CallbackSendPayload {
  server: ServerAccountCallbackSendPayload|ServerPurchaseCallbackSendPayload;
  type: ServerStateDataActionType;
}

export interface CallbackAction {
  apiKey?: string;
  keyUrl?: string;
  type: ServerStateDataActionType;
  user?: UserInfo;
}

export interface CallbackReceivePayload {
  actions: CallbackAction[];
  sender: string;
}