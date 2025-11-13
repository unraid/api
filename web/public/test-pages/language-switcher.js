(() => {
  const localeOptions = [
    { value: 'en_US', label: 'English (US)' },
    { value: 'ar', label: 'العربية (Arabic)' },
    { value: 'bn', label: 'বাংলা (Bengali)' },
    { value: 'ca', label: 'Català (Catalan)' },
    { value: 'cs', label: 'Čeština (Czech)' },
    { value: 'da', label: 'Dansk (Danish)' },
    { value: 'de', label: 'Deutsch (German)' },
    { value: 'es', label: 'Español (Spanish)' },
    { value: 'fr', label: 'Français (French)' },
    { value: 'hi', label: 'हिन्दी (Hindi)' },
    { value: 'hr', label: 'Hrvatski (Croatian)' },
    { value: 'hu', label: 'Magyar (Hungarian)' },
    { value: 'it', label: 'Italiano (Italian)' },
    { value: 'ja', label: '日本語 (Japanese)' },
    { value: 'ko', label: '한국어 (Korean)' },
    { value: 'lv', label: 'Latviešu (Latvian)' },
    { value: 'nl', label: 'Nederlands (Dutch)' },
    { value: 'no', label: 'Norsk (Norwegian)' },
    { value: 'pl', label: 'Polski (Polish)' },
    { value: 'pt', label: 'Português (Portuguese)' },
    { value: 'ro', label: 'Română (Romanian)' },
    { value: 'ru', label: 'Русский (Russian)' },
    { value: 'sv', label: 'Svenska (Swedish)' },
    { value: 'uk', label: 'Українська (Ukrainian)' },
    { value: 'zh', label: '中文 (Chinese)' },
  ];

  if (document.getElementById('test-language-switcher')) {
    return;
  }

  const style = document.createElement('style');
  style.textContent = `
    #test-language-switcher {
      position: fixed;
      right: 16px;
      bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 12px;
      border-radius: 8px;
      background: rgba(17, 24, 39, 0.9);
      color: #f9fafb;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.35);
      z-index: 9999;
      max-width: 240px;
      font-family: system-ui, -apple-system, sans-serif;
    }

    #test-language-switcher label {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    #test-language-switcher select {
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.4);
      background: rgba(15, 23, 42, 0.9);
      color: #f9fafb;
      font-size: 14px;
      outline: none;
      cursor: pointer;
    }

    #test-language-switcher select:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
    }

    #test-language-switcher .info {
      font-size: 12px;
      color: rgba(226, 232, 240, 0.8);
      line-height: 1.4;
    }
  `;

  const container = document.createElement('div');
  container.id = 'test-language-switcher';

  const label = document.createElement('label');
  label.htmlFor = 'test-language-select';
  label.textContent = 'Language';

  const select = document.createElement('select');
  select.id = 'test-language-select';

  const STORAGE_KEY = 'unraid:test:locale';
  const availableLocales = new Set(localeOptions.map((option) => option.value));

  const readPersistedLocale = () => {
    let persisted;
    try {
      persisted = window.localStorage?.getItem(STORAGE_KEY) ?? undefined;
    } catch {
      persisted = undefined;
    }
    return persisted;
  };

  const resolveInitialLocale = () => {
    const candidates = [
      typeof window.LOCALE === 'string' ? window.LOCALE : undefined,
      readPersistedLocale(),
      'en_US',
    ];

    for (const candidate of candidates) {
      if (candidate && availableLocales.has(candidate)) {
        return candidate;
      }
    }

    return 'en_US';
  };

  const initialLocale = resolveInitialLocale();
  window.LOCALE = initialLocale;
  let currentLocale = initialLocale;

  localeOptions.forEach((option) => {
    const optionElement = document.createElement('option');
    optionElement.value = option.value;
    optionElement.textContent = option.label;
    if (option.value === currentLocale) {
      optionElement.selected = true;
    }
    select.appendChild(optionElement);
  });

  select.addEventListener('change', (event) => {
    const nextLocale = event.target.value;
    if (nextLocale === currentLocale) {
      return;
    }
    try {
      window.localStorage?.setItem(STORAGE_KEY, nextLocale);
    } catch {
      // ignore
    }
    window.LOCALE = nextLocale;
    currentLocale = nextLocale;
    window.location.reload();
  });

  const info = document.createElement('div');
  info.className = 'info';
  info.textContent = 'Reloads the page to load components in the selected locale.';

  container.appendChild(label);
  container.appendChild(select);
  container.appendChild(info);

  const attach = () => {
    if (!document.head.contains(style)) {
      document.head.appendChild(style);
    }
    if (!document.body.contains(container)) {
      document.body.appendChild(container);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach, { once: true });
  } else {
    attach();
  }
})();
