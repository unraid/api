/** Output key + value as string for each item in the object. Adds new line after each item. */
export const OBJ_TO_STR = (obj: object): string => Object.entries(obj).reduce((str, [p, val]) => `${str}${p}: ${val}\n`, '');

/**
 * Extracts a meaningful error message from a GraphQL error or generic error object.
 */
export function extractGraphQLErrorMessage(err: unknown): string {
  let message = 'An unknown error occurred.';
  const e = err as { graphQLErrors?: unknown; message?: string };
  const graphQLErrors = Array.isArray(e?.graphQLErrors) ? e.graphQLErrors : undefined;
  if (graphQLErrors && graphQLErrors.length) {
    const gqlError = graphQLErrors[0] as { extensions?: { originalError?: { message?: string[] } }; message?: string };
    message =
      gqlError?.extensions?.originalError?.message?.[0] ||
      gqlError?.message ||
      message;
  } else if (typeof err === 'object' && err !== null && 'message' in err && typeof e.message === 'string') {
    message = e.message;
  }
  return message;
}