import type { ApolloError } from '@apollo/client/errors';

/** Output key + value as string for each item in the object. Adds new line after each item. */
export const OBJ_TO_STR = (obj: object): string =>
  Object.entries(obj).reduce((str, [p, val]) => `${str}${p}: ${val}\n`, '');

export function dbgApolloError(prefix: string, err: ApolloError | null | undefined) {
  if (!err) return;
  console.group(`[GraphQL] ${prefix}`);
  console.log('top message:', err.message);
  console.log('graphQLErrors:', err.graphQLErrors);
  console.log('networkError:', err.networkError);
  try {
    console.log('json:', JSON.parse(JSON.stringify(err)));
  } catch {
    console.log('json:', 'failed to parse');
    console.log('json:', err);
  }
  console.groupEnd();
}

/**
 * Extracts a meaningful error message from a GraphQL error or generic error object.
 */
export function extractGraphQLErrorMessage(err: unknown): string {
  let message = 'An unknown error occurred.';
  const e = err as { graphQLErrors?: unknown; message?: string; networkError?: { message?: string } };
  const graphQLErrors = Array.isArray(e?.graphQLErrors) ? e.graphQLErrors : undefined;

  if (graphQLErrors && graphQLErrors.length) {
    const gqlError = graphQLErrors[0] as {
      extensions?: {
        originalError?: { message?: string[] };
        error?: { message?: string };
      };
      error?: { message?: string };
      message?: string;
    };

    message =
      gqlError?.extensions?.error?.message ||
      gqlError?.extensions?.originalError?.message?.[0] ||
      gqlError?.error?.message ||
      gqlError?.message ||
      message;
  } else if ((e?.networkError as { message?: string })?.message) {
    message = (e.networkError as { message?: string }).message!;
  } else if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof e.message === 'string'
  ) {
    message = e.message;
  }
  return message;
}
