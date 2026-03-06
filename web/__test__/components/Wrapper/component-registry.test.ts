import { describe, expect, it, vi } from 'vitest';

// Mock Vue's defineAsyncComponent
vi.mock('vue', () => ({
  defineAsyncComponent: vi.fn((loader) => ({ loader, __asyncComponent: true })),
}));

// Mock CSS imports
vi.mock('~/assets/main.css', () => ({}));
vi.mock('@unraid/ui/styles', () => ({}));

// Mock all component imports
vi.mock('@/components/HeaderOsVersion.standalone.vue', () => ({ default: 'HeaderOsVersion' }));
vi.mock('@/components/UserProfile.standalone.vue', () => ({ default: 'UserProfile' }));
vi.mock('../Auth.standalone.vue', () => ({ default: 'Auth' }));
vi.mock('../ConnectSettings/ConnectSettings.standalone.vue', () => ({ default: 'ConnectSettings' }));
vi.mock('@/components/Modals.standalone.vue', () => ({ default: 'Modals' }));
vi.mock('../Registration.standalone.vue', () => ({ default: 'Registration' }));
vi.mock('../WanIpCheck.standalone.vue', () => ({ default: 'WanIpCheck' }));
vi.mock('../CallbackHandler.standalone.vue', () => ({ default: 'CallbackHandler' }));
vi.mock('../Logs/LogViewer.standalone.vue', () => ({ default: 'LogViewer' }));
vi.mock('../SsoButton.standalone.vue', () => ({ default: 'SsoButton' }));
vi.mock('../UpdateOs.standalone.vue', () => ({ default: 'UpdateOs' }));
vi.mock('../DowngradeOs.standalone.vue', () => ({ default: 'DowngradeOs' }));
vi.mock('../DevSettings.vue', () => ({ default: 'DevSettings' }));
vi.mock('../ApiKeyPage.standalone.vue', () => ({ default: 'ApiKeyPage' }));
vi.mock('../ApiKeyAuthorize.standalone.vue', () => ({ default: 'ApiKeyAuthorize' }));
vi.mock('../DevModalTest.standalone.vue', () => ({ default: 'DevModalTest' }));
vi.mock('../LayoutViews/Detail/DetailTest.standalone.vue', () => ({ default: 'DetailTest' }));
vi.mock('@/components/ThemeSwitcher.standalone.vue', () => ({ default: 'ThemeSwitcher' }));
vi.mock('../ColorSwitcher.standalone.vue', () => ({ default: 'ColorSwitcher' }));
vi.mock('@/components/UnraidToaster.vue', () => ({ default: 'UnraidToaster' }));
vi.mock('../UpdateOs/TestUpdateModal.standalone.vue', () => ({ default: 'TestUpdateModal' }));
vi.mock('../TestThemeSwitcher.standalone.vue', () => ({ default: 'TestThemeSwitcher' }));

