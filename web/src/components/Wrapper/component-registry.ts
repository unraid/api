// Component Registry
// This module defines all web components and their mappings
// Actual mounting is handled by mount-engine.ts

import type { Component } from 'vue';

// Import CSS for bundling - this ensures Tailwind styles are included
import '~/assets/main.css';

// Static imports for critical components that are always present
// These are included in the main bundle for faster initial render
import HeaderOsVersionCe from '@/components/HeaderOsVersion.ce.vue';
import ModalsCe from '@/components/Modals.ce.vue';
import ThemeSwitcherCe from '@/components/ThemeSwitcher.ce.vue';
import UserProfileCe from '@/components/UserProfile.ce.vue';

// Type for Vue component module
type VueComponentModule = { default: object } | object;

// Type for component mappings
export type ComponentMapping = {
  selector: string | string[]; // Can be a single selector or array of selector aliases
  appId: string;
} & (
  | { component: Component } // Static import
  | { loader: () => Promise<VueComponentModule> } // Dynamic import
);

// Define component mappings
// Critical components use static imports (already loaded)
// Page-specific components use dynamic imports (lazy loaded)
export const componentMappings: ComponentMapping[] = [
  {
    loader: () => import('../Auth.ce.vue'),
    selector: 'unraid-auth',
    appId: 'auth',
  },
  {
    loader: () => import('../ConnectSettings/ConnectSettings.ce.vue'),
    selector: 'unraid-connect-settings',
    appId: 'connect-settings',
  },
  {
    loader: () => import('../DownloadApiLogs.ce.vue'),
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
    selector: ['unraid-modals', '#modals', 'modals-direct'], // All possible modal selectors
    appId: 'modals',
  },
  {
    component: UserProfileCe, // Static import - always present in header
    selector: 'unraid-user-profile',
    appId: 'user-profile',
  },
  {
    loader: () => import('../Registration.ce.vue'),
    selector: 'unraid-registration',
    appId: 'registration',
  },
  {
    loader: () => import('../WanIpCheck.ce.vue'),
    selector: 'unraid-wan-ip-check',
    appId: 'wan-ip-check',
  },
  {
    loader: () => import('../CallbackHandler.ce.vue'),
    selector: 'unraid-callback-handler',
    appId: 'callback-handler',
  },
  {
    loader: () => import('../Logs/LogViewer.ce.vue'),
    selector: 'unraid-log-viewer',
    appId: 'log-viewer',
  },
  {
    loader: () => import('../SsoButton.ce.vue'),
    selector: 'unraid-sso-button',
    appId: 'sso-button',
  },
  {
    loader: () => import('../Activation/WelcomeModal.ce.vue'),
    selector: 'unraid-welcome-modal',
    appId: 'welcome-modal',
  },
  {
    loader: () => import('../UpdateOs.ce.vue'),
    selector: 'unraid-update-os',
    appId: 'update-os',
  },
  {
    loader: () => import('../DowngradeOs.ce.vue'),
    selector: 'unraid-downgrade-os',
    appId: 'downgrade-os',
  },
  {
    loader: () => import('../DevSettings.vue'),
    selector: 'unraid-dev-settings',
    appId: 'dev-settings',
  },
  {
    loader: () => import('../ApiKeyPage.ce.vue'),
    selector: ['unraid-apikey-page', 'unraid-api-key-manager'],
    appId: 'apikey-page',
  },
  {
    loader: () => import('../ApiKeyAuthorize.ce.vue'),
    selector: 'unraid-apikey-authorize',
    appId: 'apikey-authorize',
  },
  {
    loader: () => import('../DevModalTest.ce.vue'),
    selector: 'unraid-dev-modal-test',
    appId: 'dev-modal-test',
  },
  {
    loader: () => import('../LayoutViews/Detail/DetailTest.ce.vue'),
    selector: 'unraid-detail-test',
    appId: 'detail-test',
  },
  {
    component: ThemeSwitcherCe, // Static import - theme switcher
    selector: 'unraid-theme-switcher',
    appId: 'theme-switcher',
  },
  {
    loader: () => import('../ColorSwitcher.ce.vue'),
    selector: 'unraid-color-switcher',
    appId: 'color-switcher',
  },
];
