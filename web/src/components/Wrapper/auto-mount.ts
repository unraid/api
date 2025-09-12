// Auto-mount entry point
// This module initializes the application and auto-mounts all registered components

import { provideApolloClient } from '@vue/apollo-composable';

// Copy the ensureTeleportContainer function to avoid importing from @unraid/ui
// which causes ESM/CommonJS issues with ajv-errors
function ensureTeleportContainer(): HTMLElement {
  const containerId = 'unraid-teleport-container';
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.position = 'relative';
    container.classList.add('unapi');
    container.style.zIndex = '999999';
    document.body.appendChild(container);
  }
  return container;
}
import {
  autoMountAllComponents,
  autoMountComponent,
  getMountedApp,
  mountVueApp,
} from '@/components/Wrapper/mount-engine';
import { client as apolloClient } from '~/helpers/create-apollo-client';
import { parse } from 'graphql';

import { initializeTheme } from '~/store/themeInitializer';

// Initialize global dependencies once
function initializeGlobalDependencies() {
  if (typeof window === 'undefined') return;

  // Provide Apollo client globally for all components
  provideApolloClient(apolloClient);

  // Pre-create the teleport container to avoid mounting issues
  // This ensures the container exists before any components try to teleport to it
  ensureTeleportContainer();

  // Initialize theme once per page load
  // This loads theme from GraphQL and applies Tailwind v4 classes
  initializeTheme().catch((error: unknown) => {
    console.error('[AutoMount] Failed to initialize theme:', error);
  });

  // Expose utility functions on window for debugging/external use
  window.mountVueApp = mountVueApp;
  window.getMountedApp = getMountedApp;
  window.autoMountComponent = autoMountComponent;

  // Expose Apollo client on window for global access
  window.apolloClient = apolloClient;

  // Expose gql tag function for GraphQL queries
  window.gql = parse;

  // Expose parse function for backend evaluation
  window.graphqlParse = parse;
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
  // Initialize global dependencies
  initializeGlobalDependencies();

  // Auto-mount components when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMountAllComponents);
  } else {
    // DOM is already ready
    autoMountAllComponents();
  }
}

// Export for manual initialization if needed
export { initializeGlobalDependencies };
