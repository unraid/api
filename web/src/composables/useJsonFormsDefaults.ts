import { computed } from 'vue';

import { jsonFormsAjv, jsonFormsRenderers } from '@unraid/ui';
import { useJsonFormsI18n } from '~/helpers/jsonforms-i18n';

const defaultConfig = Object.freeze({
  restrict: false,
  trim: false,
});

export function useJsonFormsDefaults() {
  const i18n = useJsonFormsI18n();
  const renderers = computed(() => [...jsonFormsRenderers]);

  return {
    ajv: jsonFormsAjv,
    config: defaultConfig,
    i18n,
    renderers,
  } as const;
}
