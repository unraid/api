// Auto-mount entry point
// This module initializes the application and auto-mounts all registered components

import { provideApolloClient } from '@vue/apollo-composable';

import { autoMountAllComponents } from '@/components/Wrapper/mount-engine';
import { client as apolloClient } from '~/helpers/create-apollo-client';
import { parse } from 'graphql';

import { initializeTheme } from '~/store/themeInitializer';

// Initialize global dependencies once
function initializeGlobalDependencies() {
  if (typeof window === 'undefined') return;

  // Provide Apollo client globally for all components
  provideApolloClient(apolloClient);

  // Initialize theme once per page load
  // This loads theme from GraphQL and applies Tailwind v4 classes
  initializeTheme().catch((error: unknown) => {
    console.error('[AutoMount] Failed to initialize theme:', error);
  });

  // Expose utility functions on window for debugging/external use
  // With unified app, these are no longer needed
  // Access the unified app via window.__unifiedApp instead

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
