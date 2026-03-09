import { describe, expect, it } from 'vitest';

import type { ExternalActions, QueryPayloads } from '@unraid/shared-callbacks';

import {
  getCallbackPayloadError,
  hasAccountAction,
  hasKeyAction,
  hasUpdateOsAction,
  isAccountSignInAction,
  isAccountSignOutAction,
  isExternalCallbackPayload,
  isKeyAction,
  isSingleUpdateOsActionCallback,
  isUpdateOsAction,
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

const keyAction = (type: 'purchase' | 'recover' | 'replace' = 'purchase'): ExternalActions => ({
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
    it('does not refresh for key-only callbacks', () => {
      expect(shouldRefreshServerState([keyAction()])).toBe(false);
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

  describe('resolveCallbackStatus', () => {
    it('returns undefined when no actions are present', () => {
      expect(
        resolveCallbackStatus({
          actions: [],
          accountActionStatus: 'ready',
          keyInstallStatus: 'ready',
          refreshServerStateStatus: 'ready',
        })
      ).toBeUndefined();
    });

    it('returns success for successful key-only callbacks', () => {
      expect(
        resolveCallbackStatus({
          actions: [keyAction()],
          accountActionStatus: 'ready',
          keyInstallStatus: 'success',
          refreshServerStateStatus: 'ready',
        })
      ).toBe('success');
    });

    it('returns undefined while a key-only callback is still installing', () => {
      expect(
        resolveCallbackStatus({
          actions: [keyAction()],
          accountActionStatus: 'ready',
          keyInstallStatus: 'installing',
          refreshServerStateStatus: 'ready',
        })
      ).toBeUndefined();
    });

    it('returns error for failed key installs', () => {
      expect(
        resolveCallbackStatus({
          actions: [keyAction()],
          accountActionStatus: 'ready',
          keyInstallStatus: 'failed',
          refreshServerStateStatus: 'ready',
        })
      ).toBe('error');
    });

    it('returns success for successful account callbacks', () => {
      expect(
        resolveCallbackStatus({
          actions: [signInAction()],
          accountActionStatus: 'success',
          keyInstallStatus: 'ready',
          refreshServerStateStatus: 'done',
        })
      ).toBe('success');
    });

    it('returns undefined while account callbacks are still pending', () => {
      expect(
        resolveCallbackStatus({
          actions: [signInAction()],
          accountActionStatus: 'waiting',
          keyInstallStatus: 'ready',
          refreshServerStateStatus: 'ready',
        })
      ).toBeUndefined();
    });

    it('returns error for failed account callbacks', () => {
      expect(
        resolveCallbackStatus({
          actions: [signOutAction()],
          accountActionStatus: 'failed',
          keyInstallStatus: 'ready',
          refreshServerStateStatus: 'ready',
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
          refreshServerStateStatus: 'refreshing',
        })
      ).toBeUndefined();

      expect(
        resolveCallbackStatus({
          actions,
          accountActionStatus: 'success',
          keyInstallStatus: 'success',
          refreshServerStateStatus: 'done',
        })
      ).toBe('success');
    });

    it('waits for refresh completion when update os actions are present', () => {
      const actions = [keyAction(), updateOsAction()];

      expect(
        resolveCallbackStatus({
          actions,
          accountActionStatus: 'ready',
          keyInstallStatus: 'success',
          refreshServerStateStatus: 'refreshing',
        })
      ).toBeUndefined();

      expect(
        resolveCallbackStatus({
          actions,
          accountActionStatus: 'ready',
          keyInstallStatus: 'success',
          refreshServerStateStatus: 'done',
        })
      ).toBe('success');
    });

    it('returns error when update os polling times out', () => {
      expect(
        resolveCallbackStatus({
          actions: [updateOsAction()],
          accountActionStatus: 'ready',
          keyInstallStatus: 'ready',
          refreshServerStateStatus: 'timeout',
        })
      ).toBe('error');
    });

    it('prioritizes action failures over refresh state', () => {
      expect(
        resolveCallbackStatus({
          actions: [keyAction(), updateOsAction()],
          accountActionStatus: 'ready',
          keyInstallStatus: 'failed',
          refreshServerStateStatus: 'done',
        })
      ).toBe('error');
    });
  });
});
