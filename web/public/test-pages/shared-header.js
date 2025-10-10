// Shared header component for all test pages
// This provides consistent navigation and server state management

(function () {
  'use strict';

  // Function to inject the shared header HTML
  window.injectSharedHeader = function () {
    const headerHTML = `
      <!-- Shared Test Header -->
      <div id="shared-test-header" class="test-header">
        <div class="test-header-main">
          <div class="test-header-left">
            <h1 class="test-header-title">
              <a href="/test-pages/" style="color: inherit; text-decoration: none;">
                🧪 Unraid Component Test
              </a>
            </h1>
            <span class="test-header-subtitle" id="page-title"></span>
          </div>
          <div class="test-header-right">
            <div class="server-state-selector">
              <label>Theme:</label>
              <select id="theme-select">
                <option value="white">White</option>
                <option value="black">Black</option>
                <option value="gray">Gray</option>
                <option value="azure">Azure</option>
              </select>
            </div>
            <div class="server-state-selector">
              <label>Server State:</label>
              <select id="server-state-select">
                <option value="default">Default (Pro)</option>
                <option value="trial">Trial</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <button id="refresh-state" class="header-btn">↻ Refresh</button>
            <button id="toggle-console" class="header-btn">📋 Console</button>
          </div>
        </div>
        
        <!-- Navigation -->
        <nav class="test-header-nav">
          <a href="/test-pages/" class="nav-link">Home</a>
          <a href="/test-pages/all-components.html" class="nav-link">All Components</a>
          <a href="/test-pages/dashboard.html" class="nav-link">Dashboard</a>
          <a href="/test-pages/settings.html" class="nav-link">Settings</a>
          <a href="/test-pages/authentication.html" class="nav-link">Authentication</a>
          <a href="/test-pages/os-management.html" class="nav-link">OS Management</a>
        </nav>
        
        <!-- Console (hidden by default) -->
        <div id="test-console" class="test-console" style="display: none;">
          <div class="console-header">
            <span>Test Console</span>
            <button id="clear-console" class="console-btn">Clear</button>
          </div>
          <div id="console-output" class="console-output">
            > Console ready...
          </div>
        </div>
      </div>
      
      <style>
        /* Global font size overrides to match Unraid's 10px base */
        :root {
          --text-xs: 0.75rem !important;
          --text-sm: 0.875rem !important;
          --text-base: 1rem !important;
          --text-lg: 1.125rem !important;
          --text-xl: 1.25rem !important;
          --text-2xl: 1.5rem !important;
          --text-3xl: 1.875rem !important;
          --text-4xl: 2.25rem !important;
          --text-5xl: 3rem !important;
          --text-6xl: 3.75rem !important;
          --text-7xl: 4.5rem !important;
          --text-8xl: 6rem !important;
          --text-9xl: 8rem !important;
        }
        
        /* Force Tailwind text size classes to use our values */
        .text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
        .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
        .text-base { font-size: 1rem !important; line-height: 1.5rem !important; }
        .text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
        .text-xl { font-size: 1.25rem !important; line-height: 1.75rem !important; }
        .text-2xl { font-size: 1.5rem !important; line-height: 2rem !important; }
        .text-3xl { font-size: 1.875rem !important; line-height: 2.25rem !important; }
        .text-4xl { font-size: 2.25rem !important; line-height: 2.5rem !important; }
        .text-5xl { font-size: 3rem !important; line-height: 1 !important; }
        .text-6xl { font-size: 3.75rem !important; line-height: 1 !important; }
        .text-7xl { font-size: 4.5rem !important; line-height: 1 !important; }
        .text-8xl { font-size: 6rem !important; line-height: 1 !important; }
        .text-9xl { font-size: 8rem !important; line-height: 1 !important; }
        
        .test-header {
          background: white;
          border-bottom: 2px solid #e5e7eb;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          position: sticky;
          top: 0;
          z-index: 1000;
          margin: -20px -20px 20px -20px;
        }
        
        .test-header-main {
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }
        
        .test-header-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .test-header-title {
          margin: 0;
          font-size: 20px;
          color: #1f2937;
        }
        
        .test-header-subtitle {
          color: #6b7280;
          font-size: 14px;
          padding-left: 15px;
          border-left: 2px solid #e5e7eb;
        }
        
        .test-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .server-state-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-right: 15px;
          border-right: 1px solid #e5e7eb;
        }
        
        .server-state-selector label {
          color: #6b7280;
          font-size: 14px;
        }
        
        .server-state-selector select {
          padding: 5px 10px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
          color: #1f2937;
          font-size: 14px;
          cursor: pointer;
        }
        
        .header-btn {
          padding: 6px 12px;
          background: #f3f4f6;
          color: #4b5563;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .header-btn:hover {
          background: #e5e7eb;
          color: #1f2937;
        }
        
        .test-header-nav {
          background: #f9fafb;
          padding: 0 20px;
          display: flex;
          gap: 0;
          border-top: 1px solid #e5e7eb;
        }
        
        .nav-link {
          padding: 10px 15px;
          color: #6b7280;
          text-decoration: none;
          font-size: 14px;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        
        .nav-link:hover {
          color: #1f2937;
          background: #f3f4f6;
        }
        
        .nav-link.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }
        
        .test-console {
          background: #1f2937;
          border-top: 1px solid #374151;
        }
        
        .console-header {
          padding: 8px 20px;
          background: #111827;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          font-size: 14px;
        }
        
        .console-btn {
          padding: 4px 10px;
          background: #374151;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .console-btn:hover {
          background: #4b5563;
        }
        
        .console-output {
          padding: 15px 20px;
          color: #10b981;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 12px;
          max-height: 200px;
          overflow-y: auto;
          white-space: pre-wrap;
        }
        
        @media (max-width: 768px) {
          .test-header-main {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .test-header-nav {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
        }
      </style>
    `;

    // Insert at the beginning of body
    const bodyFirstChild = document.body.firstChild;
    const headerContainer = document.createElement('div');
    headerContainer.innerHTML = headerHTML;
    document.body.insertBefore(headerContainer.firstChild, bodyFirstChild);

    // Add padding to body to account for sticky header
    document.body.style.paddingTop = '20px';
  };

  // Function to initialize header functionality
  window.initializeSharedHeader = function (pageTitle) {
    // Set page title
    if (pageTitle) {
      const titleElement = document.getElementById('page-title');
      if (titleElement) {
        titleElement.textContent = pageTitle;
      }
    }

    // Mark active navigation link
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach((link) => {
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
      }
    });

    // Console functionality
    const consoleOutput = document.getElementById('console-output');
    const testConsole = document.getElementById('test-console');

    window.testLog = function (message, type = 'info') {
      if (!consoleOutput) return;

      const timestamp = new Date().toLocaleTimeString();
      const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '>';
      const color = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#10b981';

      const logLine = document.createElement('div');
      logLine.style.color = color;
      logLine.textContent = `${prefix} [${timestamp}] ${message}`;
      consoleOutput.appendChild(logLine);
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    };

    // Toggle console
    document.getElementById('toggle-console')?.addEventListener('click', function () {
      if (testConsole) {
        const isVisible = testConsole.style.display !== 'none';
        testConsole.style.display = isVisible ? 'none' : 'block';
        this.textContent = isVisible ? '📋 Console' : '📋 Hide';
      }
    });

    // Clear console
    document.getElementById('clear-console')?.addEventListener('click', function () {
      if (consoleOutput) {
        consoleOutput.innerHTML = '> Console cleared...';
      }
    });

    // Server state selector
    const stateSelect = document.getElementById('server-state-select');
    if (stateSelect && window.applyServerStateToComponents) {
      stateSelect.addEventListener('change', function () {
        const selectedState = this.value;
        window.applyServerStateToComponents(selectedState);
        window.testLog(`Server state changed to: ${selectedState}`, 'success');
      });
    }

    // Refresh state button
    document.getElementById('refresh-state')?.addEventListener('click', function () {
      const currentState = stateSelect?.value || 'default';
      if (window.applyServerStateToComponents) {
        window.applyServerStateToComponents(currentState);
        window.testLog('Server state refreshed', 'success');
      }
    });

    // Initial log
    window.testLog('Test page initialized');

    // Load and apply server state after a delay
    setTimeout(function () {
      if (window.applyServerStateToComponents) {
        window.applyServerStateToComponents('default');
        window.testLog('Server state applied to components', 'success');
      }
    }, 1000);
  };

  // Function to set base font size to match Unraid's 10px
  window.setBaseFontSize = function () {
    const baseFontStyle = document.createElement('style');
    baseFontStyle.id = 'unraid-base-font';
    baseFontStyle.innerHTML = `
      /* Match Unraid's 10px base font size */
      html {
        font-size: 10px;
      }
    `;
    document.head.appendChild(baseFontStyle);
  };

  // Function to load Unraid theme CSS files
  window.loadUnraidTheme = function (theme) {
    const selectedTheme = theme || localStorage.getItem('unraid-test-theme') || 'white';

    // Save theme preference
    localStorage.setItem('unraid-test-theme', selectedTheme);

    // Remove existing theme CSS
    document.querySelectorAll('[data-unraid-theme]').forEach((el) => el.remove());

    const baseUrl =
      'https://raw.githubusercontent.com/unraid/webgui/refs/heads/master/emhttp/plugins/dynamix/styles';

    // Load CSS files in order
    const cssFiles = [
      { href: `${baseUrl}/default-base.css`, id: 'unraid-base' },
      { href: `${baseUrl}/default-dynamix.css`, id: 'unraid-dynamix' },
      { href: `${baseUrl}/themes/${selectedTheme}.css`, id: 'unraid-theme' },
    ];

    cssFiles.forEach(({ href, id }) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.id = id;
      link.setAttribute('data-unraid-theme', 'true');
      document.head.appendChild(link);
    });

    if (window.testLog) {
      window.testLog(`Loaded Unraid ${selectedTheme} theme`, 'info');
    }
  };

  // Auto-inject and initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.setBaseFontSize();
      window.loadUnraidTheme();
      window.injectSharedHeader();
      // Get page title from existing h1 or title tag
      const existingTitle =
        document.querySelector('h1')?.textContent ||
        document.title.replace(' - Unraid Component Test', '');
      window.initializeSharedHeader(existingTitle);

      // Setup theme selector
      const themeSelect = document.getElementById('theme-select');
      if (themeSelect) {
        const savedTheme = localStorage.getItem('unraid-test-theme') || 'white';
        themeSelect.value = savedTheme;

        themeSelect.addEventListener('change', (e) => {
          window.loadUnraidTheme(e.target.value);
        });
      }
    });
  } else {
    window.setBaseFontSize();
    window.loadUnraidTheme();
    window.injectSharedHeader();
    const existingTitle =
      document.querySelector('h1')?.textContent ||
      document.title.replace(' - Unraid Component Test', '');
    window.initializeSharedHeader(existingTitle);

    // Setup theme selector
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      const savedTheme = localStorage.getItem('unraid-test-theme') || 'white';
      themeSelect.value = savedTheme;

      themeSelect.addEventListener('change', (e) => {
        window.loadUnraidTheme(e.target.value);
      });
    }
  }
})();
