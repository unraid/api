import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';

import ar from '~/locales/ar.json';
import bn from '~/locales/bn.json';
import ca from '~/locales/ca.json';
import cs from '~/locales/cs.json';
import da from '~/locales/da.json';
import de from '~/locales/de.json';
import enUS from '~/locales/en.json';
import es from '~/locales/es.json';
import fr from '~/locales/fr.json';
import hi from '~/locales/hi.json';
import hr from '~/locales/hr.json';
import hu from '~/locales/hu.json';
import it from '~/locales/it.json';
import ja from '~/locales/ja.json';
import ko from '~/locales/ko.json';
import lv from '~/locales/lv.json';
import nl from '~/locales/nl.json';
import no from '~/locales/no.json';
import pl from '~/locales/pl.json';
import pt from '~/locales/pt.json';
import ro from '~/locales/ro.json';
import ru from '~/locales/ru.json';
import sv from '~/locales/sv.json';
import uk from '~/locales/uk.json';
import zh from '~/locales/zh.json';

import type { I18n } from 'vue-i18n';

const DEFAULT_LOCALE = 'en_US';

type LocaleMessages = typeof enUS;

const localeMessages: Record<string, LocaleMessages> = {
  en_US: enUS,
  ar: ar as unknown as LocaleMessages,
  bn: bn as unknown as LocaleMessages,
  ca: ca as unknown as LocaleMessages,
  cs: cs as unknown as LocaleMessages,
  da: da as unknown as LocaleMessages,
  de: de as unknown as LocaleMessages,
  es: es as unknown as LocaleMessages,
  fr: fr as unknown as LocaleMessages,
  hi: hi as unknown as LocaleMessages,
  hr: hr as unknown as LocaleMessages,
  hu: hu as unknown as LocaleMessages,
  it: it as unknown as LocaleMessages,
  ja: ja as unknown as LocaleMessages,
  ko: ko as unknown as LocaleMessages,
  lv: lv as unknown as LocaleMessages,
  nl: nl as unknown as LocaleMessages,
  no: no as unknown as LocaleMessages,
  pl: pl as unknown as LocaleMessages,
  pt: pt as unknown as LocaleMessages,
  ro: ro as unknown as LocaleMessages,
  ru: ru as unknown as LocaleMessages,
  sv: sv as unknown as LocaleMessages,
  uk: uk as unknown as LocaleMessages,
  zh: zh as unknown as LocaleMessages,
};

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

export async function switchLocale(i18n: I18n, locale: string): Promise<void> {
  const normalizedLocale = locale === 'en' ? DEFAULT_LOCALE : locale;

  if (!localeMessages[normalizedLocale]) {
    console.warn(
      `[switchLocale] Locale "${locale}" not available. Available locales: ${Object.keys(localeMessages).join(', ')}`
    );
    return;
  }

  const availableLocales = i18n.global.availableLocales as unknown as string[];

  if (!availableLocales.includes(normalizedLocale)) {
    i18n.global.setLocaleMessage(
      normalizedLocale as typeof DEFAULT_LOCALE,
      localeMessages[normalizedLocale]
    );
    availableLocales.push(normalizedLocale);
  }

  if (typeof i18n.global.locale === 'string') {
    i18n.global.locale = normalizedLocale as typeof DEFAULT_LOCALE;
  } else {
    i18n.global.locale.value = normalizedLocale as typeof DEFAULT_LOCALE;
  }
  await nextTick();
}
