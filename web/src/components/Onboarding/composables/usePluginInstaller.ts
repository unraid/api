import { useApolloClient } from '@vue/apollo-composable';

import type { PluginInstallEvent } from '~/composables/gql/graphql';

import { INSTALL_LANGUAGE_MUTATION } from '~/components/Onboarding/graphql/installLanguage.mutation';
import { INSTALL_PLUGIN_MUTATION } from '~/components/Onboarding/graphql/installPlugin.mutation';
import { PLUGIN_INSTALL_OPERATION_QUERY } from '~/components/Onboarding/graphql/pluginInstallOperation.query';
import { PLUGIN_INSTALL_UPDATES_SUBSCRIPTION } from '~/components/Onboarding/graphql/pluginInstallUpdates.subscription';
import { PluginInstallStatus } from '~/composables/gql/graphql';

export interface InstallPluginOptions {
  url: string;
  name?: string;
  forced?: boolean;
  onEvent?: (event: PluginInstallEvent) => void;
}

export interface InstallPluginResult {
  operationId: string;
  status: PluginInstallStatus;
  output: string[];
}

const isFinalStatus = (status: PluginInstallStatus) =>
  status === PluginInstallStatus.SUCCEEDED || status === PluginInstallStatus.FAILED;

const INSTALL_RESULT_POLL_MS = 2000;
// Keep the client timeout slightly above server command timeout so final status can be observed.
const INSTALL_RESULT_TIMEOUT_MS = 5 * 60 * 1000 + 5000;

export const INSTALL_OPERATION_TIMEOUT_CODE = 'INSTALL_OPERATION_TIMEOUT';

const createInstallTimeoutError = (operationId: string) => {
  const error = new Error(
    `Timed out waiting for install operation ${operationId} to finish`
  ) as Error & {
    code?: string;
  };
  error.code = INSTALL_OPERATION_TIMEOUT_CODE;
  return error;
};

const usePluginInstaller = () => {
  const apolloClient = useApolloClient().client;

  const fetchInstallOperation = async (operationId: string) => {
    const result = await apolloClient.query({
      query: PLUGIN_INSTALL_OPERATION_QUERY,
      variables: { operationId },
      fetchPolicy: 'network-only',
    });

    return result.data?.pluginInstallOperation ?? null;
  };

  const trackInstallOperation = async (
    operation: {
      id: string;
      status: PluginInstallStatus;
      output?: string[] | null;
    },
    options?: { onEvent?: (event: PluginInstallEvent) => void }
  ) => {
    const trackedOutput = [...(operation.output ?? [])];

    if (isFinalStatus(operation.status)) {
      return {
        operationId: operation.id,
        status: operation.status,
        output: trackedOutput,
      };
    }

    return new Promise<InstallPluginResult>((resolve, reject) => {
      let settled = false;

      let pollTimer: ReturnType<typeof setInterval> | null = null;
      let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

      const settle = (result: InstallPluginResult) => {
        if (settled) {
          return;
        }
        settled = true;
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
          timeoutTimer = null;
        }
        resolve(result);
      };

      const fail = (error: unknown) => {
        if (settled) {
          return;
        }
        settled = true;
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
          timeoutTimer = null;
        }
        reject(error);
      };

      const finalizeFromQuery = async (fallbackStatus?: PluginInstallStatus) => {
        const operationResult = await fetchInstallOperation(operation.id);
        settle({
          operationId: operation.id,
          status: operationResult?.status ?? fallbackStatus ?? PluginInstallStatus.FAILED,
          output: operationResult?.output ?? trackedOutput,
        });
      };

      const pollForFinalResult = async () => {
        if (settled) {
          return;
        }

        try {
          const operationResult = await fetchInstallOperation(operation.id);
          if (!operationResult) {
            return;
          }

          if (operationResult.output?.length) {
            trackedOutput.splice(0, trackedOutput.length, ...operationResult.output);
          }

          if (isFinalStatus(operationResult.status)) {
            settle({
              operationId: operation.id,
              status: operationResult.status,
              output: operationResult.output ?? trackedOutput,
            });
          }
        } catch {
          // Keep polling until timeout.
        }
      };

      const observable = apolloClient.subscribe({
        query: PLUGIN_INSTALL_UPDATES_SUBSCRIPTION,
        variables: { operationId: operation.id },
      });

      let subscription: { unsubscribe: () => void } | null = null;

      subscription = observable.subscribe({
        next: ({ data: subscriptionData }) => {
          if (settled) {
            return;
          }

          const event = subscriptionData?.pluginInstallUpdates;
          if (!event) {
            return;
          }

          if (event.output?.length) {
            trackedOutput.push(...event.output);
          }

          options?.onEvent?.(event);

          if (isFinalStatus(event.status)) {
            subscription?.unsubscribe();
            void finalizeFromQuery(event.status).catch((error) => {
              fail(error);
            });
          }
        },
        error: () => {
          // Subscription transport may be unavailable in some contexts.
          // Polling continues and can still resolve this operation.
          subscription?.unsubscribe();
        },
      });

      pollTimer = setInterval(() => {
        void pollForFinalResult();
      }, INSTALL_RESULT_POLL_MS);

      timeoutTimer = setTimeout(() => {
        subscription?.unsubscribe();
        void fetchInstallOperation(operation.id)
          .then((operationResult) => {
            if (operationResult && isFinalStatus(operationResult.status)) {
              settle({
                operationId: operation.id,
                status: operationResult.status,
                output: operationResult.output ?? trackedOutput,
              });
              return;
            }

            fail(createInstallTimeoutError(operation.id));
          })
          .catch((error) => {
            fail(error);
          });
      }, INSTALL_RESULT_TIMEOUT_MS);
    });
  };

  const installPlugin = async ({
    url,
    name,
    forced = true,
    onEvent,
  }: InstallPluginOptions): Promise<InstallPluginResult> => {
    const { data } = await apolloClient.mutate({
      mutation: INSTALL_PLUGIN_MUTATION,
      variables: { input: { url, name, forced } },
      fetchPolicy: 'no-cache',
    });

    const operation = data?.unraidPlugins?.installPlugin;
    if (!operation) {
      throw new Error('Failed to start plugin installation');
    }

    return trackInstallOperation(operation, { onEvent });
  };

  const installLanguage = async ({
    url,
    name,
    forced = false,
  }: InstallPluginOptions): Promise<InstallPluginResult> => {
    const { data } = await apolloClient.mutate({
      mutation: INSTALL_LANGUAGE_MUTATION,
      variables: { input: { url, name, forced } },
      fetchPolicy: 'no-cache',
    });

    const operation = data?.unraidPlugins?.installLanguage;
    if (!operation) {
      throw new Error('Failed to start language installation');
    }

    return trackInstallOperation(operation);
  };

  return {
    installPlugin,
    installLanguage,
  };
};

export default usePluginInstaller;
