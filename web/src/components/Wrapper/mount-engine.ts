import { createApp, createVNode, h, render } from 'vue';
import { DefaultApolloClient } from '@vue/apollo-composable';
import UApp from '@nuxt/ui/components/App.vue';
import ui from '@nuxt/ui/vue-plugin';

import { isDarkModeActive } from '@unraid/ui';
// Import component registry (only imported here to avoid ordering issues)
import { componentMappings } from '@/components/Wrapper/component-registry';
import { client } from '~/helpers/create-apollo-client';
import { createI18nInstance, ensureLocale, getWindowLocale } from '~/helpers/i18n-loader';

// Import Pinia for use in Vue apps
import { globalPinia } from '~/store/globalPinia';
import { ensureUnapiScope, ensureUnapiScopeForSelectors, observeUnapiScope } from '~/utils/unapiScope';

// Ensure Apollo client is singleton
const apolloClient = (typeof window !== 'undefined' && window.apolloClient) || client;

const PORTAL_ROOT_ID = 'unraid-api-modals-virtual';
const NAV_ELEMENT_IDS = ['header', 'menu', 'footer'] as const;

const hideNavIfEmbeddedInIFrame = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get('iframe')?.toLowerCase() !== 'true') {
    return;
  }

  NAV_ELEMENT_IDS.forEach((targetId) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.style.display = 'none';
    }
  });
};

// Expose globally for debugging
declare global {
  interface Window {
    globalPinia: typeof globalPinia;
    LOCALE?: string;
  }
}

if (typeof window !== 'undefined') {
  window.globalPinia = globalPinia;
}

async function setupI18n() {
  const i18n = createI18nInstance();
  await ensureLocale(i18n, getWindowLocale());
  return i18n;
}

function ensurePortalRoot(): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  let portalRoot = document.getElementById(PORTAL_ROOT_ID);
  if (!portalRoot) {
    portalRoot = document.createElement('div');
    portalRoot.id = PORTAL_ROOT_ID;
    document.body.appendChild(portalRoot);
  }

  if (!portalRoot.style.position) {
    portalRoot.style.position = 'relative';
  }
  if (!portalRoot.style.zIndex) {
    portalRoot.style.zIndex = '999999';
  }

  ensureUnapiScope(portalRoot);
  if (isDarkModeActive()) {
    portalRoot.classList.add('dark');
  }

  return `#${PORTAL_ROOT_ID}`;
}

// Helper function to parse props from HTML attributes
function parsePropsFromElement(element: Element): Record<string, unknown> {
  // Early exit if no attributes
  if (!element.hasAttributes()) return {};

  const props: Record<string, unknown> = {};
  // Pre-compile attribute skip list into a Set for O(1) lookup
  const skipAttrs = new Set(['class', 'id', 'style', 'data-vue-mounted']);

  for (const attr of element.attributes) {
    const name = attr.name;

    // Skip Vue internal attributes and common HTML attributes
    if (skipAttrs.has(name) || name.startsWith('data-v-')) {
      continue;
    }

    const value = attr.value;
    const first = value.trimStart()[0];

    // Try to parse JSON values (handles HTML-encoded JSON)
    if (first === '{' || first === '[') {
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
export async function mountUnifiedApp() {
  // Create a minimal app just for context sharing
  const app = createApp({
    name: 'UnifiedContextApp',
    render: () => h('div', 'Context Provider'),
  });

  // Setup everything once
  const i18n = await setupI18n();
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

  const portalTarget = ensurePortalRoot();
  hideNavIfEmbeddedInIFrame();

  // Build a map of all selectors to their mappings for quick lookup
  const selectorToMapping = new Map<string, (typeof componentMappings)[0]>();
  componentMappings.forEach((mapping) => {
    const selectors = Array.isArray(mapping.selector) ? mapping.selector : [mapping.selector];
    selectors.forEach((sel) => selectorToMapping.set(sel, mapping));
  });

  const ensureContainerScope = (element: Element, mapping: (typeof componentMappings)[0]) => {
    if (!mapping.decorateContainer) {
      return;
    }
    const container = element.parentElement;
    if (container) {
      ensureUnapiScope(container);
    }
  };

  if (selectorToMapping.size > 0) {
    const selectors = Array.from(selectorToMapping.keys());
    ensureUnapiScopeForSelectors(selectors);
    selectorToMapping.forEach((mapping, selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        ensureContainerScope(element, mapping);
      });
    });
    observeUnapiScope(selectors, undefined, (element) => {
      for (const [selector, mapping] of selectorToMapping) {
        if (element.matches(selector)) {
          ensureContainerScope(element, mapping);
          break;
        }
      }
    });
  }

  // Query all selectors at once
  const allSelectors = Array.from(selectorToMapping.keys()).join(',');

  // Early exit if no selectors to query
  if (!allSelectors) {
    console.debug('[UnifiedMount] Mounted 0 components');
    return app;
  }

  const foundElements = document.querySelectorAll(allSelectors);
  const processedMappings = new Set<(typeof componentMappings)[0]>();

  foundElements.forEach((element) => {
    if (!element.hasAttribute('data-vue-mounted')) {
      // Find which mapping this element belongs to
      for (const [selector, mapping] of selectorToMapping) {
        if (element.matches(selector) && !processedMappings.has(mapping)) {
          const targetElement = element as HTMLElement;
          // ensureContainerScope(targetElement, mapping);
          componentsToMount.push({ mapping, element: targetElement });
          processedMappings.add(mapping);
          break;
        }
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
            {
              portal: portalTarget,
            },
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
    // ensureUnapiScope(element);
    // ensureContainerScope(element, mapping);
    element.replaceChildren();
    render(vnode, element);

    // Mark as mounted
    element.setAttribute('data-vue-mounted', 'true');
    ensureUnapiScope(element);

    if (isDarkModeActive()) {
      element.classList.add('dark');
    }

    // Store for cleanup
    mountedComponents.push({
      element,
      unmount: () => render(null, element),
    });
  });

  console.debug(`[UnifiedMount] Mounted ${mountedComponents.length} components`);

  return app;
}

// Replace the old autoMountAllComponents with the new unified approach
export async function autoMountAllComponents() {
  return await mountUnifiedApp();
}
