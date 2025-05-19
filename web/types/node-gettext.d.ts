declare module 'node-gettext' {
  interface GettextOptions {
    sourceLocale?: string;
    debug?: boolean;
  }

  interface TranslationObject {
    msgid: string;
    msgstr: string[];
    [key: string]: unknown;
  }

  interface TranslationsFormat {
    [context: string]: {
      [msgid: string]: TranslationObject;
    };
  }

  class Gettext {
    constructor(options?: GettextOptions);
    
    addTranslations(locale: string, domain: string, translations: { translations: TranslationsFormat }): void;
    setLocale(locale: string): void;
    setTextDomain(domain: string): void;
    
    gettext(msgid: string): string;
    dgettext(domain: string, msgid: string): string;
    ngettext(msgid: string, msgidPlural: string, count: number): string;
    dngettext(domain: string, msgid: string, msgidPlural: string, count: number): string;
    pgettext(msgctxt: string, msgid: string): string;
    dpgettext(domain: string, msgctxt: string, msgid: string): string;
    npgettext(msgctxt: string, msgid: string, msgidPlural: string, count: number): string;
    dnpgettext(domain: string, msgctxt: string, msgid: string, msgidPlural: string, count: number): string;
    
    on(event: string, callback: (error: Error) => void): void;
    off(event: string, callback: (error: Error) => void): void;
  }

  export default Gettext;
} 