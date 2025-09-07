import { createApp, defineAsyncComponent, h } from 'vue';
import { createI18n } from 'vue-i18n';
import { DefaultApolloClient } from '@vue/apollo-composable';
import UApp from '@nuxt/ui/components/App.vue';
import ui from '@nuxt/ui/vue-plugin';

import { ensureTeleportContainer } from '@unraid/ui';
// Import component registry (only imported here to avoid ordering issues)
import { componentMappings } from '@/components/Wrapper/component-registry';
import { client } from '~/helpers/create-apollo-client';
import { createHtmlEntityDecoder } from '~/helpers/i18n-utils';
import en_US from '~/locales/en_US.json';

import type { Component, App as VueApp } from 'vue';

// Import Pinia for use in Vue apps
import { globalPinia } from '~/store/globalPinia';

// Ensure Apollo client is singleton
const apolloClient = (typeof window !== 'undefined' && window.apolloClient) || client;

// Global store for mounted apps
const mountedApps = new Map<string, VueApp>();
const mountedAppClones = new Map<string, VueApp[]>();
const mountedAppContainers = new Map<string, HTMLElement[]>();

// Registry to track selector aliases - maps each selector to its canonical appId
const selectorRegistry = new Map<string, string>(); // shadow-root containers for cleanup

// Extend HTMLElement to include Vue's internal properties
interface HTMLElementWithVue extends HTMLElement {
  __vueParentComponent?: {
    appContext?: {
      app?: VueApp;
    };
  };
}

// Expose globally for debugging
declare global {
  interface Window {
    mountedApps: Map<string, VueApp>;
    globalPinia: typeof globalPinia;
  }
}

