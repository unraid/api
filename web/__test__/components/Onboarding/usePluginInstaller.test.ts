import { beforeEach, describe, expect, it, vi } from 'vitest';

import usePluginInstaller from '~/components/Onboarding/composables/usePluginInstaller';
import { PluginInstallStatus } from '~/composables/gql/graphql';

const { mutateMock, queryMock, subscribeMock, useApolloClientMock } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  queryMock: vi.fn(),
  subscribeMock: vi.fn(),
  useApolloClientMock: vi.fn(),
}));

vi.mock('@vue/apollo-composable', async () => {
  const actual =
    await vi.importActual<typeof import('@vue/apollo-composable')>('@vue/apollo-composable');
  return {
    ...actual,
    useApolloClient: useApolloClientMock,
  };
});

describe('usePluginInstaller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useApolloClientMock.mockReturnValue({
      client: {
        mutate: mutateMock,
        query: queryMock,
        subscribe: subscribeMock,
      },
    });
  });

  it('returns FAILED when plugin operation starts and finishes in failed state', async () => {
    mutateMock.mockResolvedValue({
      data: {
        unraidPlugins: {
          installPlugin: {
            id: 'plugin-op-1',
            status: PluginInstallStatus.FAILED,
            output: ['installation failed'],
          },
        },
      },
    });

    const { installPlugin } = usePluginInstaller();
    const result = await installPlugin({
      url: 'https://example.com/plugin.plg',
      name: 'Example Plugin',
      forced: false,
    });

    expect(result.status).toBe(PluginInstallStatus.FAILED);
    expect(result.output).toContain('installation failed');
    expect(subscribeMock).not.toHaveBeenCalled();
  });

  it('returns FAILED for installLanguage when subscription emits final failed event', async () => {
    mutateMock.mockResolvedValue({
      data: {
        unraidPlugins: {
          installLanguage: {
            id: 'lang-op-1',
            status: PluginInstallStatus.RUNNING,
            output: ['starting'],
          },
        },
      },
    });

    queryMock.mockResolvedValue({
      data: {
        pluginInstallOperation: {
          output: ['starting', 'network failed'],
        },
      },
    });

    subscribeMock.mockImplementation(() => ({
      subscribe: ({ next }: { next: (value: unknown) => void }) => {
        next({
          data: {
            pluginInstallUpdates: {
              operationId: 'lang-op-1',
              status: PluginInstallStatus.FAILED,
              output: ['network failed'],
            },
          },
        });
        return {
          unsubscribe: vi.fn(),
        };
      },
    }));

    const { installLanguage } = usePluginInstaller();
    const result = await installLanguage({
      url: 'https://example.com/lang.txz',
      name: 'French',
      forced: false,
    });

    expect(result.operationId).toBe('lang-op-1');
    expect(result.status).toBe(PluginInstallStatus.FAILED);
    expect(result.output).toEqual(['starting', 'network failed']);
  });

  it('throws timeout error with code when operation does not finish in time', async () => {
    vi.useFakeTimers();
    try {
      mutateMock.mockResolvedValue({
        data: {
          unraidPlugins: {
            installPlugin: {
              id: 'plugin-op-timeout',
              status: PluginInstallStatus.RUNNING,
              output: [],
            },
          },
        },
      });

      queryMock.mockResolvedValue({
        data: {
          pluginInstallOperation: {
            id: 'plugin-op-timeout',
            status: PluginInstallStatus.RUNNING,
            output: [],
          },
        },
      });

      subscribeMock.mockImplementation(() => ({
        subscribe: () => ({
          unsubscribe: vi.fn(),
        }),
      }));

      const { installPlugin } = usePluginInstaller();
      const pending = installPlugin({
        url: 'https://example.com/plugin.plg',
        name: 'Slow Plugin',
      });
      const handled = pending.then(
        () => null,
        (error) => error as { code?: string }
      );

      await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 5000);
      const error = await handled;
      expect(error).toMatchObject({ code: 'INSTALL_OPERATION_TIMEOUT' });
    } finally {
      vi.useRealTimers();
    }
  });
});
