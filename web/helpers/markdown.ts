import DOMPurify from 'dompurify';
import { Marked, type MarkedExtension } from 'marked';

const defaultMarkedExtension: MarkedExtension = {
  hooks: {
    // must define as a function (instead of a lambda) to preserve/reflect bindings downstream
    postprocess(html) {
      return DOMPurify.sanitize(html);
    },
  },
};

/**
 * Helper class to build or conveniently use a markdown parser.
 */
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
