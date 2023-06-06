import type {
  ServerAccountCallbackSendPayload,
  ServerPurchaseCallbackSendPayload,
  ServerStateDataActionType,
} from '~/types/server';

export interface CallbackSendPayload extends ServerAccountCallbackSendPayload, ServerPurchaseCallbackSendPayload {
  type: ServerStateDataActionType;
}