import { getTranslator, type JsonFormsState, type JsonFormsSubStates } from '@jsonforms/core';
import { inject } from 'vue';

type TranslationContext = Record<string, unknown> | undefined;

/**
 * Exposes helpers that translate JsonForms i18n keys by reusing the
 * translator registered on the nearest <JsonForms> provider.
 */
export function useJsonFormsTranslation() {
  const jsonforms = inject<JsonFormsSubStates | undefined>('jsonforms', undefined);

  const translateKey = (key?: string, defaultMessage?: string, context?: TranslationContext) => {
    if (!key) return defaultMessage;

    if (!jsonforms) {
      return defaultMessage;
    }

    const translator = getTranslator()({ jsonforms } as JsonFormsState);
    const translated = translator?.(key, defaultMessage, context);

    if (typeof translated === 'string' && translated === key) {
      return defaultMessage;
    }

    return translated ?? defaultMessage;
  };

  const translateWithPrefix = (
    prefix?: string,
    suffix?: string,
    defaultMessage?: string,
    context?: TranslationContext
  ) => {
    if (!prefix) return defaultMessage;
    const key = suffix ? `${prefix}.${suffix}` : prefix;
    return translateKey(key, defaultMessage, context);
  };

  return {
    translateKey,
    translateWithPrefix,
  };
}
