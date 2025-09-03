// Import all components
import type { Component } from 'vue';
import Auth from './Auth.ce.vue';
import ConnectSettings from './ConnectSettings/ConnectSettings.ce.vue';
import DownloadApiLogs from './DownloadApiLogs.ce.vue';
import HeaderOsVersion from './HeaderOsVersion.ce.vue';
import Modals from './Modals.ce.vue';
import UserProfile from './UserProfile.ce.vue';
import UpdateOs from './UpdateOs.ce.vue';
import DowngradeOs from './DowngradeOs.ce.vue';
import Registration from './Registration.ce.vue';
import WanIpCheck from './WanIpCheck.ce.vue';
import WelcomeModal from './Activation/WelcomeModal.ce.vue';
import SsoButton from './SsoButton.ce.vue';
import LogViewer from './Logs/LogViewer.ce.vue';
import ThemeSwitcher from './ThemeSwitcher.ce.vue';
import ApiKeyPage from './ApiKeyPage.ce.vue';
import DevModalTest from './DevModalTest.ce.vue';
import ApiKeyAuthorize from './ApiKeyAuthorize.ce.vue';

// Import utilities
import { autoMountComponent, mountVueApp, getMountedApp } from './Wrapper/vue-mount-app';
import { useThemeStore } from '~/store/theme';
import { globalPinia } from '~/store/globalPinia';
import { client as apolloClient } from '~/helpers/create-apollo-client';
import { provideApolloClient } from '@vue/apollo-composable';
import { parse } from 'graphql';
import { ensureTeleportContainer } from '@unraid/ui';

// Extend window interface for Apollo client
declare global {
  interface Window {
    apolloClient: typeof apolloClient;
    gql: typeof parse;
    graphqlParse: typeof parse;
  }
}

// Add pre-render CSS to hide components until they're mounted
function injectPreRenderCSS() {
  const style = document.createElement('style');
  style.id = 'unraid-prerender-css';
  style.textContent = `
    /* Hide unraid components during initial load to prevent FOUC */
    unraid-auth,
    unraid-connect-settings,
    unraid-download-api-logs,
    unraid-header-os-version,
    unraid-modals,
    unraid-user-profile,
    unraid-update-os,
    unraid-downgrade-os,
    unraid-registration,
    unraid-wan-ip-check,
    unraid-welcome-modal,
    unraid-sso-button,
    unraid-log-viewer,
    unraid-theme-switcher,
    unraid-api-key-manager,
    unraid-dev-modal-test,
    unraid-api-key-authorize {
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    }
    
    /* Show components once they have the unapi class (mounted) */
    unraid-auth.unapi,
    unraid-connect-settings.unapi,
    unraid-download-api-logs.unapi,
    unraid-header-os-version.unapi,
    unraid-modals.unapi,
    unraid-user-profile.unapi,
    unraid-update-os.unapi,
    unraid-downgrade-os.unapi,
    unraid-registration.unapi,
    unraid-wan-ip-check.unapi,
    unraid-welcome-modal.unapi,
    unraid-sso-button.unapi,
    unraid-log-viewer.unapi,
    unraid-theme-switcher.unapi,
    unraid-api-key-manager.unapi,
    unraid-dev-modal-test.unapi,
    unraid-api-key-authorize.unapi {
      opacity: 1;
    }
    
    /* Font size overrides for SSO button component */
    unraid-sso-button {
      --text-xs: 0.75rem;
      --text-sm: 0.875rem;
      --text-base: 1rem;
      --text-lg: 1.125rem;
      --text-xl: 1.25rem;
      --text-2xl: 1.5rem;
      --text-3xl: 1.875rem;
      --text-4xl: 2.25rem;
      --text-5xl: 3rem;
      --text-6xl: 3.75rem;
      --text-7xl: 4.5rem;
      --text-8xl: 6rem;
      --text-9xl: 8rem;
    }
  `;
  document.head.appendChild(style);
}

