import { defineComponent, h } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ComponentMapping } from '~/components/Wrapper/component-registry';
import type { MockInstance } from 'vitest';

// Mock @nuxt/ui components
vi.mock('@nuxt/ui/components/App.vue', () => ({
  default: defineComponent({
    name: 'UApp',
    setup(_, { slots }) {
      return () => h('div', { class: 'u-app' }, slots.default?.());
    },
  }),
}));

vi.mock('@nuxt/ui/vue-plugin', () => ({
  default: {
    install: vi.fn(),
  },
}));

// Mock component registry
const mockComponentMappings: ComponentMapping[] = [];
vi.mock('~/components/Wrapper/component-registry', () => ({
  componentMappings: mockComponentMappings,
}));

// Mock dependencies

const mockApolloClient = { query: vi.fn(), mutate: vi.fn() };
vi.mock('~/helpers/create-apollo-client', () => ({
  client: mockApolloClient,
}));

const mockGlobalPinia = {
  install: vi.fn(),
  use: vi.fn(),
  _a: null,
  _e: null,
  _s: new Map(),
  state: {},
};
vi.mock('~/store/globalPinia', () => ({
  globalPinia: mockGlobalPinia,
}));

const mockI18n = {
  global: {
    locale: { value: 'en_US' },
    availableLocales: ['en_US'],
    setLocaleMessage: vi.fn(),
  },
  install: vi.fn(),
};
const mockCreateI18nInstance = vi.fn(() => mockI18n);
const mockEnsureLocale = vi.fn();
const mockGetWindowLocale = vi.fn<[], string | undefined>(() => undefined);

vi.mock('~/helpers/i18n-loader', () => ({
  createI18nInstance: mockCreateI18nInstance,
  ensureLocale: mockEnsureLocale,
  getWindowLocale: mockGetWindowLocale,
}));

