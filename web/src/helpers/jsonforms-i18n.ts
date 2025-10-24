import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import type { JsonFormsI18nState } from '@jsonforms/core';

function coerceToString(value: unknown): string {
  return typeof value === 'string' ? value : String(value);
}

function expandTranslationKeys(id?: string): string[] {
  if (!id) return [];

  const candidates = new Set<string>([id]);
  const suffixPattern = /(\.(label|title|text|description|header|subheader|help))$/;

  const match = id.match(suffixPattern);
  if (match) {
    const base = id.slice(0, -match[1].length);
    const suffix = match[2];
    const replacements: Record<string, string[]> = {
      text: ['label', 'title'],
      label: ['text', 'title'],
      title: ['label', 'text'],
      description: ['label', 'text', 'title'],
      header: ['label', 'title', 'text'],
      subheader: ['label', 'title', 'text'],
      help: ['label', 'title', 'text'],
    };

    for (const replacement of replacements[suffix] ?? []) {
      candidates.add(`${base}.${replacement}`);
    }
    candidates.add(base);
  }

  return Array.from(candidates);
}

export function useJsonFormsI18n() {
  const { t, te, locale } = useI18n();

  return computed<JsonFormsI18nState>(() => ({
    locale: locale.value,
    translate: (id, defaultMessage, values) => {
      for (const candidate of expandTranslationKeys(id)) {
        if (te(candidate)) {
          return coerceToString(t(candidate, values));
        }
      }
      if (defaultMessage) {
        return defaultMessage;
      }
      return id;
    },
    translateError: (error) => {
      const key = error.keyword ? `jsonforms.errors.${error.keyword}` : undefined;
      if (key && te(key)) {
        return coerceToString(t(key, error.params ?? {}));
      }
      return error.message ?? error.keyword ?? '';
    },
  }));
}
