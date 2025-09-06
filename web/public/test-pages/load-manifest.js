// JavaScript version of the PHP WebComponentsExtractor
// This loads the manifest and injects the CSS and JS files

(function () {
  'use strict';

  // Detect if we're in dev mode (Vite dev server)
  const isDevMode = window.location.port === '3000' || window.location.hostname === 'localhost';

  // Function to load resources in dev mode with hot reloading
  async function loadDevResources() {
    console.log('Loading resources in dev mode with hot reloading');

    // In dev mode, load the source files directly through Vite
    // CSS is imported within component-registry.ts, so Vite will handle it
    if (!document.getElementById('unraid-dev-mount')) {
      const script = document.createElement('script');
      script.id = 'unraid-dev-mount';
      script.type = 'module';
      // Load the source file directly - Vite will handle HMR and CSS
      script.src = '/src/components/component-registry.ts';
      script.setAttribute('data-unraid', '1');
      document.head.appendChild(script);
      console.log('Loaded dev script with HMR and CSS: /src/components/component-registry.ts');
    }
  }

  // Function to load manifest and inject resources (production mode)
  async function loadManifestResources() {
    try {
      // Fetch the manifest
      const response = await fetch('/dist/manifest.json');
      if (!response.ok) {
        console.warn('Manifest not found, attempting direct load');
        // Fallback: try to load files directly without manifest
        loadDirectResources();
        return;
      }

      const manifest = await response.json();
      console.log('Loaded manifest:', manifest);

      // Process each entry in the manifest
      Object.entries(manifest).forEach(([key, entry]) => {
        if (!entry || !entry.file) return;

        const filePath = `/dist/${entry.file}`;
        const extension = entry.file.split('.').pop();

        // Create unique ID for deduplication
        const elementId = `unraid-${key.replace(/[^a-zA-Z0-9-]/g, '-')}`;

        // Check if already loaded
        if (document.getElementById(elementId)) {
          console.log(`Resource already loaded: ${elementId}`);
          return;
        }

        // Load JavaScript files
        if (extension === 'js' || extension === 'mjs') {
          const script = document.createElement('script');
          script.id = elementId;
          script.type = 'module';
          script.src = filePath;
          script.setAttribute('data-unraid', '1');
          document.head.appendChild(script);
          console.log(`Loaded script: ${filePath}`);

          // Load associated CSS files from manifest
          if (entry.css && Array.isArray(entry.css)) {
            entry.css.forEach((cssFile, index) => {
              const cssPath = `/dist/${cssFile}`;
              const cssId = `${elementId}-css-${index}`;

              if (!document.getElementById(cssId)) {
                const link = document.createElement('link');
                link.id = cssId;
                link.rel = 'stylesheet';
                link.href = cssPath;
                link.setAttribute('data-unraid', '1');
                document.head.appendChild(link);
                console.log(`Loaded CSS: ${cssPath}`);
              }
            });
          }
        }
        // Load standalone CSS files
        else if (extension === 'css') {
          const link = document.createElement('link');
          link.id = elementId;
          link.rel = 'stylesheet';
          link.href = filePath;
          link.setAttribute('data-unraid', '1');
          document.head.appendChild(link);
          console.log(`Loaded CSS: ${filePath}`);
        }
      });
    } catch (error) {
      console.error('Error loading manifest:', error);
      // Fallback to direct loading
      loadDirectResources();
    }
  }

  // Fallback function to load resources directly without manifest
  function loadDirectResources() {
    console.log('Loading resources directly (fallback mode)');

    // Load the main CSS file
    if (!document.getElementById('unraid-standalone-css')) {
      const link = document.createElement('link');
      link.id = 'unraid-standalone-css';
      link.rel = 'stylesheet';
      link.href = '/dist/standalone-apps.css';
      link.setAttribute('data-unraid', '1');
      document.head.appendChild(link);
      console.log('Loaded CSS: /dist/standalone-apps.css');
    }

    // Load the main JS file
    if (!document.getElementById('unraid-standalone-js')) {
      const script = document.createElement('script');
      script.id = 'unraid-standalone-js';
      script.type = 'module';
      script.src = '/dist/standalone-apps.js';
      script.setAttribute('data-unraid', '1');
      document.head.appendChild(script);
      console.log('Loaded script: /dist/standalone-apps.js');
    }
  }

  // Remove duplicate resources (same logic as PHP)
  function removeDuplicates() {
    const elements = document.querySelectorAll('[data-unraid="1"]');
    const seen = {};

    elements.forEach((el) => {
      if (seen[el.id]) {
        el.remove();
        console.log(`Removed duplicate: ${el.id}`);
      } else {
        seen[el.id] = true;
      }
    });
  }

  // Initialize - choose dev or production mode
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (isDevMode) {
        loadDevResources().then(removeDuplicates);
      } else {
        loadManifestResources().then(removeDuplicates);
      }
    });
  } else {
    if (isDevMode) {
      loadDevResources().then(removeDuplicates);
    } else {
      loadManifestResources().then(removeDuplicates);
    }
  }
})();
