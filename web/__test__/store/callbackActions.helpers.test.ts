import { describe, expect, it } from 'vitest';

import type { ExternalActions, QueryPayloads } from '@unraid/shared-callbacks';

import {
  getCallbackPayloadError,
  getRefreshServerStateOptions,
  hasAccountAction,
  hasKeyAction,
  hasUpdateOsAction,
  isAccountSignInAction,
  isAccountSignOutAction,
  isExternalCallbackPayload,
  isKeyAction,
  isSingleUpdateOsActionCallback,
  isUpdateOsAction,
  keyActionRefreshDelayMs,
  resolveCallbackCallsCompleted,
  resolveCallbackStatus,
  shouldRefreshServerState,
} from '~/store/callbackActions.helpers';

const signInAction = (): ExternalActions => ({
  type: 'signIn',
  apiKey: 'test-key',
  user: {
    email: 'test@example.com',
    preferred_username: 'test-user',
  },
});

const signOutAction = (): ExternalActions => ({
  type: 'signOut',
});

const keyAction = (
  type: 'activate' | 'purchase' | 'recover' | 'replace' = 'purchase'
): ExternalActions => ({
  type,
  keyUrl: 'https://example.com/test.key',
});

const updateOsAction = (type: 'updateOs' | 'downgradeOs' = 'updateOs'): ExternalActions => ({
  type,
  sha256: 'abc123',
});

