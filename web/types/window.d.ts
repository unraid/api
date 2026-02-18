import type { ApolloClient } from '@apollo/client/core';
import type { autoMountComponent, getMountedApp, mountVueApp } from '~/components/Wrapper/mount-engine';
import type { parse } from 'graphql';
import type { Component } from 'vue';

/**
 * Global Window interface extensions for Unraid components
 * This file provides type definitions for properties added to the window object
 * by the component-registry.ts module
 */
declare global {
  interface Window {
    // Apollo GraphQL client and utilities
    apolloClient?: ApolloClient<unknown>;
    gql: typeof parse;
    graphqlParse: typeof parse;

    // Vue component registry and utilities
    UnraidComponents: Record<string, Component>;
    mountVueApp: typeof mountVueApp;
    getMountedApp: typeof getMountedApp;
    autoMountComponent: typeof autoMountComponent;

    // Dynamic mount functions created at runtime
    // These are generated for each component in componentMappings
    mountAuth?: (selector?: string) => unknown;
    mountConnectSettings?: (selector?: string) => unknown;
    mountHeaderOsVersion?: (selector?: string) => unknown;
    mountModals?: (selector?: string) => unknown;
    mountModalsLegacy?: (selector?: string) => unknown;
    mountUserProfile?: (selector?: string) => unknown;
    mountUpdateOs?: (selector?: string) => unknown;
    mountDowngradeOs?: (selector?: string) => unknown;
    mountRegistration?: (selector?: string) => unknown;
    mountWanIpCheck?: (selector?: string) => unknown;
    mountSsoButton?: (selector?: string) => unknown;
    mountLogViewer?: (selector?: string) => unknown;
    mountThemeSwitcher?: (selector?: string) => unknown;
    mountApiKeyManager?: (selector?: string) => unknown;
    mountDevModalTest?: (selector?: string) => unknown;
    mountApiKeyAuthorize?: (selector?: string) => unknown;
    mountToaster?: (selector?: string) => unknown;
    mountToasterLegacy?: (selector?: string) => unknown;

    // Webgui provided functions
    flashBackup?: () => void;
    downloadDiagnostics?: () => void;
    confirmDowngrade?: () => void;

    // Locale management
    LOCALE?: string;

    // Index signature for any other dynamic mount functions
    [key: `mount${string}`]: ((selector?: string) => unknown) | undefined;
  }
}

// Export empty object to make this a module and enable augmentation
export {};
