export type OnboardingErrorCategory = 'network' | 'graphql' | 'timeout' | 'tls' | 'unknown';

export interface OnboardingErrorDiagnosticsRequest {
  operation: string;
  variables?: unknown;
}

export interface OnboardingErrorDiagnosticsError {
  name: string;
  code: string | number | null;
  message: string;
  category: OnboardingErrorCategory;
  graphQLErrors?: string[];
  networkError?: unknown;
}

export interface OnboardingErrorDiagnostics {
  request: OnboardingErrorDiagnosticsRequest;
  response: unknown | null;
  status: number | null;
  error: OnboardingErrorDiagnosticsError;
}

interface OnboardingErrorContext {
  operation: string;
  variables?: unknown;
}

const SENSITIVE_KEY_PATTERN = /(authorization|cookie|csrf|password|secret|token|api[_-]?key|session)/i;
const MAX_DEPTH = 5;
const MAX_OBJECT_KEYS = 40;
const MAX_ARRAY_ITEMS = 20;
const MAX_STRING_LENGTH = 500;

const truncate = (value: string) => {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }
  return `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]`;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const asString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const sanitizeValue = (value: unknown, depth = 0): unknown => {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'string') {
    return truncate(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'function') {
    return '[Function]';
  }
  if (depth >= MAX_DEPTH) {
    return '[Max depth reached]';
  }
  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncate(value.message),
    };
  }
  if (Array.isArray(value)) {
    const limitedItems = value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeValue(item, depth + 1));
    if (value.length > MAX_ARRAY_ITEMS) {
      limitedItems.push(`[${value.length - MAX_ARRAY_ITEMS} more items truncated]`);
    }
    return limitedItems;
  }

  const record = asRecord(value);
  if (!record) {
    return String(value);
  }

  const entries = Object.entries(record);
  const limitedEntries = entries.slice(0, MAX_OBJECT_KEYS);
  const sanitized: Record<string, unknown> = {};
  for (const [key, nestedValue] of limitedEntries) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    sanitized[key] = sanitizeValue(nestedValue, depth + 1);
  }

  if (entries.length > MAX_OBJECT_KEYS) {
    sanitized.__truncatedKeys = `${entries.length - MAX_OBJECT_KEYS} keys omitted`;
  }

  return sanitized;
};

const inferCategory = (messageParts: string[], graphQLErrors: string[]): OnboardingErrorCategory => {
  const normalized = messageParts.join(' ').toLowerCase();
  if (
    normalized.includes('self-signed') ||
    normalized.includes('pkix') ||
    normalized.includes('certificate')
  ) {
    return 'tls';
  }
  if (normalized.includes('timed out') || normalized.includes('timeout')) {
    return 'timeout';
  }
  if (graphQLErrors.length > 0) {
    return 'graphql';
  }
  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('network') ||
    normalized.includes('offline') ||
    normalized.includes('load failed')
  ) {
    return 'network';
  }
  return 'unknown';
};

export const buildOnboardingErrorDiagnostics = (
  caughtError: unknown,
  context: OnboardingErrorContext
): OnboardingErrorDiagnostics => {
  const root = asRecord(caughtError);
  const networkError = asRecord(root?.networkError);
  const responseRecord = asRecord(networkError?.response);

  const status =
    asNumber(networkError?.statusCode) ??
    asNumber(networkError?.status) ??
    asNumber(responseRecord?.status);

  const graphQLErrorMessages = Array.isArray(root?.graphQLErrors)
    ? root.graphQLErrors
        .map((entry) => {
          const item = asRecord(entry);
          return asString(item?.message);
        })
        .filter((message): message is string => Boolean(message))
    : [];

  const codeValue =
    (typeof root?.code === 'string' || typeof root?.code === 'number' ? root.code : null) ??
    (typeof networkError?.code === 'string' || typeof networkError?.code === 'number'
      ? networkError.code
      : null);

  const directMessage =
    (caughtError instanceof Error ? caughtError.message : null) ??
    asString(root?.message) ??
    asString(networkError?.message) ??
    graphQLErrorMessages[0] ??
    'Unknown error';

  const name =
    (caughtError instanceof Error ? caughtError.name : null) ?? asString(root?.name) ?? 'Error';

  const responsePayload =
    networkError?.result ??
    responseRecord?.result ??
    responseRecord?.data ??
    responseRecord?.body ??
    responseRecord?.bodyText ??
    null;

  const request: OnboardingErrorDiagnosticsRequest = {
    operation: context.operation,
  };
  if (context.variables !== undefined) {
    request.variables = sanitizeValue(context.variables);
  }

  const messageParts = [directMessage, asString(networkError?.message), ...graphQLErrorMessages].filter(
    (part): part is string => Boolean(part)
  );

  return {
    request,
    response: responsePayload === null ? null : sanitizeValue(responsePayload),
    status,
    error: {
      name,
      code: codeValue,
      message: truncate(directMessage),
      category: inferCategory(messageParts, graphQLErrorMessages),
      graphQLErrors:
        graphQLErrorMessages.length > 0
          ? graphQLErrorMessages.map((message) => truncate(message))
          : undefined,
      networkError: networkError ? sanitizeValue(networkError) : undefined,
    },
  };
};
