import { createI18n } from 'vue-i18n';

import enUS from '~/locales/en.json';

const DEFAULT_LOCALE = 'en_US';

type AnyObject = Record<string, unknown>;

const flatMessages = enUS as unknown as Record<string, string>;

function resolveMessage(key: string): string | undefined {
  return flatMessages[key];
}

function replaceParams(template: string, params?: unknown): string {
  if (params === undefined || params === null) {
    return template;
  }

  let result = template;

  if (Array.isArray(params)) {
    params.forEach((value, index) => {
      result = result.replace(new RegExp(`\\{${index}\\}`, 'g'), String(value));
    });
    return result;
  }

  if (typeof params === 'object') {
    Object.entries(params as AnyObject).forEach(([placeholder, value]) => {
      result = result.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(value));
    });
    return result;
  }

  if (typeof params === 'number' || typeof params === 'string' || typeof params === 'boolean') {
    return result.replace(/\{0\}/g, String(params));
  }

  return result;
}

export const testTranslate = ((key: string, params?: unknown) => {
  const message = resolveMessage(key);
  const template = message ?? key;
  return replaceParams(template, params);
}) as unknown as import('vue-i18n').ComposerTranslation;

export function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: DEFAULT_LOCALE,
    fallbackLocale: DEFAULT_LOCALE,
    messages: {
      [DEFAULT_LOCALE]: enUS,
    },
  });
}
