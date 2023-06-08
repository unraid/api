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

export interface AuthUser extends CognitoUser {
  attributes: UserInfo;
  username?: string;
  preferredMFA: ChallengeName;
  signInUserSession: {
    accessToken: {
      jwtToken: string;
    };
    idToken: {
      jwtToken: string;
    };
    refreshToken: {
      token: string;
    };
  };
}

export interface CallbackSendPayload extends ServerAccountCallbackSendPayload, ServerPurchaseCallbackSendPayload {
  type: ServerStateDataActionType;
}

export interface CallbackAction {
  keyUrl?: string;
  type: ServerStateDataActionType;
  user?: AuthUser;
}

export interface CallbackReceivePayload {
  actions: CallbackAction[];
  sender: string;
}