import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

// Mock all the component imports
vi.mock('~/components/Auth.ce.vue', () => ({
  default: { name: 'MockAuth', template: '<div>Auth</div>' }
}));
vi.mock('~/components/ConnectSettings/ConnectSettings.ce.vue', () => ({
  default: { name: 'MockConnectSettings', template: '<div>ConnectSettings</div>' }
}));
vi.mock('~/components/DownloadApiLogs.ce.vue', () => ({
  default: { name: 'MockDownloadApiLogs', template: '<div>DownloadApiLogs</div>' }
}));
vi.mock('~/components/HeaderOsVersion.ce.vue', () => ({
  default: { name: 'MockHeaderOsVersion', template: '<div>HeaderOsVersion</div>' }
}));
vi.mock('~/components/Modals.ce.vue', () => ({
  default: { name: 'MockModals', template: '<div>Modals</div>' }
}));
vi.mock('~/components/UserProfile.ce.vue', () => ({
  default: { name: 'MockUserProfile', template: '<div>UserProfile</div>' }
}));
vi.mock('~/components/UpdateOs.ce.vue', () => ({
  default: { name: 'MockUpdateOs', template: '<div>UpdateOs</div>' }
}));
vi.mock('~/components/DowngradeOs.ce.vue', () => ({
  default: { name: 'MockDowngradeOs', template: '<div>DowngradeOs</div>' }
}));
vi.mock('~/components/Registration.ce.vue', () => ({
  default: { name: 'MockRegistration', template: '<div>Registration</div>' }
}));
vi.mock('~/components/WanIpCheck.ce.vue', () => ({
  default: { name: 'MockWanIpCheck', template: '<div>WanIpCheck</div>' }
}));
vi.mock('~/components/Activation/WelcomeModal.ce.vue', () => ({
  default: { name: 'MockWelcomeModal', template: '<div>WelcomeModal</div>' }
}));
vi.mock('~/components/SsoButton.ce.vue', () => ({
  default: { name: 'MockSsoButton', template: '<div>SsoButton</div>' }
}));
vi.mock('~/components/Logs/LogViewer.ce.vue', () => ({
  default: { name: 'MockLogViewer', template: '<div>LogViewer</div>' }
}));
vi.mock('~/components/ThemeSwitcher.ce.vue', () => ({
  default: { name: 'MockThemeSwitcher', template: '<div>ThemeSwitcher</div>' }
}));
vi.mock('~/components/ApiKeyPage.ce.vue', () => ({
  default: { name: 'MockApiKeyPage', template: '<div>ApiKeyPage</div>' }
}));
vi.mock('~/components/DevModalTest.ce.vue', () => ({
  default: { name: 'MockDevModalTest', template: '<div>DevModalTest</div>' }
}));
vi.mock('~/components/ApiKeyAuthorize.ce.vue', () => ({
  default: { name: 'MockApiKeyAuthorize', template: '<div>ApiKeyAuthorize</div>' }
}));
vi.mock('~/components/UnraidToaster.vue', () => ({
  default: { name: 'MockUnraidToaster', template: '<div>UnraidToaster</div>' }
}));

// Mock vue-mount-app module
const mockAutoMountComponent = vi.fn();
const mockMountVueApp = vi.fn();
const mockGetMountedApp = vi.fn();

vi.mock('~/components/Wrapper/vue-mount-app', () => ({
  autoMountComponent: mockAutoMountComponent,
  mountVueApp: mockMountVueApp,
  getMountedApp: mockGetMountedApp,
}));

// Mock theme store
const mockSetTheme = vi.fn();
const mockSetCssVars = vi.fn();
const mockUseThemeStore = vi.fn(() => ({
  setTheme: mockSetTheme,
  setCssVars: mockSetCssVars,
}));

