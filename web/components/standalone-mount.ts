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

// Initialize global Apollo client context
if (typeof window !== 'undefined') {
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
