import { defineComponent, h, nextTick, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import { jsonFormsAjv } from '@unraid/ui';
import { JsonForms } from '@jsonforms/vue';
import { vanillaRenderers } from '@jsonforms/vue-vanilla';
import { render, screen } from '@testing-library/vue';
import { useJsonFormsI18n } from '~/helpers/jsonforms-i18n';
import { describe, expect, it } from 'vitest';

const schema = {
  type: 'object',
  properties: {
    provider: {
      type: 'string',
      minLength: 1,
      i18n: 'jsonforms.test.provider',
    },
  },
  required: ['provider'],
} as const;

const uischema = {
  type: 'Control',
  scope: '#/properties/provider',
} as const;

const messages = {
  en: {
    jsonforms: {
      test: {
        provider: {
          label: 'Provider label (en)',
          description: 'English description',
        },
      },
      errors: {
        required: 'Field is required (en)',
      },
    },
  },
  fr: {
    jsonforms: {
      test: {
        provider: {
          label: 'Libellé du fournisseur (fr)',
          description: 'Description française',
        },
      },
      errors: {
        required: 'Champ requis (fr)',
      },
    },
  },
} as const;

const TestHarness = defineComponent(() => {
  const formData = ref<Record<string, unknown>>({});
  const i18nState = useJsonFormsI18n();

  const handleChange = ({ data }: { data: Record<string, unknown> }) => {
    formData.value = data;
  };

  return () =>
    h(JsonForms, {
      schema,
      uischema,
      data: formData.value,
      renderers: vanillaRenderers,
      ajv: jsonFormsAjv,
      i18n: i18nState.value,
      validationMode: 'ValidateAndShow',
      onChange: handleChange,
    });
});

const renderJsonForms = async (locale: 'en' | 'fr' = 'en') => {
  const i18n = createI18n({
    legacy: false,
    locale,
    messages,
  });

  const utils = render(TestHarness, {
    global: {
      plugins: [i18n],
    },
  });

  await screen.findByText('Provider label (en)');

  return { i18n, ...utils };
};

describe('useJsonFormsI18n', () => {
  it('translates labels, descriptions, and errors when the locale changes', async () => {
    const { i18n } = await renderJsonForms('en');

    expect(await screen.findByText('Provider label (en)')).toBeTruthy();
    expect(screen.getByText('English description')).toBeTruthy();
    expect(screen.getByText('Field is required (en)')).toBeTruthy();

    i18n.global.locale.value = 'fr';
    await nextTick();
    await screen.findByText('Libellé du fournisseur (fr)');

    expect(screen.getByText('Description française')).toBeTruthy();
    expect(screen.getByText('Champ requis (fr)')).toBeTruthy();
  });

  it('responds to updated translations for the active locale', async () => {
    const { i18n } = await renderJsonForms('en');

    i18n.global.mergeLocaleMessage('en', {
      jsonforms: {
        test: {
          provider: {
            label: 'Provider label (updated)',
            description: 'Updated English description',
          },
        },
      },
      errors: {
        required: 'Field is required (updated)',
      },
    });

    await nextTick();
    await screen.findByText('Provider label (updated)');

    expect(screen.getByText('Updated English description')).toBeTruthy();
    expect(screen.getByText('Field is required (updated)')).toBeTruthy();
  });
});