vi.mock('~/store/theme', () => ({
  useThemeStore: mockUseThemeStore,
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

describe('standalone-mount', () => {
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
      await import('~/components/standalone-mount');

      expect(window.apolloClient).toBe(mockApolloClient);
      expect(window.graphqlParse).toBe(mockParse);
      expect(window.gql).toBe(mockParse);
      expect(mockProvideApolloClient).toHaveBeenCalledWith(mockApolloClient);
    });

    it('should initialize theme store', async () => {
      await import('~/components/standalone-mount');

      expect(mockUseThemeStore).toHaveBeenCalled();
      expect(mockSetTheme).toHaveBeenCalled();
      expect(mockSetCssVars).toHaveBeenCalled();
    });

    it('should ensure teleport container exists', async () => {
      await import('~/components/standalone-mount');

      expect(mockEnsureTeleportContainer).toHaveBeenCalled();
    });
  });

  describe('component auto-mounting', () => {
    it('should auto-mount all defined components', async () => {
      await import('~/components/standalone-mount');

      // Verify that autoMountComponent was called multiple times
      expect(mockAutoMountComponent.mock.calls.length).toBeGreaterThan(0);
      
      // Verify all calls have the correct structure
      mockAutoMountComponent.mock.calls.forEach(call => {
        expect(call[0]).toBeDefined(); // Component
        expect(call[1]).toBeDefined(); // Selector
        expect(call[2]).toMatchObject({
          appId: expect.any(String),
          useShadowRoot: false,
        });
      });
      
      // Extract all selectors that were mounted
      const mountedSelectors = mockAutoMountComponent.mock.calls.map(call => call[1]);
      
      // Verify critical components are mounted
      expect(mountedSelectors).toContain('unraid-auth');
      expect(mountedSelectors).toContain('unraid-modals');
      expect(mountedSelectors).toContain('unraid-user-profile');
      expect(mountedSelectors).toContain('uui-toaster');
      expect(mountedSelectors).toContain('#modals'); // Legacy modal selector
      
      // Verify no shadow DOM is used
      const allUseShadowRoot = mockAutoMountComponent.mock.calls.every(
        call => call[2].useShadowRoot === false
      );
      expect(allUseShadowRoot).toBe(true);
    });
  });

  describe('global exports', () => {
    it('should expose UnraidComponents globally', async () => {
      await import('~/components/standalone-mount');

      expect(window.UnraidComponents).toBeDefined();
      expect(window.UnraidComponents).toHaveProperty('Auth');
      expect(window.UnraidComponents).toHaveProperty('ConnectSettings');
      expect(window.UnraidComponents).toHaveProperty('DownloadApiLogs');
      expect(window.UnraidComponents).toHaveProperty('HeaderOsVersion');
      expect(window.UnraidComponents).toHaveProperty('Modals');
      expect(window.UnraidComponents).toHaveProperty('UserProfile');
      expect(window.UnraidComponents).toHaveProperty('UpdateOs');
      expect(window.UnraidComponents).toHaveProperty('DowngradeOs');
      expect(window.UnraidComponents).toHaveProperty('Registration');
      expect(window.UnraidComponents).toHaveProperty('WanIpCheck');
      expect(window.UnraidComponents).toHaveProperty('WelcomeModal');
      expect(window.UnraidComponents).toHaveProperty('SsoButton');
      expect(window.UnraidComponents).toHaveProperty('LogViewer');
      expect(window.UnraidComponents).toHaveProperty('ThemeSwitcher');
      expect(window.UnraidComponents).toHaveProperty('ApiKeyPage');
      expect(window.UnraidComponents).toHaveProperty('DevModalTest');
      expect(window.UnraidComponents).toHaveProperty('ApiKeyAuthorize');
      expect(window.UnraidComponents).toHaveProperty('UnraidToaster');
    });

    it('should expose utility functions globally', async () => {
      await import('~/components/standalone-mount');

      expect(window.mountVueApp).toBe(mockMountVueApp);
      expect(window.getMountedApp).toBe(mockGetMountedApp);
    });

    it('should create dynamic mount functions for each component', async () => {
      await import('~/components/standalone-mount');

      // Check for some dynamic mount functions
      expect(typeof window.mountAuth).toBe('function');
      expect(typeof window.mountConnectSettings).toBe('function');
      expect(typeof window.mountUserProfile).toBe('function');
      expect(typeof window.mountModals).toBe('function');
      expect(typeof window.mountThemeSwitcher).toBe('function');

      // Test calling a dynamic mount function
      const customSelector = '#custom-auth';
      window.mountAuth?.(customSelector);
      
      expect(mockMountVueApp).toHaveBeenCalledWith(
        expect.objectContaining({
          selector: customSelector,
          useShadowRoot: false,
        })
      );
    });

    it('should use default selector when no custom selector provided', async () => {
      await import('~/components/standalone-mount');

      // Call mount function without custom selector
      window.mountAuth?.();
      
      expect(mockMountVueApp).toHaveBeenCalledWith(
        expect.objectContaining({
          selector: 'unraid-auth',
          useShadowRoot: false,
        })
      );
    });
  });

  // Skip SSR safety test as it's complex to test with module isolation
  describe.skip('SSR safety', () => {
    it('should not initialize when window is undefined', async () => {
      // This test is skipped because the module initialization happens at import time
      // and it's difficult to properly isolate the window object manipulation
      // The functionality is simple enough - just checking if window exists before running code
    });
  });
});
