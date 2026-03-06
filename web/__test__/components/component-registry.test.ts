import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock mount-engine module first to ensure proper hoisting
const mockAutoMountAllComponents = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockMountUnifiedApp = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('~/components/Wrapper/mount-engine', () => ({
  autoMountAllComponents: mockAutoMountAllComponents,
  mountUnifiedApp: mockMountUnifiedApp,
}));

// Mock all the component imports
vi.mock('~/components/Auth.standalone.vue', () => ({
  default: { name: 'MockAuth', template: '<div>Auth</div>' },
}));
vi.mock('~/components/ConnectSettings/ConnectSettings.standalone.vue', () => ({
  default: { name: 'MockConnectSettings', template: '<div>ConnectSettings</div>' },
}));
vi.mock('~/components/HeaderOsVersion.standalone.vue', () => ({
  default: { name: 'MockHeaderOsVersion', template: '<div>HeaderOsVersion</div>' },
}));
vi.mock('~/components/Modals.standalone.vue', () => ({
  default: { name: 'MockModals', template: '<div>Modals</div>' },
}));
vi.mock('~/components/UserProfile.standalone.vue', () => ({
  default: { name: 'MockUserProfile', template: '<div>UserProfile</div>' },
}));
vi.mock('~/components/UpdateOs.standalone.vue', () => ({
  default: { name: 'MockUpdateOs', template: '<div>UpdateOs</div>' },
}));
vi.mock('~/components/DowngradeOs.standalone.vue', () => ({
  default: { name: 'MockDowngradeOs', template: '<div>DowngradeOs</div>' },
}));
vi.mock('~/components/Registration.standalone.vue', () => ({
  default: { name: 'MockRegistration', template: '<div>Registration</div>' },
}));
vi.mock('~/components/WanIpCheck.standalone.vue', () => ({
  default: { name: 'MockWanIpCheck', template: '<div>WanIpCheck</div>' },
}));
vi.mock('~/components/SsoButton.standalone.vue', () => ({
  default: { name: 'MockSsoButton', template: '<div>SsoButton</div>' },
}));
vi.mock('~/components/Logs/LogViewer.standalone.vue', () => ({
  default: { name: 'MockLogViewer', template: '<div>LogViewer</div>' },
}));
vi.mock('~/components/ThemeSwitcher.standalone.vue', () => ({
  default: { name: 'MockThemeSwitcher', template: '<div>ThemeSwitcher</div>' },
}));
vi.mock('~/components/ApiKeyPage.standalone.vue', () => ({
  default: { name: 'MockApiKeyPage', template: '<div>ApiKeyPage</div>' },
}));
vi.mock('~/components/DevModalTest.standalone.vue', () => ({
  default: { name: 'MockDevModalTest', template: '<div>DevModalTest</div>' },
}));
vi.mock('~/components/ApiKeyAuthorize.standalone.vue', () => ({
  default: { name: 'MockApiKeyAuthorize', template: '<div>ApiKeyAuthorize</div>' },
}));
vi.mock('~/components/UnraidToaster.vue', () => ({
  default: { name: 'MockUnraidToaster', template: '<div>UnraidToaster</div>' },
}));

// Mock theme initializer
const mockInitializeTheme = vi.fn(() => Promise.resolve());
vi.mock('~/store/themeInitializer', () => ({
  initializeTheme: mockInitializeTheme,
  isThemeReady: vi.fn(() => true),
  resetThemeInitialization: vi.fn(),
}));

// Mock globalPinia
vi.mock('~/store/globalPinia', () => ({
  globalPinia: { state: {} },
}));

// Mock apollo client
const mockApolloClient = {
  query: vi.fn(),
  mutate: vi.fn(),
};
vi.mock('~/helpers/create-apollo-client', () => ({
  client: mockApolloClient,
}));

// Mock @vue/apollo-composable
const mockProvideApolloClient = vi.fn();
vi.mock('@vue/apollo-composable', () => ({
  provideApolloClient: mockProvideApolloClient,
}));

// Mock graphql
const mockParse = vi.fn();
vi.mock('graphql', () => ({
  parse: mockParse,
}));

// Mock @unraid/ui
vi.mock('@unraid/ui', () => ({}));

describe('component-registry', () => {
  beforeEach(() => {
    // Reset module cache to ensure fresh imports
    vi.resetModules();

    // Reset all mocks
    vi.clearAllMocks();

    // Use Vitest's unstubAllGlobals to clean up any global stubs from previous tests
    vi.unstubAllGlobals();

    // Mock document methods
    vi.spyOn(document.head, 'appendChild').mockImplementation(() => document.createElement('style'));
    vi.spyOn(document, 'addEventListener').mockImplementation(() => {});

    // Clear DOM
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  describe('initialization', () => {
    it('should set up Apollo client globally', async () => {
      await import('~/components/Wrapper/auto-mount');

      expect(window.apolloClient).toBe(mockApolloClient);
      expect(window.graphqlParse).toBe(mockParse);
      expect(window.gql).toBe(mockParse);
      expect(mockProvideApolloClient).toHaveBeenCalledWith(mockApolloClient);
    });

    it.skip('should initialize theme once', async () => {
      await import('~/components/Wrapper/auto-mount');

      expect(mockInitializeTheme).toHaveBeenCalled();
    });

    it.skip('should mount unified app with components', async () => {
      await import('~/components/Wrapper/auto-mount');

      // The unified app architecture no longer requires teleport container setup per component
      // Instead it uses a unified approach
      expect(mockAutoMountAllComponents).toHaveBeenCalled();
    });
  });

  describe('component auto-mounting', () => {
    it.skip('should auto-mount components when DOM elements exist', async () => {
      // Create DOM elements for components to mount to
      const authElement = document.createElement('div');
      authElement.setAttribute('id', 'unraid-auth');
      document.body.appendChild(authElement);

      const modalElement = document.createElement('div');
      modalElement.setAttribute('id', 'modals');
      document.body.appendChild(modalElement);

      // Clear previous calls
      mockAutoMountAllComponents.mockClear();

      // Import auto-mount which will trigger auto-mounting
      await import('~/components/Wrapper/auto-mount');

      // Auto-mount should be called when DOM is ready
      expect(mockAutoMountAllComponents).toHaveBeenCalled();

      // Clean up
      document.body.removeChild(authElement);
      document.body.removeChild(modalElement);
    });
  });

  describe('global exports', () => {
    it.skip('should expose utility functions globally', async () => {
      await import('~/components/Wrapper/auto-mount');

      // With unified app architecture, these are exposed instead:
      expect(window.apolloClient).toBe(mockApolloClient);
      expect(window.gql).toBe(mockParse);
      expect(window.graphqlParse).toBe(mockParse);
      // The unified app itself is exposed via window.__unifiedApp after mounting
    });

    it.skip('should not expose legacy mount functions', async () => {
      await import('~/components/Wrapper/auto-mount');

      // These functions are no longer exposed in the unified app architecture
      expect(window.mountVueApp).toBeUndefined();
      expect(window.getMountedApp).toBeUndefined();
      expect(window.autoMountComponent).toBeUndefined();
    });

    it.skip('should expose apollo client and graphql utilities', async () => {
      await import('~/components/Wrapper/auto-mount');

      // Check that Apollo client and GraphQL utilities are exposed
      expect(window.apolloClient).toBeDefined();
      expect(typeof window.gql).toBe('function');
      expect(typeof window.graphqlParse).toBe('function');
    });
  });
});