describe('mount-engine', () => {
  let mountUnifiedApp: typeof import('~/components/Wrapper/mount-engine').mountUnifiedApp;
  let autoMountAllComponents: typeof import('~/components/Wrapper/mount-engine').autoMountAllComponents;
  let TestComponent: ReturnType<typeof defineComponent>;
  let consoleWarnSpy: MockInstance;
  let consoleErrorSpy: MockInstance;

  beforeEach(async () => {
    // Clear component mappings
    mockComponentMappings.length = 0;

    // Import fresh module
    vi.resetModules();
    mockCreateI18nInstance.mockClear();
    mockEnsureLocale.mockClear();
    mockGetWindowLocale.mockReset();
    mockGetWindowLocale.mockReturnValue(undefined);
    mockI18n.install.mockClear();
    mockI18n.global.locale.value = 'en_US';
    mockI18n.global.availableLocales = ['en_US'];
    mockI18n.global.setLocaleMessage.mockClear();
    const module = await import('~/components/Wrapper/mount-engine');
    mountUnifiedApp = module.mountUnifiedApp;
    autoMountAllComponents = module.autoMountAllComponents;

    TestComponent = defineComponent({
      name: 'TestComponent',
      props: {
        message: {
          type: String,
          default: 'Hello',
        },
      },
      setup(props) {
        return () => h('div', { class: 'test-component' }, props.message);
      },
    });

    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.clearAllMocks();

    // Clean up DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    // Clean up global references
    // Clean up any window references if needed
  });

  describe('mountUnifiedApp', () => {
    it('should create and mount a unified app with shared context', async () => {
      // Add a component mapping
      const element = document.createElement('div');
      element.id = 'test-app';
      document.body.appendChild(element);

      mockComponentMappings.push({
        selector: '#test-app',
        appId: 'test-app',
        component: TestComponent,
      });

      const app = mountUnifiedApp();

      expect(app).toBeTruthy();
      expect(mockI18n.install).toHaveBeenCalled();
      expect(mockGlobalPinia.install).toHaveBeenCalled();

      // Wait for async component to render
      await vi.waitFor(() => {
        expect(element.querySelector('.test-component')).toBeTruthy();
      });

      // Check that component was rendered
      expect(element.textContent).toContain('Hello');
      expect(element.getAttribute('data-vue-mounted')).toBe('true');
      expect(element.classList.contains('unapi')).toBe(true);
    });

    it('should parse props from element attributes', async () => {
      const element = document.createElement('div');
      element.id = 'test-app';
      element.setAttribute('message', 'Attribute Message');
      document.body.appendChild(element);

      mockComponentMappings.push({
        selector: '#test-app',
        appId: 'test-app',
        component: TestComponent,
      });

      mountUnifiedApp();

      // Wait for async component to render
      await vi.waitFor(() => {
        expect(element.textContent).toContain('Attribute Message');
      });
    });

    it('should handle JSON props from attributes', () => {
      const element = document.createElement('div');
      element.id = 'test-app';
      element.setAttribute('message', '{"text": "JSON Message"}');
      document.body.appendChild(element);

      mockComponentMappings.push({
        selector: '#test-app',
        appId: 'test-app',
        component: TestComponent,
      });

      mountUnifiedApp();

      // The component receives the parsed JSON object
      expect(element.getAttribute('message')).toBe('{"text": "JSON Message"}');
    });

    it('should handle HTML-encoded JSON in attributes', () => {
      const element = document.createElement('div');
      element.id = 'test-app';
      element.setAttribute('message', '{&quot;text&quot;: &quot;Encoded&quot;}');
      document.body.appendChild(element);

      mockComponentMappings.push({
        selector: '#test-app',
        appId: 'test-app',
        component: TestComponent,
      });

      mountUnifiedApp();

      expect(element.getAttribute('message')).toBe('{&quot;text&quot;: &quot;Encoded&quot;}');
    });

    it('should handle multiple selector aliases', async () => {
      const element1 = document.createElement('div');
      element1.id = 'app1';
      document.body.appendChild(element1);

      const element2 = document.createElement('div');
      element2.className = 'app-alt';
      document.body.appendChild(element2);

      // Component with multiple selector aliases - only first match mounts
      mockComponentMappings.push({
        selector: ['#app1', '.app-alt'],
        appId: 'multi-selector',
        component: TestComponent,
      });

      mountUnifiedApp();

      // Wait for async component to render
      await vi.waitFor(() => {
        expect(element1.querySelector('.test-component')).toBeTruthy();
      });

      // Only the first matching element should be mounted
      expect(element1.getAttribute('data-vue-mounted')).toBe('true');

      // Second element should not be mounted (first match wins)
      expect(element2.querySelector('.test-component')).toBeFalsy();
      expect(element2.getAttribute('data-vue-mounted')).toBeNull();
    });

    it('should handle async component loaders', async () => {
      const element = document.createElement('div');
      element.id = 'async-app';
      document.body.appendChild(element);

      mockComponentMappings.push({
        selector: '#async-app',
        appId: 'async-app',
        component: TestComponent,
      });

      mountUnifiedApp();

      // Wait for component to mount
      await vi.waitFor(() => {
        expect(element.querySelector('.test-component')).toBeTruthy();
      });
    });

    it('should skip already mounted elements', () => {
      const element = document.createElement('div');
      element.id = 'already-mounted';
      element.setAttribute('data-vue-mounted', 'true');
      document.body.appendChild(element);

      mockComponentMappings.push({
        selector: '#already-mounted',
        appId: 'already-mounted',
        component: TestComponent,
      });

      mountUnifiedApp();

      // Should not mount to already mounted element
      expect(element.querySelector('.test-component')).toBeFalsy();
    });

    it('should handle missing elements gracefully', () => {
      mockComponentMappings.push({
        selector: '#non-existent',
        appId: 'non-existent',
        component: TestComponent,
      });

      const app = mountUnifiedApp();

      // Should still create the app successfully
      expect(app).toBeTruthy();
      // No errors should be thrown
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should error on invalid component mapping', async () => {
      const element = document.createElement('div');
      element.id = 'invalid-app';
      document.body.appendChild(element);

      // Invalid mapping - no component
      mockComponentMappings.push({
        selector: '#invalid-app',
        appId: 'invalid-app',
      } as ComponentMapping);

      mountUnifiedApp();

      // Should log error for missing component
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[UnifiedMount] No component defined for invalid-app'
      );

      // Component should not be rendered without a valid component
      expect(element.querySelector('.test-component')).toBeFalsy();
      expect(element.getAttribute('data-vue-mounted')).toBeNull();
    });

    it('should create hidden root element if not exists', () => {
      mountUnifiedApp();

      const rootElement = document.getElementById('unraid-unified-root');
      expect(rootElement).toBeTruthy();
      expect(rootElement?.style.display).toBe('none');
    });

    it('should reuse existing root element', () => {
      // Create root element first
      const existingRoot = document.createElement('div');
      existingRoot.id = 'unraid-unified-root';
      document.body.appendChild(existingRoot);

      mountUnifiedApp();

      const rootElement = document.getElementById('unraid-unified-root');
      expect(rootElement).toBe(existingRoot);
    });

    it('should wrap components in UApp for Nuxt UI support', async () => {
      const element = document.createElement('div');
      element.id = 'wrapped-app';
      document.body.appendChild(element);

      mockComponentMappings.push({
        selector: '#wrapped-app',
        appId: 'wrapped-app',
        component: TestComponent,
      });

      mountUnifiedApp();

      // Wait for async component to render
      await vi.waitFor(() => {
        expect(element.querySelector('.u-app')).toBeTruthy();
      });

      // Check that UApp wrapper is present
      expect(element.querySelector('.u-app .test-component')).toBeTruthy();
    });

    it('should share app context across all components', async () => {
      const element1 = document.createElement('div');
      element1.id = 'app1';
      document.body.appendChild(element1);

      const element2 = document.createElement('div');
      element2.id = 'app2';
      document.body.appendChild(element2);

      mockComponentMappings.push(
        {
          selector: '#app1',
          appId: 'app1',
          component: TestComponent,
        },
        {
          selector: '#app2',
          appId: 'app2',
          component: TestComponent,
        }
      );

      mountUnifiedApp();

      // Wait for async components to render
      await vi.waitFor(() => {
        expect(element1.querySelector('.test-component')).toBeTruthy();
        expect(element2.querySelector('.test-component')).toBeTruthy();
      });

      // Only one Pinia instance should be installed
      expect(mockGlobalPinia.install).toHaveBeenCalledTimes(1);
      // Only one i18n instance should be installed
      expect(mockI18n.install).toHaveBeenCalledTimes(1);
    });
  });

  describe('autoMountAllComponents', () => {
    it('should call mountUnifiedApp', async () => {
      const element = document.createElement('div');
      element.id = 'auto-app';
      document.body.appendChild(element);

      mockComponentMappings.push({
        selector: '#auto-app',
        appId: 'auto-app',
        component: TestComponent,
      });

      autoMountAllComponents();

      // Wait for async component to render
      await vi.waitFor(() => {
        expect(element.querySelector('.test-component')).toBeTruthy();
      });
    });
  });

  describe('i18n setup', () => {
    it('should setup i18n with default locale', () => {
      mountUnifiedApp();
      expect(mockCreateI18nInstance).toHaveBeenCalled();
      expect(mockEnsureLocale).toHaveBeenCalledWith(mockI18n, undefined);
      expect(mockI18n.install).toHaveBeenCalled();
    });

    it('should request window locale when available', () => {
      mockGetWindowLocale.mockReturnValue('ja_JP');

      mountUnifiedApp();

      expect(mockEnsureLocale).toHaveBeenCalledWith(mockI18n, 'ja_JP');
    });
  });

  describe('global exposure', () => {
    it('should expose globalPinia globally', () => {
      expect(window.globalPinia).toBeDefined();
      expect(window.globalPinia).toBe(mockGlobalPinia);
    });
  });

  describe('performance debugging', () => {
    it('should not log timing by default', () => {
      const element = document.createElement('div');
      element.id = 'perf-app';
      document.body.appendChild(element);

      mockComponentMappings.push({
        selector: '#perf-app',
        appId: 'perf-app',
        component: TestComponent,
      });

      mountUnifiedApp();

      // Should not log timing information when PERF_DEBUG is false
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining('[UnifiedMount] Mounted'));
    });
  });
});
