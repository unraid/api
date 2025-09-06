/**
 * Creates a post-translation function that decodes HTML entities in translated strings.
 * This function is typically used with createI18n to handle HTML-encoded translations.
 *
 * @returns A function that takes a translated value and decodes any HTML entities if it's a string.
 *          If the input is not a string, it returns the original value unchanged.
 *
 * @example
 * const decode = createHtmlEntityDecoder();
 * decode("&amp;"); // Returns "&"
 * decode(123); // Returns 123
 * const i18n = createI18n({
 *  // ... other options
 *  postTranslation(translated) {
 *   return decode(translated);
 *  },
 * });
 */
export const createHtmlEntityDecoder = () => {
  const parser = new DOMParser();
  return <T>(translated: T) => {
    if (typeof translated !== 'string') return translated;
    const decoded = parser.parseFromString(translated, 'text/html').documentElement.textContent;
    return decoded ?? translated;
  };
};
