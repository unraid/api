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

  if (document.getElementById('dev-tools')) {
    return;
  }

  const style = document.createElement('style');
  style.textContent = `
    #dev-tools {
      position: fixed;
      right: 16px;
      bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      background: rgba(17, 24, 39, 0.95);
      color: #f9fafb;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.35);
      z-index: 9999;
      max-width: 260px;
      font-family: system-ui, -apple-system, sans-serif;
      backdrop-filter: blur(8px);
    }

    #dev-tools h3 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #60a5fa;
    }

    #dev-tools .control-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    #dev-tools label {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
      color: rgba(226, 232, 240, 0.9);
    }

    #dev-tools select {
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.4);
      background: rgba(15, 23, 42, 0.9);
      color: #f9fafb;
      font-size: 13px;
      outline: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    #dev-tools select:hover {
      border-color: rgba(148, 163, 184, 0.6);
    }

    #dev-tools select:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
    }

    #dev-tools .info {
      font-size: 11px;
      color: rgba(226, 232, 240, 0.7);
      line-height: 1.4;
      margin-top: 4px;
    }

    #dev-tools .divider {
      height: 1px;
      background: rgba(148, 163, 184, 0.2);
      margin: 4px 0;
    }
  `;

  const container = document.createElement('div');
  container.id = 'dev-tools';

  const title = document.createElement('h3');
  title.textContent = '🛠️ Dev Tools';

  const localeGroup = document.createElement('div');
  localeGroup.className = 'control-group';

  const localeLabel = document.createElement('label');
  localeLabel.htmlFor = 'dev-locale-select';
  localeLabel.textContent = 'Language';

  const localeSelect = document.createElement('select');
  localeSelect.id = 'dev-locale-select';

  const themeGroup = document.createElement('div');
  themeGroup.className = 'control-group';

  const themeLabel = document.createElement('label');
  themeLabel.htmlFor = 'dev-theme-switcher';
  themeLabel.textContent = 'Theme';

  const themeSwitcherContainer = document.createElement('div');
  themeSwitcherContainer.id = 'dev-theme-switcher-container';

  const STORAGE_KEY_LOCALE = 'unraid:test:locale';
  const availableLocales = new Set(localeOptions.map((option) => option.value));

  const readPersistedLocale = () => {
    try {
      return window.localStorage?.getItem(STORAGE_KEY_LOCALE) ?? undefined;
    } catch {
      return undefined;
    }
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
    localeSelect.appendChild(optionElement);
  });

  const createThemeSwitcher = () => {
    const themeSwitcherElement = document.createElement('unraid-dev-theme-switcher');
    themeSwitcherContainer.appendChild(themeSwitcherElement);
  };

  localeSelect.addEventListener('change', (event) => {
    const nextLocale = event.target.value;
    if (nextLocale === currentLocale) {
      return;
    }
    try {
      window.localStorage?.setItem(STORAGE_KEY_LOCALE, nextLocale);
    } catch {
      // ignore
    }
    window.LOCALE = nextLocale;
    currentLocale = nextLocale;
    window.location.reload();
  });

  const localeInfo = document.createElement('div');
  localeInfo.className = 'info';
  localeInfo.textContent = 'Reloads page to apply locale.';

  const themeInfo = document.createElement('div');
  themeInfo.className = 'info';
  themeInfo.textContent = 'Updates theme instantly via Vue component.';

  localeGroup.appendChild(localeLabel);
  localeGroup.appendChild(localeSelect);
  localeGroup.appendChild(localeInfo);

  themeGroup.appendChild(themeLabel);
  themeGroup.appendChild(themeSwitcherContainer);
  themeGroup.appendChild(themeInfo);

  container.appendChild(title);
  container.appendChild(localeGroup);

  const divider = document.createElement('div');
  divider.className = 'divider';
  container.appendChild(divider);

  container.appendChild(themeGroup);

  const attach = () => {
    if (!document.head.contains(style)) {
      document.head.appendChild(style);
    }
    if (!document.body.contains(container)) {
      document.body.appendChild(container);
    }
  };

  const initializeTheme = () => {
    createThemeSwitcher();
  };

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        attach();
        initializeTheme();
      },
      { once: true }
    );
  } else {
    attach();
    initializeTheme();
  }
})();
