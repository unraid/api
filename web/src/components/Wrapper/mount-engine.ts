import { createApp, createVNode, h, render } from 'vue';
import { createI18n } from 'vue-i18n';
import { DefaultApolloClient } from '@vue/apollo-composable';
import UApp from '@nuxt/ui/components/App.vue';
import ui from '@nuxt/ui/vue-plugin';

// Import component registry (only imported here to avoid ordering issues)
import { componentMappings } from '@/components/Wrapper/component-registry';
import { client } from '~/helpers/create-apollo-client';
import { createHtmlEntityDecoder } from '~/helpers/i18n-utils';
import en_US from '~/locales/en_US.json';

import type { App as VueApp } from 'vue';

// Import Pinia for use in Vue apps
import { globalPinia } from '~/store/globalPinia';

// Ensure Apollo client is singleton
const apolloClient = (typeof window !== 'undefined' && window.apolloClient) || client;

// Expose globally for debugging
declare global {
  interface Window {
    globalPinia: typeof globalPinia;
    __unifiedApp?: VueApp;
  }
}

if (typeof window !== 'undefined') {
  window.globalPinia = globalPinia;
}

function setupI18n() {
  const defaultLocale = 'en_US';
  let parsedLocale = '';
  let parsedMessages = {};
  let nonDefaultLocale = false;

  // Check for window locale data
  if (typeof window !== 'undefined') {
    const windowLocaleData = (window as unknown as { LOCALE_DATA?: string }).LOCALE_DATA || null;
    if (windowLocaleData) {
      try {
        parsedMessages = JSON.parse(decodeURIComponent(windowLocaleData));
        parsedLocale = Object.keys(parsedMessages)[0];
        nonDefaultLocale = parsedLocale !== defaultLocale;
      } catch (error) {
        console.error('[VueMountApp] error parsing messages', error);
      }
    }
  }

  return createI18n({
    legacy: false,
    locale: nonDefaultLocale ? parsedLocale : defaultLocale,
    fallbackLocale: defaultLocale,
    messages: {
      en_US,
      ...(nonDefaultLocale ? parsedMessages : {}),
    },
    postTranslation: createHtmlEntityDecoder(),
  });
}

// Helper function to parse props from HTML attributes
function parsePropsFromElement(element: Element): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  for (const attr of element.attributes) {
    const name = attr.name;
    const value = attr.value;

    // Skip Vue internal attributes and common HTML attributes
    if (name.startsWith('data-v-') || name === 'class' || name === 'id' || name === 'style') {
      continue;
    }

    // Try to parse JSON values (handles HTML-encoded JSON)
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        // Decode HTML entities first
        const decoded = value
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'");
        props[name] = JSON.parse(decoded);
      } catch (_e) {
        // If JSON parsing fails, use as string
        props[name] = value;
      }
    } else {
      props[name] = value;
    }
  }

  return props;
}

// Create and mount unified app with shared context
export function mountUnifiedApp() {
  // Create a minimal app just for context sharing
  const app = createApp({
    name: 'UnifiedContextApp',
    render: () => h('div', 'Context Provider'),
  });

  // Setup everything once
  const i18n = setupI18n();
  app.use(i18n);
  app.use(globalPinia);
  app.use(ui);
  app.provide(DefaultApolloClient, apolloClient);

  // Mount the app to establish context
  let rootElement = document.getElementById('unraid-unified-root');
  if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.id = 'unraid-unified-root';
    rootElement.style.display = 'none';
    document.body.appendChild(rootElement);
  }
  app.mount(rootElement);

  // Now render components to their locations using the shared context
  const mountedComponents: Array<{ element: HTMLElement; unmount: () => void }> = [];

  // Batch all selector queries first to identify which components are needed
  const componentsToMount: Array<{ mapping: (typeof componentMappings)[0]; element: HTMLElement }> = [];

  componentMappings.forEach((mapping) => {
    const { selector } = mapping;
    const selectors = Array.isArray(selector) ? selector : [selector];

    // Find first matching element
    for (const sel of selectors) {
      const element = document.querySelector(sel) as HTMLElement;
      if (element && !element.hasAttribute('data-vue-mounted')) {
        componentsToMount.push({ mapping, element });
        break;
      }
    }
  });

  // Now mount only the components that exist
  componentsToMount.forEach(({ mapping, element }) => {
    const { appId } = mapping;
    const component = mapping.component;

    // Skip if no component is defined
    if (!component) {
      console.error(`[UnifiedMount] No component defined for ${appId}`);
      return;
    }

    // Parse props from element
    const props = parsePropsFromElement(element);

    // Wrap component in UApp for Nuxt UI support
    const wrappedComponent = {
      name: `${appId}-wrapper`,
      setup() {
        return () =>
          h(
            UApp,
            {},
            {
              default: () => h(component, props),
            }
          );
      },
    };

    // Create vnode with shared app context
    const vnode = createVNode(wrappedComponent);
    vnode.appContext = app._context; // Share the app context

    // Clear the element and render the component into it
    element.innerHTML = '';
    render(vnode, element);

    // Mark as mounted
    element.setAttribute('data-vue-mounted', 'true');
    element.classList.add('unapi');

    // Store for cleanup
    mountedComponents.push({
      element,
      unmount: () => render(null, element),
    });
  });

  console.debug(`[UnifiedMount] Mounted ${mountedComponents.length} components`);

  // Store reference for debugging
  if (typeof window !== 'undefined') {
    window.__unifiedApp = app;
    window.__mountedComponents = mountedComponents;
  }

  return app;
}

// Replace the old autoMountAllComponents with the new unified approach
export function autoMountAllComponents() {
  mountUnifiedApp();
}
