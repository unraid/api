import type {
  ExternalActions,
  ExternalKeyActions,
  ExternalPayload,
  ExternalSignIn,
  ExternalSignOut,
  ExternalUpdateOsAction,
  QueryPayloads,
} from '@unraid/shared-callbacks';

export type CallbackStatus = 'closing' | 'error' | 'loading' | 'ready' | 'success';
export type CallbackAccountStatus = 'failed' | 'ready' | 'success' | 'updating' | 'waiting';
export type CallbackKeyInstallStatus = 'failed' | 'installing' | 'ready' | 'success';
export interface CallbackRefreshServerStateOptions {
  delayMs?: number;
  poll: boolean;
}

export const keyActionRefreshDelayMs = 5000;

export const keyActionTypes = [
  'activate',
  'recover',
  'replace',
  'trialExtend',
  'trialStart',
  'purchase',
  'redeem',
  'renew',
  'upgrade',
] as const;

export const accountActionTypes = ['signIn', 'signOut', 'oemSignOut'] as const;
export const updateOsActionTypes = ['updateOs', 'downgradeOs'] as const;

const includesActionType = <TActionType extends string>(
  actionTypes: readonly TActionType[],
  actionType: string
): actionType is TActionType => actionTypes.includes(actionType as TActionType);

export const getCallbackPayloadError = (payload?: QueryPayloads): string | undefined => {
  if (!payload || payload.type !== 'forUpc' || !payload.actions?.length) {
    return 'Callback redirect type not present or incorrect';
  }

  return undefined;
};

export const isExternalCallbackPayload = (payload?: QueryPayloads): payload is ExternalPayload =>
  getCallbackPayloadError(payload) === undefined;

export const isKeyAction = (action: ExternalActions): action is ExternalKeyActions =>
  includesActionType(keyActionTypes, action.type);

export const isAccountSignInAction = (action: ExternalActions): action is ExternalSignIn =>
  action.type === 'signIn';

export const isAccountSignOutAction = (action: ExternalActions): action is ExternalSignOut =>
  action.type === 'signOut' || action.type === 'oemSignOut';

export const isUpdateOsAction = (action: ExternalActions): action is ExternalUpdateOsAction =>
  includesActionType(updateOsActionTypes, action.type);

export const hasKeyAction = (actions: ExternalActions[]): boolean => actions.some(isKeyAction);

export const hasAccountAction = (actions: ExternalActions[]): boolean =>
  actions.some((action) => isAccountSignInAction(action) || isAccountSignOutAction(action));

export const hasUpdateOsAction = (actions: ExternalActions[]): boolean => actions.some(isUpdateOsAction);

export const shouldRefreshServerState = (actions: ExternalActions[]): boolean =>
  hasKeyAction(actions) ||
  hasAccountAction(actions) ||
  (hasUpdateOsAction(actions) && actions.length > 1);

export const getRefreshServerStateOptions = (
  actions: ExternalActions[]
): CallbackRefreshServerStateOptions | undefined => {
  if (shouldRefreshServerState(actions)) {
    return hasKeyAction(actions) ? { poll: false, delayMs: keyActionRefreshDelayMs } : { poll: false };
  }

  return undefined;
};

export const isSingleUpdateOsActionCallback = (actions: ExternalActions[]): boolean =>
  actions.length === 1 && isUpdateOsAction(actions[0]);

interface ResolveCallbackStatusInput {
  actions: ExternalActions[];
  accountActionStatus: CallbackAccountStatus;
  keyInstallStatus: CallbackKeyInstallStatus;
}

export const resolveCallbackStatus = ({
  actions,
  accountActionStatus,
  keyInstallStatus,
}: ResolveCallbackStatusInput): CallbackStatus | undefined => {
  if (!actions.length) {
    return undefined;
  }

  if (
    (hasKeyAction(actions) && keyInstallStatus === 'failed') ||
    (hasAccountAction(actions) && accountActionStatus === 'failed')
  ) {
    return 'error';
  }

  const accountActionPending = hasAccountAction(actions) && accountActionStatus !== 'success';
  if (accountActionPending) {
    return undefined;
  }

  const keyActionPending = hasKeyAction(actions) && keyInstallStatus !== 'success';
  if (keyActionPending) {
    return undefined;
  }

  if (hasUpdateOsAction(actions)) {
    return undefined;
  }

  return hasKeyAction(actions) || hasAccountAction(actions) ? 'success' : undefined;
};
