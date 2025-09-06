// Import utilities and core dependencies
import { defineAsyncComponent } from 'vue';
import { provideApolloClient } from '@vue/apollo-composable';

// Import CSS for bundling - this ensures Tailwind styles are included
import '~/assets/main.css';

import { ensureTeleportContainer } from '@unraid/ui';
import HeaderOsVersionCe from '@/components/HeaderOsVersion.ce.vue';
import HeaderOsVersionCe from '@/components/HeaderOsVersion.ce.vue';
import HeaderOsVersionCe from '@/components/HeaderOsVersion.ce.vue';
import ModalsCe from '@/components/Modals.ce.vue';
import ModalsCe from '@/components/Modals.ce.vue';
import ModalsCe from '@/components/Modals.ce.vue';
import ThemeSwitcherCe from '@/components/ThemeSwitcher.ce.vue';
import ThemeSwitcherCe from '@/components/ThemeSwitcher.ce.vue';
import ThemeSwitcherCe from '@/components/ThemeSwitcher.ce.vue';
// Static imports for critical components that are always present
// These are included in the main bundle for faster initial render
import UserProfileCe from '@/components/UserProfile.ce.vue';
// Static imports for critical components that are always present
// These are included in the main bundle for faster initial render
import UserProfileCe from '@/components/UserProfile.ce.vue';
import { client as apolloClient } from '~/helpers/create-apollo-client';
import { parse } from 'graphql';

import { autoMountComponent, getMountedApp, mountVueApp } from '~/components/Wrapper/mount-engine';
import { initializeTheme } from '~/store/themeInitializer';

// Window type definitions are automatically included via tsconfig.json

// Type for Vue component module
type VueComponentModule = { default: object } | object;

// Type for component mappings
type ComponentMapping = {
  selector: string;
  appId: string;
} & (
  | { component: ReturnType<typeof defineAsyncComponent> | object } // Static import
  | { loader: () => Promise<VueComponentModule> } // Dynamic import
);

// Define component mappings
// Critical components use static imports (already loaded)
// Page-specific components use dynamic imports (lazy loaded)
const componentMappings: ComponentMapping[] = [
  {
    loader: () => import('./Auth.ce.vue'),
    selector: 'unraid-auth',
    appId: 'auth',
  },
  {
    loader: () => import('./ConnectSettings/ConnectSettings.ce.vue'),
    selector: 'unraid-connect-settings',
    appId: 'connect-settings',
  },
  {
    loader: () => import('./DownloadApiLogs.ce.vue'),
    selector: 'unraid-download-api-logs',
    appId: 'download-api-logs',
  },
  {
    component: HeaderOsVersionCe, // Static import - always present in header
    selector: 'unraid-header-os-version',
    appId: 'header-os-version',
  },
  {
    component: ModalsCe, // Static import - global modals
    selector: 'unraid-modals',
    appId: 'modals',
  },
  {
    component: ModalsCe, // Static import - global modals
    selector: '#modals',
    appId: 'modals-legacy', // Legacy ID selector
  },
  {
    component: UserProfileCe, // Static import - always present in header
    selector: 'unraid-user-profile',
    appId: 'user-profile',
  },
  {
    loader: () => import('./UpdateOs.ce.vue'),
    selector: 'unraid-update-os',
    appId: 'update-os',
  },
  {
    loader: () => import('./DowngradeOs.ce.vue'),
    selector: 'unraid-downgrade-os',
    appId: 'downgrade-os',
  },
  {
    loader: () => import('./Registration.ce.vue'),
    selector: 'unraid-registration',
    appId: 'registration',
  },
  {
    loader: () => import('./WanIpCheck.ce.vue'),
    selector: 'unraid-wan-ip-check',
    appId: 'wan-ip-check',
  },
  {
    loader: () => import('./Activation/WelcomeModal.ce.vue'),
    selector: 'unraid-welcome-modal',
    appId: 'welcome-modal',
  },
  {
    loader: () => import('./SsoButton.ce.vue'),
    selector: 'unraid-sso-button',
    appId: 'sso-button',
  },
  {
    loader: () => import('./Logs/LogViewer.ce.vue'),
    selector: 'unraid-log-viewer',
    appId: 'log-viewer',
  },
  {
    component: ThemeSwitcherCe, // Static import - likely present on most pages
    selector: 'unraid-theme-switcher',
    appId: 'theme-switcher',
  },
  {
    loader: () => import('./ApiKeyPage.ce.vue'),
    selector: 'unraid-api-key-manager',
    appId: 'api-key-manager',
  },
  {
    loader: () => import('./DevModalTest.ce.vue'),
    selector: 'unraid-dev-modal-test',
    appId: 'dev-modal-test',
  },
  {
    loader: () => import('./ApiKeyAuthorize.ce.vue'),
    selector: 'unraid-api-key-authorize',
    appId: 'api-key-authorize',
  },
  {
    loader: () => import('./UnraidToaster.vue'),
    selector: 'uui-toaster',
    appId: 'toaster',
  },
  {
    loader: () => import('./UnraidToaster.vue'),
    selector: 'unraid-toaster',
    appId: 'toaster-legacy', // Legacy alias
  },
];