describe('callbackActions.helpers', () => {
  describe('getCallbackPayloadError', () => {
    it('returns an error for missing payloads', () => {
      expect(getCallbackPayloadError(undefined)).toBe('Callback redirect type not present or incorrect');
    });

    it('returns an error for non-upc payloads', () => {
      const payload = {
        type: 'fromUpc',
        actions: [],
        sender: 'test',
      } as QueryPayloads;

      expect(getCallbackPayloadError(payload)).toBe('Callback redirect type not present or incorrect');
    });

    it('returns an error when actions are missing', () => {
      const payload = {
        type: 'forUpc',
        sender: 'test',
      } as QueryPayloads;

      expect(getCallbackPayloadError(payload)).toBe('Callback redirect type not present or incorrect');
    });

    it('returns undefined for valid external callback payloads', () => {
      const payload: QueryPayloads = {
        type: 'forUpc',
        actions: [keyAction()],
        sender: 'test',
      };

      expect(getCallbackPayloadError(payload)).toBeUndefined();
      expect(isExternalCallbackPayload(payload)).toBe(true);
    });
  });

  describe('action classification', () => {
    it('classifies key actions', () => {
      expect(isKeyAction(keyAction())).toBe(true);
      expect(isKeyAction(keyAction('activate'))).toBe(true);
      expect(isKeyAction(signInAction())).toBe(false);
    });

    it('classifies account actions', () => {
      expect(isAccountSignInAction(signInAction())).toBe(true);
      expect(isAccountSignOutAction(signOutAction())).toBe(true);
      expect(isAccountSignOutAction(keyAction())).toBe(false);
    });

    it('classifies update os actions', () => {
      expect(isUpdateOsAction(updateOsAction())).toBe(true);
      expect(isUpdateOsAction(keyAction())).toBe(false);
    });

    it('detects callback action groups', () => {
      const actions = [signInAction(), keyAction(), updateOsAction()];

      expect(hasAccountAction(actions)).toBe(true);
      expect(hasKeyAction(actions)).toBe(true);
      expect(hasUpdateOsAction(actions)).toBe(true);
    });
  });

  describe('shouldRefreshServerState', () => {
    it('refreshes once for key-only callbacks', () => {
      expect(shouldRefreshServerState([keyAction()])).toBe(true);
    });

    it('refreshes for account callbacks', () => {
      expect(shouldRefreshServerState([signInAction()])).toBe(true);
      expect(shouldRefreshServerState([signOutAction()])).toBe(true);
    });

    it('does not refresh for a single update callback', () => {
      expect(shouldRefreshServerState([updateOsAction()])).toBe(false);
      expect(isSingleUpdateOsActionCallback([updateOsAction('downgradeOs')])).toBe(true);
    });

    it('refreshes for mixed callbacks that include update os actions', () => {
      expect(shouldRefreshServerState([keyAction(), updateOsAction()])).toBe(true);
      expect(shouldRefreshServerState([signInAction(), updateOsAction()])).toBe(true);
    });
  });

  describe('getRefreshServerStateOptions', () => {
    it('does a delayed one-shot refresh for key callbacks', () => {
      expect(getRefreshServerStateOptions([keyAction()])).toEqual({
        poll: false,
        delayMs: keyActionRefreshDelayMs,
      });
      expect(getRefreshServerStateOptions([keyAction('replace')])).toEqual({
        poll: false,
        delayMs: keyActionRefreshDelayMs,
      });
      expect(getRefreshServerStateOptions([keyAction(), signInAction()])).toEqual({
        poll: false,
        delayMs: keyActionRefreshDelayMs,
      });
    });

    it('does an immediate one-shot refresh for account and non-key mixed update callbacks', () => {
      expect(getRefreshServerStateOptions([signInAction()])).toEqual({ poll: false });
      expect(getRefreshServerStateOptions([signInAction(), updateOsAction()])).toEqual({ poll: false });
      expect(getRefreshServerStateOptions([keyAction(), updateOsAction()])).toEqual({
        poll: false,
        delayMs: keyActionRefreshDelayMs,
      });
    });

    it('skips refresh for single update callbacks', () => {
      expect(getRefreshServerStateOptions([updateOsAction()])).toBeUndefined();
    });
  });

  describe('resolveCallbackStatus', () => {
    it('returns undefined when no actions are present', () => {
      expect(
        resolveCallbackStatus({
          actions: [],
          accountActionStatus: 'ready',
          keyInstallStatus: 'ready',
        })
      ).toBeUndefined();
    });

    it('returns success for successful key-only callbacks', () => {
      expect(
        resolveCallbackStatus({
          actions: [keyAction()],
          accountActionStatus: 'ready',
          keyInstallStatus: 'success',
        })
      ).toBe('success');
    });

    it('returns undefined while a key-only callback is still installing', () => {
      expect(
        resolveCallbackStatus({
          actions: [keyAction()],
          accountActionStatus: 'ready',
          keyInstallStatus: 'installing',
        })
      ).toBeUndefined();
    });

    it('returns error for failed key installs', () => {
      expect(
        resolveCallbackStatus({
          actions: [keyAction()],
          accountActionStatus: 'ready',
          keyInstallStatus: 'failed',
        })
      ).toBe('error');
    });

    it('returns success for successful account callbacks', () => {
      expect(
        resolveCallbackStatus({
          actions: [signInAction()],
          accountActionStatus: 'success',
          keyInstallStatus: 'ready',
        })
      ).toBe('success');
    });

    it('returns undefined while account callbacks are still pending', () => {
      expect(
        resolveCallbackStatus({
          actions: [signInAction()],
          accountActionStatus: 'waiting',
          keyInstallStatus: 'ready',
        })
      ).toBeUndefined();
    });

    it('returns error for failed account callbacks', () => {
      expect(
        resolveCallbackStatus({
          actions: [signOutAction()],
          accountActionStatus: 'failed',
          keyInstallStatus: 'ready',
        })
      ).toBe('error');
    });

    it('requires both key and account success for mixed callbacks without update os', () => {
      const actions = [keyAction(), signInAction()];

      expect(
        resolveCallbackStatus({
          actions,
          accountActionStatus: 'waiting',
          keyInstallStatus: 'success',
        })
      ).toBeUndefined();

      expect(
        resolveCallbackStatus({
          actions,
          accountActionStatus: 'success',
          keyInstallStatus: 'success',
        })
      ).toBe('success');
    });

    it('keeps update os callbacks pending after direct actions succeed', () => {
      const actions = [keyAction(), updateOsAction()];

      expect(
        resolveCallbackStatus({
          actions,
          accountActionStatus: 'ready',
          keyInstallStatus: 'success',
        })
      ).toBeUndefined();
    });

    it('prioritizes direct action failures', () => {
      expect(
        resolveCallbackStatus({
          actions: [keyAction(), updateOsAction()],
          accountActionStatus: 'ready',
          keyInstallStatus: 'failed',
        })
      ).toBe('error');
    });

    it('keeps single update callbacks pending for confirmation', () => {
      expect(
        resolveCallbackStatus({
          actions: [updateOsAction()],
          accountActionStatus: 'ready',
          keyInstallStatus: 'ready',
        })
      ).toBeUndefined();
    });

    it('returns undefined for unrecognized callback actions', () => {
      expect(
        resolveCallbackStatus({
          actions: [{ type: 'unknown' } as unknown as ExternalActions],
          accountActionStatus: 'ready',
          keyInstallStatus: 'ready',
        })
      ).toBeUndefined();
    });
  });

  describe('resolveCallbackCallsCompleted', () => {
    it('returns false while callback actions are still executing', () => {
      expect(
        resolveCallbackCallsCompleted({
          callbackActionsExecuting: true,
          callbackReconciliationPending: false,
        })
      ).toBe(false);
    });

    it('returns false while reconciliation is still pending', () => {
      expect(
        resolveCallbackCallsCompleted({
          callbackActionsExecuting: false,
          callbackReconciliationPending: true,
        })
      ).toBe(false);
    });

    it('returns false while both execution and reconciliation are pending', () => {
      expect(
        resolveCallbackCallsCompleted({
          callbackActionsExecuting: true,
          callbackReconciliationPending: true,
        })
      ).toBe(false);
    });

    it('returns true once callback actions and reconciliation are both settled', () => {
      expect(
        resolveCallbackCallsCompleted({
          callbackActionsExecuting: false,
          callbackReconciliationPending: false,
        })
      ).toBe(true);
    });
  });
});
