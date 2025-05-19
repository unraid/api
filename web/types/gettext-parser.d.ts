declare module 'gettext-parser' {
  interface Translation {
    msgid: string;
    msgstr: string[];
    msgctxt?: string;
    msgid_plural?: string;
    comments?: {
      translator?: string;
      reference?: string;
      extracted?: string;
      flag?: string;
      previous?: string;
    };
  }

  interface Translations {
    [context: string]: {
      [msgid: string]: Translation;
    };
  }

  interface TranslationsObject {
    charset?: string;
    headers?: Record<string, string>;
    translations: {
      [context: string]: {
        [msgid: string]: Translation;
      };
    };
  }

  interface ParserOptions {
    defaultCharset?: string;
    encoding?: string;
    [key: string]: unknown;
  }

  export const po: {
    parse(buffer: Buffer | string, options?: ParserOptions): TranslationsObject;
    compile(data: TranslationsObject, options?: ParserOptions): Buffer;
  };

  export const mo: {
    parse(buffer: Buffer, options?: ParserOptions): TranslationsObject;
    compile(data: TranslationsObject, options?: ParserOptions): Buffer;
  };

  export const json: {
    parse(data: string): TranslationsObject;
    compile(data: TranslationsObject): string;
  };
} 