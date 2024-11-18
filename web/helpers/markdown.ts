import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * Parses arbitrary markdown content as sanitized html. May throw if parsing fails.
 *
 * @param markdownContent string of markdown content
 * @returns safe, sanitized html content
 */
export async function safeParseMarkdown(markdownContent: string) {
  const parsed = await marked.parse(markdownContent);
  return DOMPurify.sanitize(parsed);
}
