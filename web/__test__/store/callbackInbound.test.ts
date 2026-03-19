import { createPinia, setActivePinia } from 'pinia';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExternalSignIn } from '@unraid/shared-callbacks';

import { useCallbackInboundStore } from '~/store/callbackInbound';

const {
  mockSetError,
  mockInstall,
  mockSetUpdateOsAction,
  mockActOnUpdateOsAction,
  mockSignInMutate,
  mockSignOutMutate,
  mockLogErrorMessages,
} = vi.hoisted(() => ({
  mockSetError: vi.fn(),
  mockInstall: vi.fn(),
  mockSetUpdateOsAction: vi.fn(),
  mockActOnUpdateOsAction: vi.fn(),
  mockSignInMutate: vi.fn(),
  mockSignOutMutate: vi.fn(),
  mockLogErrorMessages: vi.fn(),
}));

vi.mock('@vue/apollo-util', () => ({
  logErrorMessages: mockLogErrorMessages,
}));

vi.mock('@vue/apollo-composable', () => {
  const useMutation = vi.fn();

  return {
    useMutation,
  };
});

vi.mock('~/store/errors', () => ({
  useErrorsStore: () => ({
    setError: mockSetError,
  }),
}));

vi.mock('~/store/installKey', () => ({
  useInstallKeyStore: () => ({
    install: mockInstall,
  }),
}));

vi.mock('~/store/updateOsActions', () => ({
  useUpdateOsActionsStore: () => ({
    setUpdateOsAction: mockSetUpdateOsAction,
    actOnUpdateOsAction: mockActOnUpdateOsAction,
  }),
}));

describe('Callback Inbound Store', () => {
  let store: ReturnType<typeof useCallbackInboundStore>;
  const originalConsoleError = console.error;

  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    console.error = vi.fn();

    const { useMutation } = await import('@vue/apollo-composable');
    let callCount = 0;
    vi.mocked(useMutation).mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return {
          mutate: mockSignOutMutate,
        };
      }
      return {
        mutate: mockSignInMutate,
      };
    });

    store = useCallbackInboundStore();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('routes key actions to key install', async () => {
    await store.executeAction({
      type: 'purchase',
      keyUrl: 'https://example.com/pro.key',
    });

    expect(mockInstall).toHaveBeenCalledWith({
      type: 'purchase',
      keyUrl: 'https://example.com/pro.key',
    });
  });

  it('routes update actions to update store', async () => {
    await store.executeAction({
      type: 'updateOs',
      sha256: 'sha-update',
    });

    expect(mockSetUpdateOsAction).toHaveBeenCalledWith({
      type: 'updateOs',
      sha256: 'sha-update',
    });
    expect(mockActOnUpdateOsAction).toHaveBeenCalledWith(false);

    await store.executeAction({
      type: 'downgradeOs',
      sha256: 'sha-downgrade',
    });

    expect(mockSetUpdateOsAction).toHaveBeenCalledWith({
      type: 'downgradeOs',
      sha256: 'sha-downgrade',
    });
    expect(mockActOnUpdateOsAction).toHaveBeenCalledWith(true);
  });

  it('executes sign-in inbound action', async () => {
    mockSignInMutate.mockResolvedValueOnce({
      data: {
        connectSignIn: true,
      },
    });

    const signInAction: ExternalSignIn = {
      type: 'signIn',
      apiKey: 'api-key',
      user: {
        email: 'test@example.com',
        preferred_username: 'test-user',
      },
    };

    await store.executeAction(signInAction);

    expect(store.accountActionType).toBe('signIn');
    expect(store.accountActionStatus).toBe('success');
    expect(mockSignInMutate).toHaveBeenCalledWith({
      input: {
        apiKey: 'api-key',
        userInfo: {
          email: 'test@example.com',
          preferred_username: 'test-user',
        },
      },
    });
  });

  it('fails sign-in with missing payload', async () => {
    await store.executeAction({
      type: 'signIn',
      apiKey: '',
      user: {
        email: '',
        preferred_username: '',
      },
    } as ExternalSignIn);

    expect(store.accountActionStatus).toBe('failed');
    expect(mockSignInMutate).not.toHaveBeenCalled();
  });

  it('handles sign-in mutation failures', async () => {
    mockSignInMutate.mockRejectedValueOnce(new Error('sign in failed'));

    await store.executeAction({
      type: 'signIn',
      apiKey: 'api-key',
      user: {
        email: 'test@example.com',
        preferred_username: 'test-user',
      },
    });

    expect(store.accountActionStatus).toBe('failed');
    expect(mockLogErrorMessages).toHaveBeenCalled();
    expect(mockSetError).toHaveBeenCalledWith({
      heading: 'unraid-api failed to update Connect account configuration',
      message: 'sign in failed',
      level: 'error',
      ref: 'connectSignInMutation',
      type: 'account',
    });
  });

  it('handles sign-in unsuccessful mutation response', async () => {
    mockSignInMutate.mockResolvedValueOnce({
      data: {
        connectSignIn: false,
      },
    });

    await store.executeAction({
      type: 'signIn',
      apiKey: 'api-key',
      user: {
        email: 'test@example.com',
        preferred_username: 'test-user',
      },
    });

    expect(store.accountActionStatus).toBe('failed');
    expect(mockSetError).toHaveBeenCalledWith({
      heading: 'unraid-api failed to update Connect account configuration',
      message: 'Sign In mutation unsuccessful',
      level: 'error',
      ref: 'connectSignInMutation',
      type: 'account',
    });
  });

  it('executes sign-out inbound action', async () => {
    mockSignOutMutate.mockResolvedValueOnce({
      data: {
        connectSignOut: true,
      },
    });

    await store.executeAction({
      type: 'signOut',
    });

    expect(store.accountActionType).toBe('signOut');
    expect(store.accountActionStatus).toBe('success');
    expect(mockSignOutMutate).toHaveBeenCalled();
  });

  it('handles sign-out unsuccessful mutation response', async () => {
    mockSignOutMutate.mockResolvedValueOnce({
      data: {
        connectSignOut: false,
      },
    });

    await store.executeAction({
      type: 'signOut',
    });

    expect(store.accountActionStatus).toBe('failed');
    expect(mockSetError).toHaveBeenCalledWith({
      heading: 'Failed to update Connect account configuration',
      message: 'Sign Out mutation unsuccessful',
      level: 'error',
      ref: 'connectSignOutMutation',
      type: 'account',
    });
  });

  it('executes oemSignOut inbound action', async () => {
    mockSignOutMutate.mockResolvedValueOnce({
      data: {
        connectSignOut: true,
      },
    });

    await store.executeAction({
      type: 'oemSignOut',
    });

    expect(store.accountActionType).toBe('oemSignOut');
    expect(store.accountActionStatus).toBe('success');
    expect(mockSignOutMutate).toHaveBeenCalled();
  });

  it('handles sign-out mutation failures', async () => {
    mockSignOutMutate.mockRejectedValueOnce(new Error('sign out failed'));

    await store.executeAction({
      type: 'signOut',
    });

    expect(store.accountActionStatus).toBe('failed');
    expect(mockLogErrorMessages).toHaveBeenCalled();
    expect(mockSetError).toHaveBeenCalledWith({
      heading: 'Failed to update Connect account configuration',
      message: 'sign out failed',
      level: 'error',
      ref: 'connectSignOutMutation',
      type: 'account',
    });
  });
});
