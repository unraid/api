import { useApolloClient } from '@vue/apollo-composable';

import { buildOnboardingErrorDiagnostics } from '@/components/Onboarding/composables/onboardingErrorDiagnostics';
import { CREATE_INTERNAL_BOOT_POOL_MUTATION } from '@/components/Onboarding/graphql/createInternalBootPool.mutation';
import {
  SERVER_REBOOT_MUTATION,
  SERVER_SHUTDOWN_MUTATION,
} from '@/components/Onboarding/graphql/serverPower.mutation';

import type { LogEntry } from '@/components/Onboarding/components/OnboardingConsole.vue';

export type PoolMode = 'dedicated' | 'hybrid';

export interface InternalBootSelection {
  poolName: string;
  devices: string[];
  bootSizeMiB: number;
  updateBios: boolean;
  poolMode: PoolMode;
}

export interface SubmitInternalBootOptions {
  reboot?: boolean;
}

export interface InternalBootSubmitResult {
  ok: boolean;
  code?: number;
  output: string;
}

export interface InternalBootApplyMessages {
  configured: string;
  returnedError: (output: string) => string;
  failed: string;
  biosUnverified: string;
}

export interface InternalBootApplyResult {
  applySucceeded: boolean;
  hadWarnings: boolean;
  hadNonOptimisticFailures: boolean;
  logs: Array<Omit<LogEntry, 'timestamp'>>;
}

interface InternalBootBiosLogSummary {
  summaryLine: string | null;
  failureLines: string[];
}

export const submitInternalBootCreation = async (
  selection: InternalBootSelection,
  options: SubmitInternalBootOptions = {}
): Promise<InternalBootSubmitResult> => {
  const apolloClient = useApolloClient().client;
  try {
    const { data } = await apolloClient.mutate({
      mutation: CREATE_INTERNAL_BOOT_POOL_MUTATION,
      variables: {
        input: {
          poolName: selection.poolName,
          devices: selection.devices,
          bootSizeMiB: selection.bootSizeMiB,
          updateBios: selection.updateBios,
          reboot: Boolean(options.reboot),
        },
      },
      fetchPolicy: 'no-cache',
    });

    const result = data?.onboarding?.createInternalBootPool;
    if (!result) {
      return {
        ok: false,
        output: 'Internal boot setup request failed: empty API response.',
      };
    }

    return {
      ok: result.ok,
      code: result.code ?? undefined,
      output: result.output?.trim() || 'No output',
    };
  } catch (error) {
    return {
      ok: false,
      output:
        error instanceof Error
          ? `Internal boot setup request failed: ${error.message}`
          : 'Internal boot setup request failed.',
    };
  }
};

export const summarizeInternalBootBiosLogs = (output: string): InternalBootBiosLogSummary => {
  const lines = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const summaryLine = lines.find((line) => line.startsWith('BIOS boot entry updates completed')) ?? null;
  const failureLines = Array.from(
    new Set(lines.filter((line) => line.toLowerCase().includes('efibootmgr failed')))
  );
  return { summaryLine, failureLines };
};

const buildMutationVariables = (selection: InternalBootSelection) => ({
  poolName: selection.poolName,
  devices: selection.devices,
  bootSizeMiB: selection.bootSizeMiB,
  updateBios: selection.updateBios,
  reboot: false,
});

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const trimmedMessage = error.message.trim();
    if (trimmedMessage) {
      return trimmedMessage;
    }
  }

  if (typeof error === 'string') {
    const trimmedMessage = error.trim();
    if (trimmedMessage) {
      return trimmedMessage;
    }
  }

  return 'Unknown error';
};

export const applyInternalBootSelection = async (
  selection: InternalBootSelection,
  messages: InternalBootApplyMessages
): Promise<InternalBootApplyResult> => {
  const logs: Array<Omit<LogEntry, 'timestamp'>> = [];
  let hadWarnings = false;
  let hadNonOptimisticFailures = false;

  try {
    const result = await submitInternalBootCreation(selection, { reboot: false });

    if (result.ok) {
      logs.push({
        message: messages.configured,
        type: 'success',
      });

      if (selection.updateBios) {
        const biosLogSummary = summarizeInternalBootBiosLogs(result.output);
        const hadBiosWarnings =
          biosLogSummary.failureLines.length > 0 ||
          Boolean(biosLogSummary.summaryLine?.toLowerCase().includes('with warnings'));
        const biosUnverified = !biosLogSummary.summaryLine && biosLogSummary.failureLines.length === 0;

        if (hadBiosWarnings || biosUnverified) {
          hadWarnings = true;
          hadNonOptimisticFailures = true;
        }

        if (biosUnverified) {
          logs.push({
            message: messages.biosUnverified,
            type: 'error',
          });
        } else if (biosLogSummary.summaryLine) {
          logs.push({
            message: biosLogSummary.summaryLine,
            type: hadBiosWarnings ? 'error' : 'success',
          });
        }

        for (const failureLine of biosLogSummary.failureLines) {
          logs.push({
            message: failureLine,
            type: 'error',
          });
        }
      }

      return {
        applySucceeded: true,
        hadWarnings,
        hadNonOptimisticFailures,
        logs,
      };
    }

    hadWarnings = true;
    hadNonOptimisticFailures = true;
    logs.push({
      message: messages.returnedError(result.output),
      type: 'error',
      details: buildOnboardingErrorDiagnostics(
        {
          message: 'Internal boot setup returned ok=false',
          code: result.code ?? null,
          networkError: {
            status: result.code ?? null,
            result,
          },
        },
        {
          operation: 'CreateInternalBootPool',
          variables: buildMutationVariables(selection),
        }
      ),
    });
  } catch (error) {
    hadWarnings = true;
    hadNonOptimisticFailures = true;
    logs.push({
      message: `${messages.failed}: ${getErrorMessage(error)}`,
      type: 'error',
      details: buildOnboardingErrorDiagnostics(error, {
        operation: 'CreateInternalBootPool',
        variables: buildMutationVariables(selection),
      }),
    });
  }

  return {
    applySucceeded: false,
    hadWarnings,
    hadNonOptimisticFailures,
    logs,
  };
};

export const submitInternalBootReboot = async () => {
  const apolloClient = useApolloClient().client;
  await apolloClient.mutate({
    mutation: SERVER_REBOOT_MUTATION,
    fetchPolicy: 'no-cache',
    context: { noRetry: true },
  });
};

export const submitInternalBootShutdown = async () => {
  const apolloClient = useApolloClient().client;
  await apolloClient.mutate({
    mutation: SERVER_SHUTDOWN_MUTATION,
    fetchPolicy: 'no-cache',
    context: { noRetry: true },
  });
};
