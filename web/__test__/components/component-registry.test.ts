import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock all the component imports
vi.mock('~/components/Auth.ce.vue', () => ({
  default: { name: 'MockAuth', template: '<div>Auth</div>' },
}));
vi.mock('~/components/ConnectSettings/ConnectSettings.ce.vue', () => ({
  default: { name: 'MockConnectSettings', template: '<div>ConnectSettings</div>' },
}));
vi.mock('~/components/DownloadApiLogs.ce.vue', () => ({
  default: { name: 'MockDownloadApiLogs', template: '<div>DownloadApiLogs</div>' },
}));
vi.mock('~/components/HeaderOsVersion.ce.vue', () => ({
  default: { name: 'MockHeaderOsVersion', template: '<div>HeaderOsVersion</div>' },
}));
vi.mock('~/components/Modals.ce.vue', () => ({
  default: { name: 'MockModals', template: '<div>Modals</div>' },
}));
vi.mock('~/components/UserProfile.ce.vue', () => ({
  default: { name: 'MockUserProfile', template: '<div>UserProfile</div>' },
}));
vi.mock('~/components/UpdateOs.ce.vue', () => ({
  default: { name: 'MockUpdateOs', template: '<div>UpdateOs</div>' },
}));
vi.mock('~/components/DowngradeOs.ce.vue', () => ({
  default: { name: 'MockDowngradeOs', template: '<div>DowngradeOs</div>' },
}));
vi.mock('~/components/Registration.ce.vue', () => ({
  default: { name: 'MockRegistration', template: '<div>Registration</div>' },
}));
vi.mock('~/components/WanIpCheck.ce.vue', () => ({
  default: { name: 'MockWanIpCheck', template: '<div>WanIpCheck</div>' },
}));
vi.mock('~/components/Activation/WelcomeModal.ce.vue', () => ({
  default: { name: 'MockWelcomeModal', template: '<div>WelcomeModal</div>' },
}));
vi.mock('~/components/SsoButton.ce.vue', () => ({
  default: { name: 'MockSsoButton', template: '<div>SsoButton</div>' },
}));
vi.mock('~/components/Logs/LogViewer.ce.vue', () => ({
  default: { name: 'MockLogViewer', template: '<div>LogViewer</div>' },
}));
vi.mock('~/components/ThemeSwitcher.ce.vue', () => ({
  default: { name: 'MockThemeSwitcher', template: '<div>ThemeSwitcher</div>' },
}));
vi.mock('~/components/ApiKeyPage.ce.vue', () => ({
  default: { name: 'MockApiKeyPage', template: '<div>ApiKeyPage</div>' },
}));
vi.mock('~/components/DevModalTest.ce.vue', () => ({
  default: { name: 'MockDevModalTest', template: '<div>DevModalTest</div>' },
}));
vi.mock('~/components/ApiKeyAuthorize.ce.vue', () => ({
  default: { name: 'MockApiKeyAuthorize', template: '<div>ApiKeyAuthorize</div>' },
}));
vi.mock('~/components/UnraidToaster.vue', () => ({
  default: { name: 'MockUnraidToaster', template: '<div>UnraidToaster</div>' },
}));

// Mock mount-engine module
const mockAutoMountComponent = vi.fn();
const mockAutoMountAllComponents = vi.fn();
const mockMountVueApp = vi.fn();
const mockGetMountedApp = vi.fn();

vi.mock('~/components/Wrapper/mount-engine', () => ({
  autoMountComponent: mockAutoMountComponent,
  autoMountAllComponents: mockAutoMountAllComponents,
  mountVueApp: mockMountVueApp,
  getMountedApp: mockGetMountedApp,
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
const mockEnsureTeleportContainer = vi.fn();
vi.mock('@unraid/ui', () => ({
  ensureTeleportContainer: mockEnsureTeleportContainer,
}));

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

    it('should initialize theme once', async () => {
      await import('~/components/Wrapper/auto-mount');

      expect(mockInitializeTheme).toHaveBeenCalled();
    });

    it('should ensure teleport container exists', async () => {
      await import('~/components/Wrapper/auto-mount');

      expect(mockEnsureTeleportContainer).toHaveBeenCalled();
    });
  });

  describe('component auto-mounting', () => {
    it('should auto-mount components when DOM elements exist', async () => {
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
    it('should expose utility functions globally', async () => {
      await import('~/components/Wrapper/auto-mount');

      expect(window.mountVueApp).toBe(mockMountVueApp);
      expect(window.getMountedApp).toBe(mockGetMountedApp);
      expect(window.autoMountComponent).toBe(mockAutoMountComponent);
    });

    it('should expose mountVueApp function globally', async () => {
      await import('~/components/Wrapper/auto-mount');

      // Check that mountVueApp is exposed
      expect(typeof window.mountVueApp).toBe('function');

      // Note: Dynamic mount functions are no longer created automatically
      // They would be created via mountVueApp calls
    });

    it('should expose autoMountComponent function globally', async () => {
      await import('~/components/Wrapper/auto-mount');

      // Check that autoMountComponent is exposed
      expect(typeof window.autoMountComponent).toBe('function');
    });
  });
});