// Initialize global context (but don't import components yet)
if (typeof window !== 'undefined') {
  // Make Apollo client globally available
  window.apolloClient = apolloClient;

  // Make graphql parse function available for browser console usage
  window.graphqlParse = parse;
  window.gql = parse;

  // Provide Apollo client globally for all components
  provideApolloClient(apolloClient);

  // Pre-create the teleport container to avoid mounting issues
  // This ensures the container exists before any components try to teleport to it
  ensureTeleportContainer();

  // Initialize theme once per page load
  // This loads theme from GraphQL and applies Tailwind v4 classes
  initializeTheme().catch((error: unknown) => {
    console.error('[ComponentRegistry] Failed to initialize theme:', error);
  });
}

// Auto-mount components
// Static components mount immediately, dynamic components use lazy loading
componentMappings.forEach((mapping) => {
  const { selector, appId } = mapping;

  // Check if element exists before loading the component
  if (document.querySelector(selector)) {
    // Check if it's a static component or dynamic loader
    if ('component' in mapping) {
      // Static component - mount immediately
      autoMountComponent(mapping.component, selector, {
        appId,
        useShadowRoot: false,
      });
    } else if ('loader' in mapping) {
      // Dynamic component - use lazy loading
      const asyncComponent = defineAsyncComponent({
        loader: async () => {
          const module = await mapping.loader();
          return 'default' in module ? module.default : module;
        },
        loadingComponent: undefined,
        errorComponent: undefined,
        delay: 0,
        timeout: 5000, // 5 second timeout
        onError(error, _retry, fail) {
          console.error(`[StandaloneMount] Failed to load component for ${selector}:`, error);
          fail();
        },
      });

      // Mount the async component
      autoMountComponent(asyncComponent, selector, {
        appId,
        useShadowRoot: false,
      });
    }
  }
});

// Window interface extensions are defined in ~/types/window.d.ts

if (typeof window !== 'undefined') {
  // Expose utility functions
  window.mountVueApp = mountVueApp;
  window.getMountedApp = getMountedApp;

  // Create dynamic mount functions for each component
  componentMappings.forEach((mapping) => {
    const { selector, appId } = mapping;
    const componentName = appId
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    (window as unknown as Record<string, unknown>)[`mount${componentName}`] = async (
      customSelector?: string
    ) => {
      let component;

      if ('component' in mapping) {
        // Static component - already loaded
        component = mapping.component;
      } else {
        // Dynamic component - load on demand
        const module = await mapping.loader();
        component = 'default' in module ? module.default : module;
      }

      return mountVueApp({
        component,
        selector: customSelector || selector,
        appId: `${appId}-${Date.now()}`,
        useShadowRoot: false,
      });
    };
  });

  // Expose a way to manually load all components (for testing/debugging)
  (
    window as unknown as { loadAllComponents: () => Promise<PromiseSettledResult<void>[]> }
  ).loadAllComponents = async () => {
    console.log('[StandaloneMount] Loading all components...');
    const results = await Promise.allSettled(
      componentMappings.map(async (mapping) => {
        const { selector } = mapping;
        try {
          if ('component' in mapping) {
            console.log(`✓ Component for ${selector} is already loaded (static import)`);
          } else {
            await mapping.loader();
            console.log(`✓ Loaded component for ${selector}`);
          }
        } catch (error) {
          console.error(`✗ Failed to load component for ${selector}:`, error);
          throw error;
        }
      })
    );

    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      console.error(`[StandaloneMount] ${failed.length} components failed to load`);
    } else {
      console.log('[StandaloneMount] All components loaded successfully');
    }

    return results;
  };
}