if (typeof window !== 'undefined') {
  window.mountedApps = mountedApps;
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

export interface MountOptions {
  component: Component;
  selector: string | string[]; // Can be a single selector or array of selector aliases
  appId?: string;
  useShadowRoot?: boolean;
  props?: Record<string, unknown>;
  skipRecovery?: boolean; // Internal flag to prevent recursive recovery attempts
  waitForElement?: boolean; // If true, poll for element existence before mounting
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

export function mountVueApp(options: MountOptions): VueApp | null {
  const {
    component,
    selector,
    appId,
    useShadowRoot = false,
    props = {},
    skipRecovery = false,
    waitForElement = false,
  } = options;

  // Normalize selector to array
  const selectors = Array.isArray(selector) ? selector : [selector];

  // Generate appId from first selector if not provided
  const canonicalAppId = appId || selectors[0];

  // Check if any of the selectors are already registered (singleton check)
  for (const sel of selectors) {
    if (selectorRegistry.has(sel)) {
      const existingAppId = selectorRegistry.get(sel)!;
      if (mountedApps.has(existingAppId)) {
        console.debug(
          `[VueMountApp] Component already mounted as ${existingAppId} for selector ${sel}, returning existing instance`
        );
        return mountedApps.get(existingAppId)!;
      }
    }
  }

  // Check if app is already mounted by its ID
  if (mountedApps.has(canonicalAppId)) {
    console.warn(`[VueMountApp] App ${canonicalAppId} is already mounted`);
    return mountedApps.get(canonicalAppId)!;
  }

  // If waitForElement is true, poll for element existence
  if (waitForElement) {
    const tryMount = () => {
      // Check if any of the selectors have elements
      for (const sel of selectors) {
        const elements = document.querySelectorAll(sel);
        if (elements.length > 0) {
          try {
            // Element found, mount immediately with this selector
            mountVueApp({ ...options, selector: sel, waitForElement: false });
          } catch (error) {
            console.error(`[VueMountApp] Failed to mount ${appId || sel} during async mount:`, error);
            // Don't retry this component to avoid infinite loops
          }
          return;
        }
      }
      // No elements found, try again later
      setTimeout(tryMount, 100);
    };

    // Start polling when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryMount);
    } else {
      tryMount();
    }
    return null; // Return null for async mounting
  }

  // Find the first selector that has elements in the DOM
  let activeSelector: string | null = null;
  for (const sel of selectors) {
    if (document.querySelector(sel)) {
      activeSelector = sel;
      break;
    }
  }

  if (!activeSelector) {
    console.warn(`[VueMountApp] No elements found for any selector: ${selectors.join(', ')}`);
    return null;
  }

  // Register all selectors as aliases for this app
  for (const sel of selectors) {
    selectorRegistry.set(sel, canonicalAppId);
  }

  // Check if any elements matching the selector already have Vue apps mounted
  const potentialTargets = document.querySelectorAll(activeSelector);
  for (const target of potentialTargets) {
    const element = target as HTMLElementWithVue;
    const hasVueAttributes =
      element.hasAttribute('data-vue-mounted') ||
      element.hasAttribute('data-v-app') ||
      element.hasAttribute('data-server-rendered');

    if (hasVueAttributes || element.__vueParentComponent) {
      // Check if the existing Vue component is actually working (has content)
      const hasContent = element.innerHTML.trim().length > 0 || element.children.length > 0;

      if (hasContent) {
        console.info(
          `[VueMountApp] Element ${selector} already has working Vue component, skipping remount`
        );
        // Return the existing app if we can find it
        const existingApp = mountedApps.get(canonicalAppId);
        if (existingApp) {
          return existingApp;
        }
        // If we can't find the app reference but component is working, return null (success)
        return null;
      }

      console.warn(`[VueMountApp] Element ${selector} has Vue attributes but no content, cleaning up`);

      try {
        // DO NOT attempt to unmount existing Vue instances - this causes the nextSibling error
        // Instead, just clear the DOM state and let Vue handle the cleanup naturally

        // Remove all Vue-related attributes
        element.removeAttribute('data-vue-mounted');
        element.removeAttribute('data-v-app');
        element.removeAttribute('data-server-rendered');

        // Remove any Vue-injected attributes
        Array.from(element.attributes).forEach((attr) => {
          if (attr.name.startsWith('data-v-')) {
            element.removeAttribute(attr.name);
          }
        });

        // Clear the element content to ensure fresh state
        element.innerHTML = '';

        // Remove the __vueParentComponent reference without calling unmount
        delete element.__vueParentComponent;

        console.info(
          `[VueMountApp] Cleared Vue state from ${activeSelector} without unmounting (prevents nextSibling errors)`
        );
      } catch (error) {
        console.warn(`[VueMountApp] Error cleaning up existing Vue instance:`, error);
        // Force clear everything if normal cleanup fails
        element.innerHTML = '';
        element.removeAttribute('data-vue-mounted');
        element.removeAttribute('data-v-app');
        element.removeAttribute('data-server-rendered');

        // Remove all data-v-* attributes
        Array.from(element.attributes).forEach((attr) => {
          if (attr.name.startsWith('data-v-')) {
            element.removeAttribute(attr.name);
          }
        });
      }
    }
  }

  // Find all mount targets
  const targets = document.querySelectorAll(activeSelector);
  if (targets.length === 0) {
    console.warn(`[VueMountApp] No elements found for selector: ${activeSelector}`);
    return null;
  }

  // Ensure teleport container exists before mounting
  ensureTeleportContainer();

  // For the first target, parse props from HTML attributes
  const firstTarget = targets[0];
  const parsedProps = { ...parsePropsFromElement(firstTarget), ...props };

  // Create the Vue app wrapped with UApp for proper Nuxt UI functionality
  const app = createApp({
    name: 'StandaloneAppWrapper',
    setup() {
      // Delay component creation until setup to ensure app context is ready
      return () =>
        h(
          UApp,
          {},
          {
            default: () => h(component, parsedProps),
          }
        );
    },
  });

  // Setup i18n
  const i18n = setupI18n();
  app.use(i18n);

  // Use the shared Pinia instance - this makes it available in the app context
  app.use(globalPinia);

  // Nuxt UI plugin
  app.use(ui);

  // Provide Apollo client
  app.provide(DefaultApolloClient, apolloClient);

  // UI config removed - not available

  // Mount to all targets
  const clones: VueApp[] = [];
  const containers: HTMLElement[] = [];
  targets.forEach((target, index) => {
    const mountTarget = target as HTMLElement;

    // Comprehensive DOM validation
    if (!mountTarget.isConnected || !mountTarget.parentNode || !document.contains(mountTarget)) {
      console.warn(`[VueMountApp] Mount target not properly connected to DOM for ${appId}, skipping`);
      return;
    }

    // Special handling for PHP-generated pages that might have whitespace/comment nodes
    if (mountTarget.childNodes.length > 0) {
      let hasProblematicNodes = false;
      const nodesToRemove: Node[] = [];

      Array.from(mountTarget.childNodes).forEach((node) => {
        // Check for orphaned nodes
        if (node.parentNode !== mountTarget) {
          hasProblematicNodes = true;
          return;
        }

        // Check for empty text nodes or comments that could cause fragment issues
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === '') {
          nodesToRemove.push(node);
          hasProblematicNodes = true;
        } else if (node.nodeType === Node.COMMENT_NODE) {
          nodesToRemove.push(node);
          hasProblematicNodes = true;
        }
      });

      if (hasProblematicNodes) {
        console.warn(`[VueMountApp] Cleaning up problematic nodes in ${selector} before mounting`);

        // Remove problematic nodes
        nodesToRemove.forEach((node) => {
          try {
            if (node.parentNode) {
              node.parentNode.removeChild(node);
            }
          } catch (_e) {
            // If removal fails, clear the entire content
            mountTarget.innerHTML = '';
          }
        });

        // If we still have orphaned nodes after cleanup, clear everything
        const remainingInvalidChildren = Array.from(mountTarget.childNodes).filter((node) => {
          return node.parentNode !== mountTarget;
        });

        if (remainingInvalidChildren.length > 0) {
          console.warn(
            `[VueMountApp] Clearing all content due to remaining orphaned nodes in ${selector}`
          );
          mountTarget.innerHTML = '';
        }
      }
    }

    // Add unapi class for minimal styling and mark as mounted
    mountTarget.classList.add('unapi');
    mountTarget.setAttribute('data-vue-mounted', 'true');

    if (useShadowRoot) {
      // Create shadow root if needed
      if (!mountTarget.shadowRoot) {
        mountTarget.attachShadow({ mode: 'open' });
      }

      // Create mount container in shadow root
      const container = document.createElement('div');
      container.id = 'app';
      container.setAttribute('data-app-id', canonicalAppId);
      mountTarget.shadowRoot!.appendChild(container);
      containers.push(container);

      // For the first target, use the main app, otherwise create clones
      if (index === 0) {
        try {
          app.mount(container);
        } catch (error) {
          console.error(`[VueMountApp] Error mounting main app to shadow root ${selector}:`, error);
          throw error;
        }
      } else {
        const targetProps = { ...parsePropsFromElement(mountTarget), ...props };
        const clonedApp = createApp({
          name: 'StandaloneAppWrapperClone',
          setup() {
            return () =>
              h(
                UApp,
                {},
                {
                  default: () => h(component, targetProps),
                }
              );
          },
        });
        clonedApp.use(i18n);
        clonedApp.use(globalPinia);
        clonedApp.use(ui);
        clonedApp.provide(DefaultApolloClient, apolloClient);

        try {
          clonedApp.mount(container);
          clones.push(clonedApp);
        } catch (error) {
          console.error(`[VueMountApp] Error mounting cloned app to shadow root ${selector}:`, error);
          // Don't call unmount since mount failed - just let the app be garbage collected
        }
      }
    } else {
      // Direct mount without shadow root

      // For multiple targets, we need to create separate app instances
      // but they'll share the same Pinia store
      if (index === 0) {
        // First target, use the main app
        try {
          // Final validation before mounting
          if (!mountTarget.isConnected || !document.contains(mountTarget)) {
            throw new Error(`Mount target disconnected before mounting: ${selector}`);
          }

          app.mount(mountTarget);
        } catch (error) {
          console.error(`[VueMountApp] Error mounting main app to ${selector}:`, error);

          // Special handling for nextSibling error - attempt recovery (only if not already retrying)
          if (!skipRecovery && error instanceof TypeError && error.message.includes('nextSibling')) {
            console.warn(`[VueMountApp] Attempting recovery from nextSibling error for ${selector}`);

            // Remove the problematic data attribute that might be causing issues
            mountTarget.removeAttribute('data-vue-mounted');

            // Try mounting immediately
            try {
              // Ensure element is still valid
              if (mountTarget.isConnected && document.contains(mountTarget)) {
                app.mount(mountTarget);
                mountTarget.setAttribute('data-vue-mounted', 'true');
                console.info(
                  `[VueMountApp] Successfully recovered from nextSibling error for ${selector}`
                );
              } else {
                console.error(`[VueMountApp] Recovery failed - element no longer in DOM: ${selector}`);
              }
            } catch (retryError) {
              console.error(`[VueMountApp] Recovery attempt failed for ${selector}:`, retryError);
            }

            // Return without throwing to allow other elements to mount
            return;
          }

          // Don't throw error - just return null to allow other components to mount
          // The error has already been logged
          return null;
        }
      } else {
        // Additional targets, create cloned apps with their own props
        const targetProps = { ...parsePropsFromElement(mountTarget), ...props };
        const clonedApp = createApp({
          name: 'StandaloneAppWrapperClone',
          setup() {
            return () =>
              h(
                UApp,
                {},
                {
                  default: () => h(component, targetProps),
                }
              );
          },
        });
        clonedApp.use(i18n);
        clonedApp.use(globalPinia); // Shared Pinia instance
        clonedApp.use(ui);
        clonedApp.provide(DefaultApolloClient, apolloClient);

        try {
          clonedApp.mount(mountTarget);
          clones.push(clonedApp);
        } catch (error) {
          console.error(`[VueMountApp] Error mounting cloned app to ${selector}:`, error);
          // Don't call unmount since mount failed - just let the app be garbage collected
        }
      }
    }
  });

  // Store the app reference
  mountedApps.set(canonicalAppId, app);
  if (clones.length) mountedAppClones.set(canonicalAppId, clones);
  if (containers.length) mountedAppContainers.set(canonicalAppId, containers);

  return app;
}

