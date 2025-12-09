export const isDarkModeActive = (): boolean => {
  if (typeof document === 'undefined') return false;

  const cssVar = getComputedStyle(document.documentElement).getPropertyValue('--theme-dark-mode').trim();
  if (cssVar === '1') return true;

  if (document.documentElement.classList.contains('dark')) return true;
  if (document.body?.classList.contains('dark')) return true;
  if (document.querySelector('.unapi.dark')) return true;

  return false;
};
