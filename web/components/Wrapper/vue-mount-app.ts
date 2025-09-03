import { createApp } from 'vue';
import type { App as VueApp, Component } from 'vue';
import { createI18n } from 'vue-i18n';
import { DefaultApolloClient } from '@vue/apollo-composable';
import { ensureTeleportContainer } from '@unraid/ui';

// Import Tailwind CSS for injection
import tailwindStyles from '~/assets/main.css?inline';

import en_US from '~/locales/en_US.json';
import { createHtmlEntityDecoder } from '~/helpers/i18n-utils';
import { globalPinia } from '~/store/globalPinia';
import { client } from '~/helpers/create-apollo-client';

// Ensure Apollo client is singleton
const apolloClient = (typeof window !== 'undefined' && window.apolloClient) || client;

// Global store for mounted apps
const mountedApps = new Map<string, VueApp>();
const mountedAppClones = new Map<string, VueApp[]>();
const mountedAppContainers = new Map<string, HTMLElement[]>(); // shadow-root containers for cleanup

// Shared style injection tracking
const styleInjected = new WeakSet<Document | ShadowRoot>();

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
  skipRecovery?: boolean; // Internal flag to prevent recursive recovery attempts
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
  const { component, selector, appId = selector, useShadowRoot = false, props = {}, skipRecovery = false } = options;
  
  // Check if app is already mounted
  if (mountedApps.has(appId)) {
    console.warn(`[VueMountApp] App ${appId} is already mounted`);
    return mountedApps.get(appId)!;
  }
  
  // Special handling for modals - enforce singleton behavior
  if (selector.includes('unraid-modals') || selector === '#modals') {
    const existingModalApps = ['modals', 'modals-direct', 'unraid-modals'];
    for (const modalId of existingModalApps) {
      if (mountedApps.has(modalId)) {
        console.debug(`[VueMountApp] Modals component already mounted as ${modalId}, skipping ${appId}`);
        return mountedApps.get(modalId)!;
      }
    }
  }
  
  // Check if any elements matching the selector already have Vue apps mounted
  const potentialTargets = document.querySelectorAll(selector);
  for (const target of potentialTargets) {
    const element = target as HTMLElementWithVue;
    const hasVueAttributes = element.hasAttribute('data-vue-mounted') || 
                            element.hasAttribute('data-v-app') || 
                            element.hasAttribute('data-server-rendered');
    
    if (hasVueAttributes || element.__vueParentComponent) {
      // Check if the existing Vue component is actually working (has content)
      const hasContent = element.innerHTML.trim().length > 0 || 
                        element.children.length > 0;
      
      if (hasContent) {
        console.info(`[VueMountApp] Element ${selector} already has working Vue component, skipping remount`);
        // Return the existing app if we can find it
        const existingApp = mountedApps.get(appId);
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
        Array.from(element.attributes).forEach(attr => {
          if (attr.name.startsWith('data-v-')) {
            element.removeAttribute(attr.name);
          }
        });
        
        // Clear the element content to ensure fresh state
        element.innerHTML = '';
        
        // Remove the __vueParentComponent reference without calling unmount
        delete element.__vueParentComponent;
        
        console.info(`[VueMountApp] Cleared Vue state from ${selector} without unmounting (prevents nextSibling errors)`);
        
      } catch (error) {
        console.warn(`[VueMountApp] Error cleaning up existing Vue instance:`, error);
        // Force clear everything if normal cleanup fails
        element.innerHTML = '';
        element.removeAttribute('data-vue-mounted');
        element.removeAttribute('data-v-app');
        element.removeAttribute('data-server-rendered');
        
        // Remove all data-v-* attributes
        Array.from(element.attributes).forEach(attr => {
          if (attr.name.startsWith('data-v-')) {
            element.removeAttribute(attr.name);
          }
        });
      }
    }
  }
  
  // Find all mount targets
  const targets = document.querySelectorAll(selector);
  if (targets.length === 0) {
    console.warn(`[VueMountApp] No elements found for selector: ${selector}`);
    return null;
  }
  
  // Ensure teleport container exists before mounting
  ensureTeleportContainer();
  
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
  app.provide(DefaultApolloClient, apolloClient);
  
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
      
      Array.from(mountTarget.childNodes).forEach(node => {
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
        nodesToRemove.forEach(node => {
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
        const remainingInvalidChildren = Array.from(mountTarget.childNodes).filter(node => {
          return node.parentNode !== mountTarget;
        });
        
        if (remainingInvalidChildren.length > 0) {
          console.warn(`[VueMountApp] Clearing all content due to remaining orphaned nodes in ${selector}`);
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
      container.setAttribute('data-app-id', appId);
      mountTarget.shadowRoot!.appendChild(container);
      containers.push(container);
      
      // Inject styles into shadow root
      injectStyles(mountTarget.shadowRoot!);
      
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
        const clonedApp = createApp(component, targetProps);
        clonedApp.use(i18n);
        clonedApp.use(globalPinia);
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
      injectStyles(document);
      
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
            
            // Try mounting after a brief delay to let DOM settle
            setTimeout(() => {
              try {
                // Ensure element is still valid
                if (mountTarget.isConnected && document.contains(mountTarget)) {
                  app.mount(mountTarget);
                  mountTarget.setAttribute('data-vue-mounted', 'true');
                  console.info(`[VueMountApp] Successfully recovered from nextSibling error for ${selector}`);
                } else {
                  console.error(`[VueMountApp] Recovery failed - element no longer in DOM: ${selector}`);
                }
              } catch (retryError) {
                console.error(`[VueMountApp] Recovery attempt failed for ${selector}:`, retryError);
              }
            }, 10);
            
            // Return without throwing to allow other elements to mount
            return;
          }
          
          throw error;
        }
      } else {
        // Additional targets, create cloned apps with their own props
        const targetProps = { ...parsePropsFromElement(mountTarget), ...props };
        const clonedApp = createApp(component, targetProps);
        clonedApp.use(i18n);
        clonedApp.use(globalPinia); // Shared Pinia instance
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
    elements.forEach(el => {
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

// Auto-mount function for script tags
export function autoMountComponent(component: Component, selector: string, options?: Partial<MountOptions>) {
  const tryMount = () => {
    // Special handling for modals - should only mount once, ignore subsequent attempts
    if (selector.includes('unraid-modals') || selector === '#modals') {
      const modalAppId = options?.appId || 'modals';
      if (mountedApps.has(modalAppId) || mountedApps.has('modals-direct')) {
        console.debug(`[VueMountApp] Modals component already mounted, skipping ${selector}`);
        return;
      }
    }
    
    // Check if elements exist before attempting to mount
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      // For specific problematic selectors, add extra delay to let page scripts settle
      const isProblematicSelector = selector.includes('unraid-connect-settings') || 
                                   selector.includes('unraid-modals') ||
                                   selector.includes('unraid-theme-switcher');
      
      if (isProblematicSelector) {
        // Wait longer for PHP-generated pages with dynamic content
        setTimeout(() => {
          performMount();
        }, 200);
        return;
      }
      
      performMount();
    }
    // Silently skip if no elements found - this is expected for most components
  };
  
  const performMount = () => {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) return;
    
    // Validate all elements are properly connected to the DOM
    const validElements = Array.from(elements).filter(el => {
      const element = el as HTMLElement;
      
      // Basic connectivity check - element must be in DOM
      if (!element.isConnected || !element.parentNode || !document.contains(element)) {
        return false;
      }
      
      // Additional check: ensure the element's parentNode relationship is stable
      // This catches cases where elements appear connected but have DOM manipulation issues
      try {
        // Try to access nextSibling - this will throw if DOM is in inconsistent state
        void element.nextSibling;
        // Verify parent-child relationship is intact
        if (element.parentNode && !Array.from(element.parentNode.childNodes).includes(element)) {
          console.warn(`[VueMountApp] Element ${selector} has broken parent-child relationship`);
          return false;
        }
      } catch (error) {
        console.warn(`[VueMountApp] Element ${selector} has unstable DOM state:`, error);
        return false;
      }
      
      return true;
    });
      
      if (validElements.length > 0) {
        try {
          mountVueApp({ component, selector, ...options });
        } catch (error) {
          console.error(`[VueMountApp] Failed to mount component for selector ${selector}:`, error);
          
          // Additional debugging for this specific error
          if (error instanceof TypeError && error.message.includes('nextSibling')) {
            console.warn(`[VueMountApp] DOM state issue detected for ${selector}, attempting cleanup and retry`);
            
            // Perform more aggressive cleanup for nextSibling errors
            validElements.forEach(el => {
              const element = el as HTMLElement;
              
              // Remove all Vue-related attributes that might be causing issues
              element.removeAttribute('data-vue-mounted');
              element.removeAttribute('data-v-app');
              Array.from(element.attributes).forEach(attr => {
                if (attr.name.startsWith('data-v-')) {
                  element.removeAttribute(attr.name);
                }
              });
              
              // Completely reset the element's content and state
              element.innerHTML = '';
              element.className = element.className.replace(/\bunapi\b/g, '').trim();
              
              // Remove any Vue instance references
              delete (element as unknown as HTMLElementWithVue).__vueParentComponent;
            });
            
            // Wait for DOM to stabilize and try again
            setTimeout(() => {
              try {
                console.info(`[VueMountApp] Retrying mount for ${selector} after cleanup`);
                mountVueApp({ component, selector, ...options, skipRecovery: true });
              } catch (retryError) {
                console.error(`[VueMountApp] Retry failed for ${selector}:`, retryError);
                
                // If retry also fails, try one more time with even more delay
                setTimeout(() => {
                  try {
                    console.info(`[VueMountApp] Final retry attempt for ${selector}`);
                    mountVueApp({ component, selector, ...options, skipRecovery: true });
                  } catch (finalError) {
                    console.error(`[VueMountApp] All retry attempts failed for ${selector}:`, finalError);
                  }
                }, 100);
              }
            }, 50);
          }
        }
      } else {
        console.warn(`[VueMountApp] No valid DOM elements found for ${selector} (${elements.length} elements exist but not properly connected)`);
      }
  };

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryMount);
  } else {
    // DOM is already ready, but use setTimeout to ensure all scripts are loaded
    setTimeout(tryMount, 0);
  }
}