export function unmountVueApp(appId: string): boolean {
  const app = mountedApps.get(appId);
  if (!app) {
    console.warn(`[VueMountApp] No app found with id: ${appId}`);
    return false;
  }

  // Clean up selector registry - remove all selectors that point to this appId
  for (const [selector, registeredAppId] of selectorRegistry.entries()) {
    if (registeredAppId === appId) {
      selectorRegistry.delete(selector);
    }
  }

  // Unmount clones first with error handling
  const clones = mountedAppClones.get(appId) ?? [];
  for (const c of clones) {
    try {
      c.unmount();
    } catch (error) {
      console.warn(`[VueMountApp] Error unmounting clone for ${appId}:`, error);
    }
  }
  mountedAppClones.delete(appId);

  // Remove shadow containers with error handling
  const containers = mountedAppContainers.get(appId) ?? [];
  for (const el of containers) {
    try {
      el.remove();
    } catch (error) {
      console.warn(`[VueMountApp] Error removing container for ${appId}:`, error);
    }
  }
  mountedAppContainers.delete(appId);

  // Unmount main app with error handling
  try {
    app.unmount();

    // Clean up data attributes from mounted elements
    const elements = document.querySelectorAll(`[data-vue-mounted="true"]`);
    elements.forEach((el) => {
      if (el.classList.contains('unapi')) {
        el.removeAttribute('data-vue-mounted');
      }
    });
  } catch (error) {
    console.warn(`[VueMountApp] Error unmounting app ${appId}:`, error);
  }

  mountedApps.delete(appId);
  return true;
}

