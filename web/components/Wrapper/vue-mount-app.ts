import { createApp } from 'vue';
import type { App as VueApp, Component } from 'vue';
import { createI18n } from 'vue-i18n';
import { DefaultApolloClient } from '@vue/apollo-composable';

// Import Tailwind CSS for injection
import tailwindStyles from '~/assets/main.css?inline';

import en_US from '~/locales/en_US.json';
import { createHtmlEntityDecoder } from '~/helpers/i18n-utils';
import { globalPinia } from '~/store/globalPinia';
import { client } from '~/helpers/create-apollo-client';

// Global store for mounted apps
const mountedApps = new Map<string, VueApp>();
const mountedAppClones = new Map<string, VueApp[]>();
const mountedAppContainers = new Map<string, HTMLElement[]>(); // shadow-root containers for cleanup

// Shared style injection tracking
const styleInjected = new WeakSet<Document | ShadowRoot>();

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

function injectStyles(root: Document | ShadowRoot) {
  // Always inject to document for teleported elements
  if (!styleInjected.has(document)) {
    const globalStyleElement = document.createElement('style');
    globalStyleElement.setAttribute('data-tailwind-global', 'true');
    globalStyleElement.textContent = tailwindStyles;
    document.head.appendChild(globalStyleElement);
    styleInjected.add(document);
  }
  
  // Also inject to shadow root if needed
  if (root !== document && !styleInjected.has(root)) {
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-tailwind', 'true');
    styleElement.textContent = tailwindStyles;
    root.appendChild(styleElement);
    styleInjected.add(root);
  }
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
  selector: string;
  appId?: string;
  useShadowRoot?: boolean;
  props?: Record<string, unknown>;
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
  const { component, selector, appId = selector, useShadowRoot = false, props = {} } = options;
  
  // Check if app is already mounted
  if (mountedApps.has(appId)) {
    console.warn(`[VueMountApp] App ${appId} is already mounted`);
    return mountedApps.get(appId)!;
  }
  
  // Find all mount targets
  const targets = document.querySelectorAll(selector);
  if (targets.length === 0) {
    console.warn(`[VueMountApp] No elements found for selector: ${selector}`);
    return null;
  }
  
  // For the first target, parse props from HTML attributes
  const firstTarget = targets[0];
  const parsedProps = { ...parsePropsFromElement(firstTarget), ...props };
  
  // Create the Vue app with parsed props
  const app = createApp(component, parsedProps);
  
  // Setup i18n
  const i18n = setupI18n();
  app.use(i18n);
  
  // Use the shared Pinia instance
  app.use(globalPinia);
  
  // Provide Apollo client
  app.provide(DefaultApolloClient, client);
  
  // Mount to all targets
  const clones: VueApp[] = [];
  const containers: HTMLElement[] = [];
  targets.forEach((target, index) => {
    const mountTarget = target as HTMLElement;
    
    // Add unraid-reset class to ensure webgui styles don't leak in
    mountTarget.classList.add('unraid-reset');
    
    if (useShadowRoot) {
      // Create shadow root if needed
      if (!mountTarget.shadowRoot) {
        mountTarget.attachShadow({ mode: 'open' });
      }
      
      // Create mount container in shadow root
      const container = document.createElement('div');
      container.id = 'app';
      container.setAttribute('data-app-id', appId);
      mountTarget.shadowRoot!.appendChild(container);
      containers.push(container);
      
      // Inject styles into shadow root
      injectStyles(mountTarget.shadowRoot!);
      
      // For the first target, use the main app, otherwise create clones
      if (index === 0) {
        app.mount(container);
      } else {
        const targetProps = { ...parsePropsFromElement(mountTarget), ...props };
        const clonedApp = createApp(component, targetProps);
        clonedApp.use(i18n);
        clonedApp.use(globalPinia);
        clonedApp.provide(DefaultApolloClient, client);
        clonedApp.mount(container);
        clones.push(clonedApp);
      }
    } else {
      // Direct mount without shadow root
      injectStyles(document);
      
      // For multiple targets, we need to create separate app instances
      // but they'll share the same Pinia store
      if (index === 0) {
        // First target, use the main app
        app.mount(mountTarget);
      } else {
        // Additional targets, create cloned apps with their own props
        const targetProps = { ...parsePropsFromElement(mountTarget), ...props };
        const clonedApp = createApp(component, targetProps);
        clonedApp.use(i18n);
        clonedApp.use(globalPinia); // Shared Pinia instance
        clonedApp.provide(DefaultApolloClient, client);
        clonedApp.mount(mountTarget);
        clones.push(clonedApp);
      }
    }
  });
  
  // Store the app reference
  mountedApps.set(appId, app);
  if (clones.length) mountedAppClones.set(appId, clones);
  if (containers.length) mountedAppContainers.set(appId, containers);
  
  return app;
}

export function unmountVueApp(appId: string): boolean {
  const app = mountedApps.get(appId);
  if (!app) {
    console.warn(`[VueMountApp] No app found with id: ${appId}`);
    return false;
  }
  
  // Unmount clones first
  const clones = mountedAppClones.get(appId) ?? [];
  for (const c of clones) c.unmount();
  mountedAppClones.delete(appId);
  
  // Remove shadow containers
  const containers = mountedAppContainers.get(appId) ?? [];
  for (const el of containers) el.remove();
  mountedAppContainers.delete(appId);
  
  app.unmount();
  mountedApps.delete(appId);
  return true;
}

export function getMountedApp(appId: string): VueApp | undefined {
  return mountedApps.get(appId);
}

// Auto-mount function for script tags
export function autoMountComponent(component: Component, selector: string, options?: Partial<MountOptions>) {
  const tryMount = () => {
    // Check if elements exist before attempting to mount
    if (document.querySelector(selector)) {
      mountVueApp({ component, selector, ...options });
    }
    // Silently skip if no elements found - this is expected for most components
  };

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryMount);
  } else {
    // DOM is already ready
    tryMount();
  }
}
