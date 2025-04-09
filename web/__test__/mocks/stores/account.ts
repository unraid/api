import { ACCOUNT_CALLBACK } from '~/helpers/urls';
import { vi } from 'vitest';

import { useAccountStore } from '~/store/account';

vi.mock('~/store/account', () => {
  return {
    useAccountStore: vi.fn(() => ({
      // State
      accountAction: undefined,
      accountActionHide: false,
      accountActionStatus: 'ready',

      // Getters
      accountActionType: undefined,

      // Actions
      downgradeOs: vi.fn(),
      manage: vi.fn(),
      myKeys: vi.fn(),
      linkKey: vi.fn(),
      recover: vi.fn(),
      replace: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      trialExtend: vi.fn(),
      trialStart: vi.fn(),
      updateOs: vi.fn(),
      setAccountAction: vi.fn(),
      setConnectSignInPayload: vi.fn(),
      setQueueConnectSignOut: vi.fn(),
    })),
  };
});
