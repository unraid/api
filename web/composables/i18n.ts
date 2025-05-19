import Gettext from 'node-gettext';

import type { DirectiveBinding } from 'vue';

// Interface for translations object
interface TranslationsObject {
  [key: string]: string;
}

// Define the format expected by node-gettext
interface TranslationObject {
  msgid: string;
  msgstr: string[];
  [key: string]: unknown;
}

/**
 * Creates and configures a Gettext instance with the provided translations
 */
export function createGettextInstance(
  options: {
    translations?: TranslationsObject;
    locale?: string;
    sourceLocale?: string;
  } = {}
) {
  const sourceLocale = options.sourceLocale || 'en_US';
  const locale = options.locale || sourceLocale;

  // Create a new Gettext instance
  const gt = new Gettext({
    sourceLocale,
    debug: process.env.NODE_ENV !== 'production',
  });

  try {
    // Use translations from options or empty object if not provided
    const translations = options.translations || {};

    // Prepare translations in the format expected by node-gettext
    const gettextTranslations = {
      translations: {
        '': {} as { [msgid: string]: TranslationObject },
      },
    };

    // Add each translation
    Object.entries(translations).forEach(([key, value]) => {
      gettextTranslations.translations[''][key] = {
        msgid: key,
        msgstr: [value],
      };
    });

    // Add translations to gettext
    gt.addTranslations(locale, 'messages', gettextTranslations);
    gt.setLocale(locale);
    gt.setTextDomain('messages');
  } catch (error) {
    console.error('Failed to initialize translations:', error);
  }

  return gt;
}

/**
 * Creates a Vue directive for translation
 */
export function createTranslateDirective(gt: Gettext) {
  return {
    mounted(el: HTMLElement, binding: DirectiveBinding) {
      // If value is provided, use it as the text to translate
      const text = binding.value || el.textContent?.trim() || '';
      const translated = gt.gettext(text);

      // If content should be treated as HTML
      if (binding.modifiers.html) {
        el.innerHTML = translated;
      } else {
        el.textContent = translated;
      }
    },
    updated(el: HTMLElement, binding: DirectiveBinding) {
      const text = binding.value || el.textContent?.trim() || '';
      const translated = gt.gettext(text);

      if (binding.modifiers.html) {
        el.innerHTML = translated;
      } else {
        el.textContent = translated;
      }
    },
  };
}
