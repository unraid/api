// Component Registry
// This module defines all web components and their mappings
// Actual mounting is handled by mount-engine.ts

import type { Component } from 'vue';

// Import CSS for bundling - this ensures Tailwind styles are included
import '~/assets/main.css';
// Import @unraid/ui styles which includes vue-sonner styles
import '@unraid/ui/styles';

// Static imports only for truly critical components (modals, toaster)
import ModalsCe from '@/components/Modals.standalone.vue';
import UnraidToaster from '@/components/UnraidToaster.vue';

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

// Priority levels for component mounting
export const MOUNT_PRIORITY = {
  CRITICAL: 0, // Mount immediately (modals, toaster)
  HIGH: 1, // Mount soon (header components)
  NORMAL: 2, // Mount when idle
  LOW: 3, // Mount last
} as const;

// Define component mappings with priority
// Critical components use static imports (already loaded)
// Page-specific components use dynamic imports (lazy loaded)
export const componentMappings: ComponentMapping[] = [
  {
    loader: () => import('../Auth.standalone.vue'),
    selector: 'unraid-auth',
    appId: 'auth',
  },
  {
    loader: () => import('../ConnectSettings/ConnectSettings.standalone.vue'),
    selector: 'unraid-connect-settings',
    appId: 'connect-settings',
  },
  {
    loader: () => import('../DownloadApiLogs.standalone.vue'),
    selector: 'unraid-download-api-logs',
    appId: 'download-api-logs',
  },
  {
    loader: () => import('@/components/HeaderOsVersion.standalone.vue'),
    selector: 'unraid-header-os-version',
    appId: 'header-os-version',
  },
  {
    component: ModalsCe, // Static import - global modals
    selector: ['unraid-modals', '#modals', 'modals-direct'], // All possible modal selectors
    appId: 'modals',
  },
  {
    loader: () => import('@/components/UserProfile.standalone.vue'),
    selector: 'unraid-user-profile',
    appId: 'user-profile',
  },
  {
    loader: () => import('../Registration.standalone.vue'),
    selector: 'unraid-registration',
    appId: 'registration',
  },
  {
    loader: () => import('../WanIpCheck.standalone.vue'),
    selector: 'unraid-wan-ip-check',
    appId: 'wan-ip-check',
  },
  {
    loader: () => import('../CallbackHandler.standalone.vue'),
    selector: 'unraid-callback-handler',
    appId: 'callback-handler',
  },
  {
    loader: () => import('../Logs/LogViewer.standalone.vue'),
    selector: 'unraid-log-viewer',
    appId: 'log-viewer',
  },
  {
    loader: () => import('../SsoButton.standalone.vue'),
    selector: 'unraid-sso-button',
    appId: 'sso-button',
  },
  {
    loader: () => import('../Activation/WelcomeModal.standalone.vue'),
    selector: 'unraid-welcome-modal',
    appId: 'welcome-modal',
  },
  {
    loader: () => import('../UpdateOs.standalone.vue'),
    selector: 'unraid-update-os',
    appId: 'update-os',
  },
  {
    loader: () => import('../DowngradeOs.standalone.vue'),
    selector: 'unraid-downgrade-os',
    appId: 'downgrade-os',
  },
  {
    loader: () => import('../DevSettings.vue'),
    selector: 'unraid-dev-settings',
    appId: 'dev-settings',
  },
  {
    loader: () => import('../ApiKeyPage.standalone.vue'),
    selector: ['unraid-apikey-page', 'unraid-api-key-manager'],
    appId: 'apikey-page',
  },
  {
    loader: () => import('../ApiKeyAuthorize.standalone.vue'),
    selector: 'unraid-apikey-authorize',
    appId: 'apikey-authorize',
  },
  {
    loader: () => import('../DevModalTest.standalone.vue'),
    selector: 'unraid-dev-modal-test',
    appId: 'dev-modal-test',
  },
  {
    loader: () => import('../LayoutViews/Detail/DetailTest.standalone.vue'),
    selector: 'unraid-detail-test',
    appId: 'detail-test',
  },
  {
    loader: () => import('@/components/ThemeSwitcher.standalone.vue'),
    selector: 'unraid-theme-switcher',
    appId: 'theme-switcher',
  },
  {
    loader: () => import('../ColorSwitcher.standalone.vue'),
    selector: 'unraid-color-switcher',
    appId: 'color-switcher',
  },
  {
    component: UnraidToaster, // Static import - toaster styles need to be in main bundle
    selector: ['unraid-toaster', 'uui-toaster'],
    appId: 'toaster',
  },
  {
    loader: () => import('../UpdateOs/TestUpdateModal.standalone.vue'),
    selector: 'unraid-test-update-modal',
    appId: 'test-update-modal',
  },
  {
    loader: () => import('../TestThemeSwitcher.standalone.vue'),
    selector: 'unraid-test-theme-switcher',
    appId: 'test-theme-switcher',
  },
];