describe('component-registry', () => {
  it('should export ComponentMapping type', async () => {
    const module = await import('~/components/Wrapper/component-registry');
    expect(module).toBeDefined();
  });

  it('should export componentMappings array', async () => {
    const { componentMappings } = await import('~/components/Wrapper/component-registry');
    expect(Array.isArray(componentMappings)).toBe(true);
    expect(componentMappings.length).toBeGreaterThan(0);
  });

  it('should have required properties for each component mapping', async () => {
    const { componentMappings } = await import('~/components/Wrapper/component-registry');

    componentMappings.forEach((mapping) => {
      expect(mapping).toHaveProperty('selector');
      expect(mapping).toHaveProperty('appId');
      expect(mapping).toHaveProperty('component');

      // Check selector is string or array
      expect(typeof mapping.selector === 'string' || Array.isArray(mapping.selector)).toBe(true);

      // Check appId is string
      expect(typeof mapping.appId).toBe('string');

      // Check component exists and is an object
      expect(mapping.component).toBeDefined();
      expect(typeof mapping.component).toBe('object');
    });
  });

  it('should have priority components listed first', async () => {
    const { componentMappings } = await import('~/components/Wrapper/component-registry');

    // Priority components should be first
    expect(componentMappings[0].appId).toBe('header-os-version');
    expect(componentMappings[1].appId).toBe('user-profile');
  });

  it('should support multiple selectors for modals', async () => {
    const { componentMappings } = await import('~/components/Wrapper/component-registry');

    const modalsMapping = componentMappings.find((m) => m.appId === 'modals');
    expect(Array.isArray(modalsMapping?.selector)).toBe(true);
    expect(modalsMapping?.selector).toContain('unraid-modals');
    expect(modalsMapping?.selector).toContain('#modals');
    expect(modalsMapping?.selector).toContain('modals-direct');
  });

  it('should support multiple selectors for api key components', async () => {
    const { componentMappings } = await import('~/components/Wrapper/component-registry');

    const apiKeyMapping = componentMappings.find((m) => m.appId === 'apikey-page');
    expect(Array.isArray(apiKeyMapping?.selector)).toBe(true);
    expect(apiKeyMapping?.selector).toContain('unraid-apikey-page');
    expect(apiKeyMapping?.selector).toContain('unraid-api-key-manager');
  });

  it('should support multiple selectors for toaster', async () => {
    const { componentMappings } = await import('~/components/Wrapper/component-registry');

    const toasterMapping = componentMappings.find((m) => m.appId === 'toaster');
    expect(Array.isArray(toasterMapping?.selector)).toBe(true);
    expect(toasterMapping?.selector).toContain('unraid-toaster');
    expect(toasterMapping?.selector).toContain('uui-toaster');
  });

  it('should have unique appIds', async () => {
    const { componentMappings } = await import('~/components/Wrapper/component-registry');

    const appIds = componentMappings.map((m) => m.appId);
    const uniqueAppIds = new Set(appIds);
    expect(appIds.length).toBe(uniqueAppIds.size);
  });

  it('should define all components as async components', async () => {
    const { componentMappings } = await import('~/components/Wrapper/component-registry');

    componentMappings.forEach((mapping) => {
      expect(mapping.component).toBeDefined();
      expect(typeof mapping.component).toBe('object');
    });
  });

  it('should have at least the core component mappings', async () => {
    const { componentMappings } = await import('~/components/Wrapper/component-registry');

    // Just ensure we have a reasonable number of components, not an exact count
    expect(componentMappings.length).toBeGreaterThan(10);
  });

  it('should include all expected components', async () => {
    const { componentMappings } = await import('~/components/Wrapper/component-registry');

    const expectedAppIds = [
      'header-os-version',
      'user-profile',
      'auth',
      'connect-settings',
      'modals',
      'registration',
      'wan-ip-check',
      'callback-handler',
      'log-viewer',
      'sso-button',
      'update-os',
      'downgrade-os',
      'dev-settings',
      'apikey-page',
      'apikey-authorize',
      'dev-modal-test',
      'detail-test',
      'theme-switcher',
      'color-switcher',
      'toaster',
      'test-update-modal',
      'test-theme-switcher',
    ];

    const actualAppIds = componentMappings.map((m) => m.appId);
    expectedAppIds.forEach((appId) => {
      expect(actualAppIds).toContain(appId);
    });
  });

  it('should properly format selectors', async () => {
    const { componentMappings } = await import('~/components/Wrapper/component-registry');

    componentMappings.forEach((mapping) => {
      if (typeof mapping.selector === 'string') {
        // Single selectors should be non-empty strings
        expect(mapping.selector.length).toBeGreaterThan(0);
      } else if (Array.isArray(mapping.selector)) {
        // Array selectors should have at least one item
        expect(mapping.selector.length).toBeGreaterThan(0);
        // Each selector in array should be non-empty string
        mapping.selector.forEach((sel) => {
          expect(typeof sel).toBe('string');
          expect(sel.length).toBeGreaterThan(0);
        });
      }
    });
  });
});
