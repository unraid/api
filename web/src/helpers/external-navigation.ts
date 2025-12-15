/**
 * Helper to ensure external URLs have a protocol
 */
function normalizeUrl(url: string): string {
  // If it starts with www. and doesn't have a protocol, add https://
  if (url.startsWith('www.') && !url.match(/^https?:\/\//)) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Navigates to a new URL.
 * Equivalent to window.location.assign()
 */
export const navigate = (url: string) => {
  const target = normalizeUrl(url);
  window.location.assign(target);
};

/**
 * Navigates to a new URL without keeping the current page in history.
 * Equivalent to window.location.replace()
 */
export const replace = (url: string) => {
  const target = normalizeUrl(url);
  window.location.replace(target);
};
