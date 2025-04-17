import { clsx, type ClassValue } from 'clsx';
import DOMPurify from 'dompurify';
import { Marked, type MarkedExtension } from 'marked';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const defaultMarkedExtension: MarkedExtension = {
  hooks: {
    // must define as a function (instead of a lambda) to preserve/reflect bindings downstream
    postprocess(html) {
      return DOMPurify.sanitize(html, {
        FORBID_TAGS: ['style'],
        FORBID_ATTR: ['style'],
      });
    },
  },
};

/**
 * Helper class to build or conveniently use a markdown parser.
 *
 * - Use `Markdown.create` to extend or customize parsing functionality.
 * - Use `Markdown.parse` to conveniently parse markdown to safe html.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Markdown {
  private static instance = Markdown.create();

  /**
   * Creates a `Marked` instance with default MarkedExtension's already added.
   *
   * Default behaviors:
   * - Sanitizes html after parsing
   *
   * @param args any number of Marked Extensions
   * @returns Marked parser instance
   */
  static create(...args: Parameters<Marked['use']>) {
    return new Marked(defaultMarkedExtension, ...args);
  }

  /**
   * Parses arbitrary markdown content as sanitized html. May throw if parsing fails.
   *
   * @param markdownContent string of markdown content
   * @returns safe, sanitized html content
   */
  static async parse(markdownContent: string): Promise<string> {
    return Markdown.instance.parse(markdownContent);
  }
}
