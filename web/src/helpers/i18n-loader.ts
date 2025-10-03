import { createI18n } from 'vue-i18n';

import { createHtmlEntityDecoder } from '~/helpers/i18n-utils';
import enUS from '~/locales/en.json';

type LocaleMessages = typeof enUS;

type LocaleModule = () => Promise<{ default: LocaleMessages }>;

const DEFAULT_LOCALE = 'en_US';

const localeModules = import.meta.glob<{ default: LocaleMessages }>('../locales/*.json');

const localeLoaders = new Map<string, LocaleModule>();
for (const [path, loader] of Object.entries(localeModules)) {
  const match = path.match(/\/([^/]+)\.json$/);
  if (!match) continue;
  const rawLocale = match[1];
  const normalized = rawLocale === 'en' ? DEFAULT_LOCALE : rawLocale;
  if (normalized === DEFAULT_LOCALE) {
    continue;
  }
  localeLoaders.set(normalized, loader as LocaleModule);
}

const supportedLocaleCache = new Set<string>([DEFAULT_LOCALE, ...localeLoaders.keys()]);

function normalizeLocaleCode(locale: string): string | undefined {
  if (!locale) return undefined;

  if (supportedLocaleCache.has(locale)) {
    return locale;
  }

  const normalized = locale.replace('-', '_');
  if (supportedLocaleCache.has(normalized)) {
    return normalized;
  }

  const base = locale.split(/[-_]/)[0];
  if (!base) return undefined;

  for (const candidate of supportedLocaleCache) {
    if (candidate.toLowerCase() === base.toLowerCase()) {
      return candidate;
    }
  }

  return undefined;
}

export function resolveLocale(candidate?: string): string {
  if (!candidate) {
    return DEFAULT_LOCALE;
  }
  return normalizeLocaleCode(candidate) ?? DEFAULT_LOCALE;
}

export function createI18nInstance() {
  return createI18n({
    legacy: false,
    locale: DEFAULT_LOCALE,
    fallbackLocale: DEFAULT_LOCALE,
    messages: {
      [DEFAULT_LOCALE]: enUS,
    },
    postTranslation: createHtmlEntityDecoder(),
  });
}

type UnwrappedI18n = ReturnType<typeof createI18nInstance>;

async function loadLocaleMessages(locale: string): Promise<LocaleMessages | undefined> {
  if (locale === DEFAULT_LOCALE) {
    return enUS;
  }

  const loader = localeLoaders.get(locale);
  if (!loader) {
    console.warn(`[i18n] Locale "${locale}" not found. Falling back to ${DEFAULT_LOCALE}.`);
    return undefined;
  }

  try {
    const module = await loader();
    return module?.default ?? undefined;
  } catch (error) {
    console.error(`[i18n] Failed to load locale "${locale}".`, error);
    return undefined;
  }
}

export async function ensureLocale(i18n: UnwrappedI18n, requested?: string): Promise<string> {
  const targetLocale = resolveLocale(requested);
  const currentLocale = String(i18n.global.locale.value ?? '');

  if (targetLocale === currentLocale) {
    return targetLocale;
  }

  const availableLocales = i18n.global.availableLocales as unknown as string[];

  if (!availableLocales.includes(targetLocale)) {
    const messages = await loadLocaleMessages(targetLocale);
    if (!messages) {
      i18n.global.locale.value = DEFAULT_LOCALE;
      return DEFAULT_LOCALE;
    }
    i18n.global.setLocaleMessage(targetLocale as typeof DEFAULT_LOCALE, messages);
    availableLocales.push(targetLocale);
  }

  i18n.global.locale.value = targetLocale as typeof DEFAULT_LOCALE;
  return targetLocale;
}

export function getWindowLocale(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window.LOCALE;
}

export { DEFAULT_LOCALE };
