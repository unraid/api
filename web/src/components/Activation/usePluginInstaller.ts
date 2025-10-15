import { useApolloClient } from '@vue/apollo-composable';

import type { PluginInstallEvent } from '~/composables/gql/graphql';

import { INSTALL_PLUGIN_MUTATION } from '~/components/Activation/graphql/installPlugin.mutation';
import { PLUGIN_INSTALL_OPERATION_QUERY } from '~/components/Activation/graphql/pluginInstallOperation.query';
import { PLUGIN_INSTALL_UPDATES_SUBSCRIPTION } from '~/components/Activation/graphql/pluginInstallUpdates.subscription';
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

const usePluginInstaller = () => {
  const apolloClient = useApolloClient().client;

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

    const trackedOutput = [...(operation.output ?? [])];

    if (isFinalStatus(operation.status)) {
      return {
        operationId: operation.id,
        status: operation.status,
        output: trackedOutput,
      };
    }

    return new Promise<InstallPluginResult>((resolve, reject) => {
      const observable = apolloClient.subscribe({
        query: PLUGIN_INSTALL_UPDATES_SUBSCRIPTION,
        variables: { operationId: operation.id },
      });

      const subscription = observable.subscribe({
        next: ({ data: subscriptionData }) => {
          const event = subscriptionData?.pluginInstallUpdates;
          if (!event) {
            return;
          }

          if (event.output?.length) {
            trackedOutput.push(...event.output);
          }

          onEvent?.(event);

          if (isFinalStatus(event.status)) {
            void apolloClient
              .query({
                query: PLUGIN_INSTALL_OPERATION_QUERY,
                variables: { operationId: operation.id },
                fetchPolicy: 'network-only',
              })
              .then((result) => {
                const operationResult = result.data?.pluginInstallOperation;
                subscription.unsubscribe();
                resolve({
                  operationId: operation.id,
                  status: event.status,
                  output: operationResult?.output ?? trackedOutput,
                });
              })
              .catch((error) => {
                subscription.unsubscribe();
                reject(error);
              });
          }
        },
        error: (error) => {
          subscription.unsubscribe();
          reject(error);
        },
      });
    });
  };

  return {
    installPlugin,
  };
};

export default usePluginInstaller;
