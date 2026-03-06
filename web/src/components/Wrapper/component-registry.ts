// Component Registry
// This module defines all web components and their mappings
// Actual mounting is handled by mount-engine.ts

// Import CSS for bundling - this ensures Tailwind styles are included
import '~/assets/main.css';
// Import @unraid/ui styles which includes vue-sonner styles
import '@unraid/ui/styles';

import { defineAsyncComponent } from 'vue';

import type { Component } from 'vue';

// Type for component mappings
export type ComponentMapping = {
  selector: string | string[]; // Can be a single selector or array of selector aliases
  appId: string;
  component: Component; // The async component
  decorateContainer?: boolean; // Flag to apply .unapi to the container element
};

// Define component mappings - all components use async loading for consistency
// Priority components (header, user profile) are listed first for faster mounting
export const componentMappings: ComponentMapping[] = [
  {
    component: defineAsyncComponent(() => import('@/components/HeaderOsVersion.standalone.vue')),
    selector: 'unraid-header-os-version',
    appId: 'header-os-version',
  },
  {
    component: defineAsyncComponent(() => import('@/components/UserProfile.standalone.vue')),
    selector: 'unraid-user-profile',
    appId: 'user-profile',
  },
  {
    component: defineAsyncComponent(() => import('../Auth.standalone.vue')),
    selector: 'unraid-auth',
    appId: 'auth',
  },
  {
    component: defineAsyncComponent(() => import('../ConnectSettings/ConnectSettings.standalone.vue')),
    selector: 'unraid-connect-settings',
    appId: 'connect-settings',
  },
  {
    component: defineAsyncComponent(() => import('@/components/Modals.standalone.vue')),
    selector: ['unraid-modals', '#modals', 'modals-direct'], // All possible modal selectors
    appId: 'modals',
  },
  {
    component: defineAsyncComponent(() => import('../Registration.standalone.vue')),
    selector: 'unraid-registration',
    appId: 'registration',
  },
  {
    component: defineAsyncComponent(() => import('../WanIpCheck.standalone.vue')),
    selector: 'unraid-wan-ip-check',
    appId: 'wan-ip-check',
  },
  {
    component: defineAsyncComponent(() => import('../CallbackHandler.standalone.vue')),
    selector: 'unraid-callback-handler',
    appId: 'callback-handler',
  },
  {
    component: defineAsyncComponent(() => import('../Logs/LogViewer.standalone.vue')),
    selector: 'unraid-log-viewer',
    appId: 'log-viewer',
  },
  {
    component: defineAsyncComponent(() => import('../SsoButton.standalone.vue')),
    selector: 'unraid-sso-button',
    appId: 'sso-button',
  },
  {
    component: defineAsyncComponent(() => import('../UpdateOs.standalone.vue')),
    selector: 'unraid-update-os',
    appId: 'update-os',
  },
  {
    component: defineAsyncComponent(() => import('../DowngradeOs.standalone.vue')),
    selector: 'unraid-downgrade-os',
    appId: 'downgrade-os',
  },
  {
    component: defineAsyncComponent(() => import('../DevSettings.vue')),
    selector: 'unraid-dev-settings',
    appId: 'dev-settings',
  },
  {
    component: defineAsyncComponent(
      () => import('../Notifications/CriticalNotifications.standalone.vue')
    ),
    selector: 'unraid-critical-notifications',
    appId: 'critical-notifications',
  },
  {
    component: defineAsyncComponent(() => import('../ApiKeyPage.standalone.vue')),
    selector: ['unraid-apikey-page', 'unraid-api-key-manager'],
    appId: 'apikey-page',
  },
  {
    component: defineAsyncComponent(() => import('../ApiKeyAuthorize.standalone.vue')),
    selector: 'unraid-api-key-authorize',
    appId: 'apikey-authorize',
  },
  {
    component: defineAsyncComponent(() => import('../DevModalTest.standalone.vue')),
    selector: 'unraid-dev-modal-test',
    appId: 'dev-modal-test',
  },
  {
    component: defineAsyncComponent(
      () => import('../Onboarding/standalone/OnboardingAdminPanel.standalone.vue')
    ),
    selector: ['unraid-onboarding-test-harness', 'unraid-onboarding-admin-panel'], // Handle both selectors
    appId: 'onboarding-admin-panel',
  },
  {
    component: defineAsyncComponent(() => import('../LayoutViews/Detail/DetailTest.standalone.vue')),
    selector: 'unraid-detail-test',
    appId: 'detail-test',
  },
  {
    component: defineAsyncComponent(() => import('@/components/ThemeSwitcher.standalone.vue')),
    selector: 'unraid-theme-switcher',
    appId: 'theme-switcher',
  },
  {
    component: defineAsyncComponent(() => import('@/components/LocaleSwitcher.vue')),
    selector: 'unraid-locale-switcher',
    appId: 'locale-switcher',
  },
  {
    component: defineAsyncComponent(() => import('../ColorSwitcher.standalone.vue')),
    selector: 'unraid-color-switcher',
    appId: 'color-switcher',
  },
  {
    component: defineAsyncComponent(() => import('@/components/UnraidToaster.vue')),
    selector: ['unraid-toaster', 'uui-toaster'],
    appId: 'toaster',
  },
  {
    component: defineAsyncComponent(() => import('../UpdateOs/TestUpdateModal.standalone.vue')),
    selector: 'unraid-test-update-modal',
    appId: 'test-update-modal',
  },
  {
    component: defineAsyncComponent(() => import('../TestThemeSwitcher.standalone.vue')),
    selector: 'unraid-test-theme-switcher',
    appId: 'test-theme-switcher',
  },
  {
    component: defineAsyncComponent(() => import('../DevThemeSwitcher.standalone.vue')),
    selector: 'unraid-dev-theme-switcher',
    appId: 'dev-theme-switcher',
  },
  {
    component: defineAsyncComponent(() => import('../ApiStatus/ApiStatus.standalone.vue')),
    selector: 'unraid-api-status-manager',
    appId: 'api-status-manager',
  },
  {
    component: defineAsyncComponent(() => import('../Docker/DockerContainerOverview.standalone.vue')),
    selector: 'unraid-docker-container-overview',
    appId: 'docker-container-overview',
    decorateContainer: true,
  },
];
