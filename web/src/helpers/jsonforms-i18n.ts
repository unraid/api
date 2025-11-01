import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import type { JsonFormsI18nState } from '@jsonforms/core';

const toStringIfNeeded = (value: unknown) => {
  if (typeof value === 'string') {
    return value;
  }
  if (value == null) {
    return '';
  }
  return String(value);
};

export function useJsonFormsI18n() {
  const { t, te, locale, messages } = useI18n();

  const translate: NonNullable<JsonFormsI18nState['translate']> = (id, defaultMessage, values) => {
    if (id && te(id)) {
      const result = t(id, values ?? {});
      return toStringIfNeeded(result);
    }

    if (defaultMessage) {
      return toStringIfNeeded(defaultMessage);
    }

    return id ?? '';
  };

  const translateError: NonNullable<JsonFormsI18nState['translateError']> = (error) => {
    const key = error.keyword ? `jsonforms.errors.${error.keyword}` : undefined;
    if (key && te(key)) {
      const translated = t(key, error.params ?? {});
      return toStringIfNeeded(translated);
    }
    return error.message ?? error.keyword ?? '';
  };

  const state = ref<JsonFormsI18nState>({
    locale: locale.value,
    translate,
    translateError,
  });

  watch(
    locale,
    (currentLocale) => {
      state.value = {
        locale: currentLocale,
        translate,
        translateError,
      };
    },
    { immediate: true }
  );

  watch(
    () => messages.value?.[locale.value],
    () => {
      state.value = {
        locale: locale.value,
        translate,
        translateError,
      };
    },
    { deep: true }
  );

  return state;
}
