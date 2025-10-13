import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import type { JsonFormsI18nState } from '@jsonforms/core';

export function useJsonFormsI18n() {
  const { t, te, locale } = useI18n();

  return computed<JsonFormsI18nState>(() => ({
    locale: locale.value,
    translate: (id, defaultMessage, values) => {
      if (id && te(id)) {
        const result = t(id, values);
        return typeof result === 'string' ? result : String(result);
      }
      if (defaultMessage) {
        return defaultMessage;
      }
      return id;
    },
    translateError: (error) => {
      const key = error.keyword ? `jsonforms.errors.${error.keyword}` : undefined;
      if (key && te(key)) {
        const translated = t(key, error.params ?? {});
        return typeof translated === 'string' ? translated : String(translated);
      }
      return error.message ?? error.keyword ?? '';
    },
  }));
}
