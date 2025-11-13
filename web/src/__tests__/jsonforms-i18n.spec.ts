import { defineComponent, ref } from 'vue';
import { createI18n } from 'vue-i18n';
import { mount } from '@vue/test-utils';

import { createAjv } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/vue';
import { vanillaRenderers } from '@jsonforms/vue-vanilla';
import { useJsonFormsI18n } from '~/helpers/jsonforms-i18n';
import { describe, expect, it } from 'vitest';

describe('useJsonFormsI18n', () => {
  const buildWrapper = (messages: Record<string, string>) => {
    const i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: { en: messages },
    });

    let jsonFormsI18nReturn: ReturnType<typeof useJsonFormsI18n> | undefined;
    const Harness = defineComponent({
      setup() {
        jsonFormsI18nReturn = useJsonFormsI18n();
        return () => null;
      },
    });

    const wrapper = mount(Harness, { global: { plugins: [i18n] } });
    if (!jsonFormsI18nReturn) {
      throw new Error('useJsonFormsI18n did not provide a value');
    }
    return { wrapper, jsonFormsI18n: jsonFormsI18nReturn };
  };

  it('falls back between common suffixes when translating', () => {
    const { wrapper, jsonFormsI18n } = buildWrapper({
      'jsonforms.sample.fallback.label': 'Label fallback',
      'jsonforms.sample.base': 'Base fallback',
    });

    const translator = jsonFormsI18n.value.translate;

    expect(translator('jsonforms.sample.fallback.text', undefined)).toBe('Label fallback');
    expect(translator('jsonforms.sample.base.label', undefined)).toBe('Base fallback');
    expect(translator('jsonforms.sample.fallback', undefined)).toBe('Label fallback');
    expect(translator('jsonforms.missing.value', 'Default')).toBe('Default');
    wrapper.unmount();
  });

  it('translates label elements rendered by JsonForms', () => {
    const i18n = createI18n({
      legacy: false,
      locale: 'en',
      messages: {
        en: {
          'jsonforms.sample.name.label': 'Localized label',
        },
      },
    });

    const schema = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          i18n: 'jsonforms.sample.name',
        },
      },
    };

    const uiSchema = {
      type: 'VerticalLayout',
      elements: [
        { type: 'Label', text: 'Name', i18n: 'jsonforms.sample.name' },
        { type: 'Control', scope: '#/properties/name', i18n: 'jsonforms.sample.name' },
      ],
    };

    const FormHarness = defineComponent({
      components: { JsonForms },
      setup() {
        const data = ref({});
        const jsonFormsI18n = useJsonFormsI18n();
        return {
          schema,
          uiSchema,
          data,
          renderers: vanillaRenderers,
          ajv: createAjv(),
          jsonFormsI18n,
        };
      },
      template:
        '<JsonForms :schema="schema" :uischema="uiSchema" :data="data" :renderers="renderers" :ajv="ajv" :i18n="jsonFormsI18n" />',
    });

    const wrapper = mount(FormHarness, { global: { plugins: [i18n] } });

    expect(wrapper.text()).toContain('Localized label');
    wrapper.unmount();
  });
});
