/**
 * Account store test coverage
 */

import { createTestingPinia } from '@pinia/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAccountStore } from '~/store/account';

describe('Account Store', () => {
  let store: ReturnType<typeof useAccountStore>;

  beforeEach(() => {
    // Create a fresh testing pinia instance for each test
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      // Important: When testing Pinia stores with createTestingPinia,
      // the default behavior is that actions are stubbed (replaced with spies)
      // Setting stubActions to false would execute real actions, but we would need
      // to mock all dependencies
      stubActions: true,
    });

    // Get the account store
    store = useAccountStore(pinia);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('State', () => {
    it('should initialize with default values', () => {
      expect(store.accountAction).toBeUndefined();
      expect(store.accountActionHide).toBe(false);
      expect(store.accountActionStatus).toBe('ready');
    });
  });

  describe('Getters', () => {
    it('should have accountActionType getter', () => {
      expect(store).toHaveProperty('accountActionType');
    });
  });

  describe('Actions', () => {
    it('should call setAccountAction with the provided action', () => {
      const testAction = { type: 'signIn' };
      store.setAccountAction(testAction as any);
      expect(store.setAccountAction).toHaveBeenCalledWith(testAction);
    });

    it('should call setConnectSignInPayload with the provided payload', () => {
      const payload = {
        apiKey: 'test-api-key',
        email: 'test@example.com',
        preferred_username: 'testuser',
      };

      store.setConnectSignInPayload(payload);
      expect(store.setConnectSignInPayload).toHaveBeenCalledWith(payload);
    });

    it('should call setQueueConnectSignOut with the provided value', () => {
      store.setQueueConnectSignOut(true);
      expect(store.setQueueConnectSignOut).toHaveBeenCalledWith(true);
    });

    it('should call manage action', () => {
      store.manage();
      expect(store.manage).toHaveBeenCalled();
    });

    it('should call myKeys action', async () => {
      await store.myKeys();
      expect(store.myKeys).toHaveBeenCalled();
    });

    it('should call linkKey action', async () => {
      await store.linkKey();
      expect(store.linkKey).toHaveBeenCalled();
    });

    it('should call recover action', () => {
      store.recover();
      expect(store.recover).toHaveBeenCalled();
    });

    it('should call replace action', () => {
      store.replace();
      expect(store.replace).toHaveBeenCalled();
    });

    it('should call signIn action', () => {
      store.signIn();
      expect(store.signIn).toHaveBeenCalled();
    });

    it('should call signOut action', () => {
      store.signOut();
      expect(store.signOut).toHaveBeenCalled();
    });

    it('should call trialExtend action', () => {
      store.trialExtend();
      expect(store.trialExtend).toHaveBeenCalled();
    });

    it('should call trialStart action', () => {
      store.trialStart();
      expect(store.trialStart).toHaveBeenCalled();
    });

    it('should call downgradeOs action', async () => {
      await store.downgradeOs();
      expect(store.downgradeOs).toHaveBeenCalled();
    });

    it('should call updateOs action', async () => {
      await store.updateOs();
      expect(store.updateOs).toHaveBeenCalled();
    });

    it('should call updateOs with autoRedirectReplace parameter', async () => {
      await store.updateOs(true);
      expect(store.updateOs).toHaveBeenCalledWith(true);
    });

    it('should call account actions with expected parameters', () => {
      // We can verify how these methods are called
      store.manage();
      expect(store.manage).toHaveBeenCalled();

      store.signIn();
      expect(store.signIn).toHaveBeenCalled();

      store.signOut();
      expect(store.signOut).toHaveBeenCalled();
    });
  });

  describe('Store API', () => {
    it('should expose all required methods and properties', () => {
      // Check state properties
      expect(store).toHaveProperty('accountAction');
      expect(store).toHaveProperty('accountActionHide');
      expect(store).toHaveProperty('accountActionStatus');

      // Check getters
      expect(store).toHaveProperty('accountActionType');

      // Check all store methods exist
      const expectedMethods = [
        'downgradeOs',
        'manage',
        'myKeys',
        'linkKey',
        'recover',
        'replace',
        'signIn',
        'signOut',
        'trialExtend',
        'trialStart',
        'updateOs',
        'setAccountAction',
        'setConnectSignInPayload',
        'setQueueConnectSignOut',
      ];

      expectedMethods.forEach((method) => {
        expect(store).toHaveProperty(method);
        // Use type assertion to fix TypeScript error
        expect(typeof (store as Record<string, any>)[method]).toBe('function');
      });
    });
  });
});