export function getMountedApp(appId: string): VueApp | undefined {
  return mountedApps.get(appId);
}

// Auto-mount function that waits for DOM elements to be available
export function autoMountComponent(
  componentOrMapping: Component | { component?: Component; loader?: () => Promise<VueComponentModule> },
  selector: string | string[],
  options?: Partial<MountOptions>
) {
  let component: Component;

  // Handle different input types
  if ('component' in componentOrMapping && componentOrMapping.component) {
    // Direct component from mapping
    component = componentOrMapping.component;
  } else if ('loader' in componentOrMapping && componentOrMapping.loader) {
    // Async loader from mapping - create async component
    component = createAsyncComponent(componentOrMapping.loader);
  } else if (
    typeof componentOrMapping === 'object' &&
    !('component' in componentOrMapping) &&
    !('loader' in componentOrMapping)
  ) {
    // Direct component passed
    component = componentOrMapping as Component;
  } else {
    console.error('[autoMountComponent] Invalid component or mapping provided');
    return;
  }

  // Delegate to mountVueApp with waitForElement option
  mountVueApp({
    component,
    selector,
    ...options,
    waitForElement: true,
  });
}

// Type for Vue component module
type VueComponentModule = { default: object } | object;

// Helper to create async components with consistent error handling
export function createAsyncComponent(loader: () => Promise<VueComponentModule>) {
  return defineAsyncComponent({
    loader: async () => {
      const module = await loader();
      return 'default' in module ? module.default : module;
    },
    loadingComponent: undefined,
    errorComponent: undefined,
    delay: 0,
    timeout: 5000, // 5 second timeout
    onError(error, _retry, fail) {
      console.error('[AsyncComponent] Failed to load component:', error);
      fail();
    },
  });
}

// Auto-mount all registered components from component-registry
export function autoMountAllComponents() {
  console.log('[AutoMountAll] Starting auto-mount for', componentMappings.length, 'components');

  componentMappings.forEach((mapping) => {
    const { selector, appId } = mapping;

    // Normalize selector to array for consistent handling
    const selectors = Array.isArray(selector) ? selector : [selector];

    // Check if any of the selectors have elements in the DOM
    const hasElements = selectors.some((sel) => {
      const found = document.querySelector(sel);
      if (found) {
        console.log(`[AutoMountAll] Found element for selector: ${sel}`);
        return true;
      }
      return false;
    });

    // Only proceed if at least one selector has elements
    if (hasElements) {
      console.log(`[AutoMountAll] Mounting component: ${appId}`);
      try {
        // Pass the mapping directly to autoMountComponent
        // Let mount-engine handle component vs loader logic
        autoMountComponent(mapping, selector, {
          appId,
          useShadowRoot: false,
        });
      } catch (error) {
        console.error(`[AutoMountAll] Failed to mount ${appId}:`, error);
        // Continue with next component
      }
    } else {
      console.log(`[AutoMountAll] No elements found for: ${selectors.join(', ')}`);
    }
  });

  console.log('[AutoMountAll] Auto-mount complete');
}