// Initialize global Apollo client context
if (typeof window !== 'undefined') {
  // Inject pre-render CSS as early as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectPreRenderCSS);
  } else {
    injectPreRenderCSS();
  }
  
  // Make Apollo client globally available
  window.apolloClient = apolloClient;
  
  // Make graphql parse function available for browser console usage
  window.graphqlParse = parse;
  window.gql = parse;
  
  // Provide Apollo client globally for all components
  provideApolloClient(apolloClient);
  
  // Initialize theme store and set CSS variables - this is needed by all components
  const themeStore = useThemeStore(globalPinia);
  themeStore.setTheme();
  themeStore.setCssVars();
  
  // Pre-create the teleport container to avoid mounting issues
  // This ensures the container exists before any components try to teleport to it
  ensureTeleportContainer();
}

// Define component mappings
const componentMappings = [
  { component: Auth, selector: 'unraid-auth', appId: 'auth' },
  { component: ConnectSettings, selector: 'unraid-connect-settings', appId: 'connect-settings' },
  { component: DownloadApiLogs, selector: 'unraid-download-api-logs', appId: 'download-api-logs' },
  { component: HeaderOsVersion, selector: 'unraid-header-os-version', appId: 'header-os-version' },
  { component: Modals, selector: 'unraid-modals', appId: 'modals' },
  { component: UserProfile, selector: 'unraid-user-profile', appId: 'user-profile' },
  { component: UpdateOs, selector: 'unraid-update-os', appId: 'update-os' },
  { component: DowngradeOs, selector: 'unraid-downgrade-os', appId: 'downgrade-os' },
  { component: Registration, selector: 'unraid-registration', appId: 'registration' },
  { component: WanIpCheck, selector: 'unraid-wan-ip-check', appId: 'wan-ip-check' },
  { component: WelcomeModal, selector: 'unraid-welcome-modal', appId: 'welcome-modal' },
  { component: SsoButton, selector: 'unraid-sso-button', appId: 'sso-button' },
  { component: LogViewer, selector: 'unraid-log-viewer', appId: 'log-viewer' },
  { component: ThemeSwitcher, selector: 'unraid-theme-switcher', appId: 'theme-switcher' },
  { component: ApiKeyPage, selector: 'unraid-api-key-manager', appId: 'api-key-manager' },
  { component: DevModalTest, selector: 'unraid-dev-modal-test', appId: 'dev-modal-test' },
  { component: ApiKeyAuthorize, selector: 'unraid-api-key-authorize', appId: 'api-key-authorize' },
];

// Auto-mount all components
componentMappings.forEach(({ component, selector, appId }) => {
  autoMountComponent(component, selector, {
    appId,
    useShadowRoot: false, // Mount directly to avoid shadow DOM issues
  });
});

// Special handling for Modals - also mount to #modals
autoMountComponent(Modals, '#modals', {
  appId: 'modals-direct',
  useShadowRoot: false,
});

// Expose functions globally for testing and dynamic mounting
declare global {
  interface Window {
    UnraidComponents: Record<string, Component>;
    mountVueApp: typeof mountVueApp;
    getMountedApp: typeof getMountedApp;
  }
}

if (typeof window !== 'undefined') {
  // Expose all components
  window.UnraidComponents = {
    Auth,
    ConnectSettings,
    DownloadApiLogs,
    HeaderOsVersion,
    Modals,
    UserProfile,
    UpdateOs,
    DowngradeOs,
    Registration,
    WanIpCheck,
    WelcomeModal,
    SsoButton,
    LogViewer,
    ThemeSwitcher,
    ApiKeyPage,
    DevModalTest,
    ApiKeyAuthorize,
  };
  
  // Expose utility functions
  window.mountVueApp = mountVueApp;
  window.getMountedApp = getMountedApp;
  
  // Create dynamic mount functions for each component
  componentMappings.forEach(({ component, selector, appId }) => {
    const componentName = appId.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
    
    (window as unknown as Record<string, unknown>)[`mount${componentName}`] = (customSelector?: string) => {
      return mountVueApp({
        component,
        selector: customSelector || selector,
        appId: `${appId}-${Date.now()}`,
        useShadowRoot: false,
      });
    };
  });
}
