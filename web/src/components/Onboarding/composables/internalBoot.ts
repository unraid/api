import { useApolloClient } from '@vue/apollo-composable';

import { CREATE_INTERNAL_BOOT_POOL_MUTATION } from '@/components/Onboarding/graphql/createInternalBootPool.mutation';

export interface InternalBootSelection {
  poolName: string;
  devices: string[];
  bootSizeMiB: number;
  updateBios: boolean;
}

export interface SubmitInternalBootOptions {
  reboot?: boolean;
}

export interface InternalBootSubmitResult {
  ok: boolean;
  code?: number;
  output: string;
}

const readCsrfToken = (): string | null => {
  const token = globalThis.csrf_token;
  if (typeof token !== 'string') {
    return null;
  }
  const trimmedToken = token.trim();
  return trimmedToken.length > 0 ? trimmedToken : null;
};

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

export const submitInternalBootReboot = () => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/plugins/dynamix/include/Boot.php';
  form.target = '_top';
  form.style.display = 'none';

  const cmd = document.createElement('input');
  cmd.type = 'hidden';
  cmd.name = 'cmd';
  cmd.value = 'reboot';
  form.appendChild(cmd);

  const csrfToken = readCsrfToken();
  if (csrfToken) {
    const csrf = document.createElement('input');
    csrf.type = 'hidden';
    csrf.name = 'csrf_token';
    csrf.value = csrfToken;
    form.appendChild(csrf);
  }

  document.body.appendChild(form);
  form.submit();
};
