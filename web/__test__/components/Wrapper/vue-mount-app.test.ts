import { defineComponent, h } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import type { App as VueApp } from 'vue';

// Extend HTMLElement to include Vue's internal properties (matching the source file)
interface HTMLElementWithVue extends HTMLElement {
  __vueParentComponent?: {
    appContext?: {
      app?: VueApp;
    };
  };
}

// We'll manually mock createApp only in specific tests that need it
vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue');
  return {
    ...actual,
  };
});

const mockEnsureTeleportContainer = vi.fn();
vi.mock('@unraid/ui', () => ({
  ensureTeleportContainer: mockEnsureTeleportContainer,
}));

const mockI18n = {
  global: {},
  install: vi.fn(),
};
vi.mock('vue-i18n', () => ({
  createI18n: vi.fn(() => mockI18n),
}));

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

vi.mock('~/locales/en_US.json', () => ({
  default: { test: 'Test Message' },
}));

vi.mock('~/helpers/i18n-utils', () => ({
  createHtmlEntityDecoder: vi.fn(() => (str: string) => str),
}));

vi.mock('~/assets/main.css?inline', () => ({
  default: '.test { color: red; }',
}));

describe('vue-mount-app', () => {
  let mountVueApp: typeof import('~/components/Wrapper/vue-mount-app').mountVueApp;
  let unmountVueApp: typeof import('~/components/Wrapper/vue-mount-app').unmountVueApp;
  let getMountedApp: typeof import('~/components/Wrapper/vue-mount-app').getMountedApp;
  let autoMountComponent: typeof import('~/components/Wrapper/vue-mount-app').autoMountComponent;
  let TestComponent: ReturnType<typeof defineComponent>;
  let consoleWarnSpy: MockInstance;
  let consoleErrorSpy: MockInstance;
  let consoleInfoSpy: MockInstance;
  let consoleDebugSpy: MockInstance;
  let testContainer: HTMLDivElement;

  beforeEach(async () => {
    const module = await import('~/components/Wrapper/vue-mount-app');
    mountVueApp = module.mountVueApp;
    unmountVueApp = module.unmountVueApp;
    getMountedApp = module.getMountedApp;
    autoMountComponent = module.autoMountComponent;

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
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);

    vi.clearAllMocks();
    
    // Clear mounted apps from previous tests
    if (window.mountedApps) {
      window.mountedApps.clear();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    if (window.mountedApps) {
      window.mountedApps.clear();
    }
  });

  describe('mountVueApp', () => {
    it('should mount a Vue app to a single element', () => {
      const element = document.createElement('div');
      element.id = 'app';
      document.body.appendChild(element);

      const app = mountVueApp({
        component: TestComponent,
        selector: '#app',
      });

      expect(app).toBeTruthy();
      expect(element.querySelector('.test-component')).toBeTruthy();
      expect(element.textContent).toBe('Hello');
      expect(mockEnsureTeleportContainer).toHaveBeenCalled();
    });

    it('should mount with custom props', () => {
      const element = document.createElement('div');
      element.id = 'app';
      document.body.appendChild(element);

      const app = mountVueApp({
        component: TestComponent,
        selector: '#app',
        props: { message: 'Custom Message' },
      });

      expect(app).toBeTruthy();
      expect(element.textContent).toBe('Custom Message');
    });

    it('should parse props from element attributes', () => {
      const element = document.createElement('div');
      element.id = 'app';
      element.setAttribute('message', 'Attribute Message');
      document.body.appendChild(element);

      const app = mountVueApp({
        component: TestComponent,
        selector: '#app',
      });

      expect(app).toBeTruthy();
      expect(element.textContent).toBe('Attribute Message');
    });

    it('should parse JSON props from attributes', () => {
      const element = document.createElement('div');
      element.id = 'app';
      element.setAttribute('message', '{"text": "JSON Message"}');
      document.body.appendChild(element);

      const app = mountVueApp({
        component: TestComponent,
        selector: '#app',
      });

      expect(app).toBeTruthy();
      expect(element.getAttribute('message')).toBe('{"text": "JSON Message"}');
    });

    it('should handle HTML-encoded JSON in attributes', () => {
      const element = document.createElement('div');
      element.id = 'app';
      element.setAttribute('message', '{&quot;text&quot;: &quot;Encoded&quot;}');
      document.body.appendChild(element);

      const app = mountVueApp({
        component: TestComponent,
        selector: '#app',
      });

      expect(app).toBeTruthy();
      expect(element.getAttribute('message')).toBe('{&quot;text&quot;: &quot;Encoded&quot;}');
    });

    it('should mount to multiple elements', () => {
      const element1 = document.createElement('div');
      element1.className = 'multi-mount';
      document.body.appendChild(element1);

      const element2 = document.createElement('div');
      element2.className = 'multi-mount';
      document.body.appendChild(element2);

      const app = mountVueApp({
        component: TestComponent,
        selector: '.multi-mount',
      });

      expect(app).toBeTruthy();
      expect(element1.querySelector('.test-component')).toBeTruthy();
      expect(element2.querySelector('.test-component')).toBeTruthy();
    });

    it('should use shadow root when specified', () => {
      const element = document.createElement('div');
      element.id = 'shadow-app';
      document.body.appendChild(element);

      const app = mountVueApp({
        component: TestComponent,
        selector: '#shadow-app',
        useShadowRoot: true,
      });

      expect(app).toBeTruthy();
      expect(element.shadowRoot).toBeTruthy();
      expect(element.shadowRoot?.querySelector('#app')).toBeTruthy();
      expect(element.shadowRoot?.querySelector('.test-component')).toBeTruthy();
    });

    it('should inject styles into shadow root', () => {
      const element = document.createElement('div');
      element.id = 'shadow-app';
      document.body.appendChild(element);

      mountVueApp({
        component: TestComponent,
        selector: '#shadow-app',
        useShadowRoot: true,
      });

      const styleElement = element.shadowRoot?.querySelector('style[data-tailwind]');
      expect(styleElement).toBeTruthy();
      expect(styleElement?.textContent).toBe('.test { color: red; }');
    });

    it('should inject global styles to document', () => {
      const element = document.createElement('div');
      element.id = 'app';
      document.body.appendChild(element);

      mountVueApp({
        component: TestComponent,
        selector: '#app',
      });

      const globalStyle = document.querySelector('style[data-tailwind-global]');
      expect(globalStyle).toBeTruthy();
      expect(globalStyle?.textContent).toBe('.test { color: red; }');
    });

    it('should warn when app is already mounted', () => {
      const element = document.createElement('div');
      element.id = 'app';
      document.body.appendChild(element);

      const app1 = mountVueApp({
        component: TestComponent,
        selector: '#app',
        appId: 'test-app',
      });

      const app2 = mountVueApp({
        component: TestComponent,
        selector: '#app',
        appId: 'test-app',
      });

      expect(app1).toBeTruthy();
      expect(app2).toBe(app1);
      expect(consoleWarnSpy).toHaveBeenCalledWith('[VueMountApp] App test-app is already mounted');
    });

    it('should handle modal singleton behavior', () => {
      const element1 = document.createElement('div');
      element1.id = 'modals';
      document.body.appendChild(element1);

      const element2 = document.createElement('div');
      element2.id = 'unraid-modals';
      document.body.appendChild(element2);

      const app1 = mountVueApp({
        component: TestComponent,
        selector: '#modals',
        appId: 'modals',
      });

      const app2 = mountVueApp({
        component: TestComponent,
        selector: '#unraid-modals',
        appId: 'unraid-modals',
      });

      expect(app1).toBeTruthy();
      expect(app2).toBe(app1);
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[VueMountApp] Modals component already mounted as modals, skipping unraid-modals'
      );
    });

    it('should clean up existing Vue attributes', () => {
      const element = document.createElement('div');
      element.id = 'app';
      element.setAttribute('data-vue-mounted', 'true');
      element.setAttribute('data-v-app', '');
      element.setAttribute('data-server-rendered', 'true');
      element.setAttribute('data-v-123', '');
      document.body.appendChild(element);

      mountVueApp({
        component: TestComponent,
        selector: '#app',
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[VueMountApp] Element #app has Vue attributes but no content, cleaning up'
      );
    });

    it('should handle elements with problematic child nodes', () => {
      const element = document.createElement('div');
      element.id = 'app';
      element.appendChild(document.createTextNode('   '));
      element.appendChild(document.createComment('test comment'));
      document.body.appendChild(element);

      const app = mountVueApp({
        component: TestComponent,
        selector: '#app',
      });

      expect(app).toBeTruthy();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[VueMountApp] Cleaning up problematic nodes in #app before mounting'
      );
    });

    it('should return null when no elements found', () => {
      const app = mountVueApp({
        component: TestComponent,
        selector: '#non-existent',
      });

      expect(app).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[VueMountApp] No elements found for selector: #non-existent'
      );
    });

    it('should handle mount errors gracefully', () => {
      const element = document.createElement('div');
      element.id = 'app';
      document.body.appendChild(element);

      const ErrorComponent = defineComponent({
        setup() {
          throw new Error('Component error');
        },
      });

      expect(() => {
        mountVueApp({
          component: ErrorComponent,
          selector: '#app',
        });
      }).toThrow('Component error');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should add unapi class to mounted elements', () => {
      const element = document.createElement('div');
      element.id = 'app';
      document.body.appendChild(element);

      mountVueApp({
        component: TestComponent,
        selector: '#app',
      });

      expect(element.classList.contains('unapi')).toBe(true);
      expect(element.getAttribute('data-vue-mounted')).toBe('true');
    });

    it('should skip disconnected elements during multi-mount', () => {
      const element1 = document.createElement('div');
      element1.className = 'multi';
      document.body.appendChild(element1);

      const element2 = document.createElement('div');
      element2.className = 'multi';
      // This element is NOT added to the document

      // Create a third element and manually add it to element1 to simulate DOM issues
      const orphanedChild = document.createElement('span');
      element1.appendChild(orphanedChild);
      // Now remove element1 from DOM temporarily to trigger the warning
      element1.remove();
      
      // Add element1 back
      document.body.appendChild(element1);
      
      // Create elements matching the selector
      document.body.innerHTML = '';
      const validElement = document.createElement('div');
      validElement.className = 'multi';
      document.body.appendChild(validElement);

      const disconnectedElement = document.createElement('div');
      disconnectedElement.className = 'multi';
      const container = document.createElement('div');
      container.appendChild(disconnectedElement);
      // Now disconnectedElement has a parent but that parent is not in the document
      
      const app = mountVueApp({
        component: TestComponent,
        selector: '.multi',
      });

      expect(app).toBeTruthy();
      // The app should mount only to the connected element
      expect(validElement.querySelector('.test-component')).toBeTruthy();
    });
  });

  describe('unmountVueApp', () => {
    it('should unmount a mounted app', () => {
      const element = document.createElement('div');
      element.id = 'app';
      document.body.appendChild(element);

      const app = mountVueApp({
        component: TestComponent,
        selector: '#app',
        appId: 'test-app',
      });

      expect(app).toBeTruthy();
      expect(getMountedApp('test-app')).toBe(app);

      const result = unmountVueApp('test-app');
      expect(result).toBe(true);
      expect(getMountedApp('test-app')).toBeUndefined();
    });

    it('should clean up data attributes on unmount', () => {
      const element = document.createElement('div');
      element.id = 'app';
      document.body.appendChild(element);

      mountVueApp({
        component: TestComponent,
        selector: '#app',
        appId: 'test-app',
      });

      expect(element.getAttribute('data-vue-mounted')).toBe('true');
      expect(element.classList.contains('unapi')).toBe(true);

      unmountVueApp('test-app');

      expect(element.getAttribute('data-vue-mounted')).toBeNull();
    });

    it('should unmount cloned apps', () => {
      const element1 = document.createElement('div');
      element1.className = 'multi';
      document.body.appendChild(element1);

      const element2 = document.createElement('div');
      element2.className = 'multi';
      document.body.appendChild(element2);

      mountVueApp({
        component: TestComponent,
        selector: '.multi',
        appId: 'multi-app',
      });

      const result = unmountVueApp('multi-app');
      expect(result).toBe(true);
    });

    it('should remove shadow root containers', () => {
      const element = document.createElement('div');
      element.id = 'shadow-app';
      document.body.appendChild(element);

      mountVueApp({
        component: TestComponent,
        selector: '#shadow-app',
        appId: 'shadow-app',
        useShadowRoot: true,
      });

      expect(element.shadowRoot?.querySelector('#app')).toBeTruthy();

      unmountVueApp('shadow-app');

      expect(element.shadowRoot?.querySelector('#app')).toBeFalsy();
    });

    it('should warn when unmounting non-existent app', () => {
      const result = unmountVueApp('non-existent');
      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[VueMountApp] No app found with id: non-existent'
      );
    });

    it('should handle unmount errors gracefully', () => {
      const element = document.createElement('div');
      element.id = 'app';
      document.body.appendChild(element);

      const app = mountVueApp({
        component: TestComponent,
        selector: '#app',
        appId: 'test-app',
      });

      // Force an error by corrupting the app
      if (app) {
        (app as { unmount: () => void }).unmount = () => {
          throw new Error('Unmount error');
        };
      }

      const result = unmountVueApp('test-app');
      expect(result).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[VueMountApp] Error unmounting app test-app:',
        expect.any(Error)
      );
    });
  });

  describe('getMountedApp', () => {
    it('should return mounted app by id', () => {
      const element = document.createElement('div');
      element.id = 'app';
      document.body.appendChild(element);

      const app = mountVueApp({
        component: TestComponent,
        selector: '#app',
        appId: 'test-app',
      });

      expect(getMountedApp('test-app')).toBe(app);
    });

    it('should return undefined for non-existent app', () => {
      expect(getMountedApp('non-existent')).toBeUndefined();
    });
  });

  describe('autoMountComponent', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-mount when DOM is ready', async () => {
      const element = document.createElement('div');
      element.id = 'auto-app';
      document.body.appendChild(element);

      autoMountComponent(TestComponent, '#auto-app');

      await vi.runAllTimersAsync();

      expect(element.querySelector('.test-component')).toBeTruthy();
    });

    it('should wait for DOMContentLoaded if document is loading', async () => {
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true,
      });

      const element = document.createElement('div');
      element.id = 'auto-app';
      document.body.appendChild(element);

      autoMountComponent(TestComponent, '#auto-app');

      expect(element.querySelector('.test-component')).toBeFalsy();

      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true,
      });

      document.dispatchEvent(new Event('DOMContentLoaded'));
      await vi.runAllTimersAsync();

      expect(element.querySelector('.test-component')).toBeTruthy();
    });

    it('should skip auto-mount for already mounted modals', async () => {
      const element1 = document.createElement('div');
      element1.id = 'modals';
      document.body.appendChild(element1);

      mountVueApp({
        component: TestComponent,
        selector: '#modals',
        appId: 'modals',
      });

      autoMountComponent(TestComponent, '#modals');
      await vi.runAllTimersAsync();

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[VueMountApp] Modals component already mounted, skipping #modals'
      );
    });

    it('should add delay for problematic selectors', async () => {
      const element = document.createElement('div');
      element.id = 'unraid-connect-settings';
      document.body.appendChild(element);

      autoMountComponent(TestComponent, '#unraid-connect-settings');

      await vi.advanceTimersByTimeAsync(100);
      expect(element.querySelector('.test-component')).toBeFalsy();

      await vi.advanceTimersByTimeAsync(200);
      expect(element.querySelector('.test-component')).toBeTruthy();
    });

    it('should mount even when element is hidden', async () => {
      const element = document.createElement('div');
      element.id = 'hidden-app';
      element.style.display = 'none';
      document.body.appendChild(element);

      autoMountComponent(TestComponent, '#hidden-app');
      await vi.runAllTimersAsync();

      // Hidden elements should still mount successfully
      expect(element.querySelector('.test-component')).toBeTruthy();
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('No valid DOM elements found')
      );
    });

    it('should handle nextSibling errors with retry', async () => {
      const element = document.createElement('div');
      element.id = 'error-app';
      element.setAttribute('data-vue-mounted', 'true');
      element.setAttribute('data-v-app', '');
      document.body.appendChild(element);

      // Simulate the element having Vue instance references which cause nextSibling errors
      const mockVueInstance = { appContext: { app: {} as VueApp } };
      (element as HTMLElementWithVue).__vueParentComponent = mockVueInstance;
      
      // Add an invalid child that will trigger cleanup
      const textNode = document.createTextNode('  ');
      element.appendChild(textNode);

      autoMountComponent(TestComponent, '#error-app');
      await vi.runAllTimersAsync();

      // Should detect and clean up existing Vue state
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[VueMountApp] Element #error-app has Vue attributes but no content, cleaning up')
      );

      // Should successfully mount after cleanup
      expect(element.querySelector('.test-component')).toBeTruthy();
    });

    it('should skip mounting if no elements found', async () => {
      autoMountComponent(TestComponent, '#non-existent');
      await vi.runAllTimersAsync();

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should pass options to mountVueApp', async () => {
      const element = document.createElement('div');
      element.id = 'options-app';
      document.body.appendChild(element);

      autoMountComponent(TestComponent, '#options-app', {
        props: { message: 'Auto Mount Message' },
        useShadowRoot: true,
      });

      await vi.runAllTimersAsync();

      expect(element.shadowRoot).toBeTruthy();
      expect(element.shadowRoot?.textContent).toContain('Auto Mount Message');
    });
  });

  describe('i18n setup', () => {
    it('should setup i18n with default locale', () => {
      const element = document.createElement('div');
      element.id = 'i18n-app';
      document.body.appendChild(element);

      mountVueApp({
        component: TestComponent,
        selector: '#i18n-app',
      });

      expect(mockI18n.install).toHaveBeenCalled();
    });

    it('should parse window locale data', () => {
      const localeData = {
        fr_FR: { test: 'Message de test' },
      };
      (window as unknown as Record<string, unknown>).LOCALE_DATA = encodeURIComponent(JSON.stringify(localeData));

      const element = document.createElement('div');
      element.id = 'i18n-app';
      document.body.appendChild(element);

      mountVueApp({
        component: TestComponent,
        selector: '#i18n-app',
      });

      delete (window as unknown as Record<string, unknown>).LOCALE_DATA;
    });

    it('should handle locale data parsing errors', () => {
      (window as unknown as Record<string, unknown>).LOCALE_DATA = 'invalid json';

      const element = document.createElement('div');
      element.id = 'i18n-app';
      document.body.appendChild(element);

      mountVueApp({
        component: TestComponent,
        selector: '#i18n-app',
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[VueMountApp] error parsing messages',
        expect.any(Error)
      );

      delete (window as unknown as Record<string, unknown>).LOCALE_DATA;
    });
  });

  describe('error recovery', () => {
    it('should attempt recovery from nextSibling error', async () => {
      vi.useFakeTimers();

      const element = document.createElement('div');
      element.id = 'recovery-app';
      document.body.appendChild(element);

      // Create a mock Vue app that throws on first mount attempt
      let mountAttempt = 0;
      const mockApp = {
        use: vi.fn().mockReturnThis(),
        provide: vi.fn().mockReturnThis(),
        mount: vi.fn().mockImplementation(() => {
          mountAttempt++;
          if (mountAttempt === 1) {
            const error = new TypeError('Cannot read property nextSibling of null');
            throw error;
          }
          return mockApp;
        }),
        unmount: vi.fn(),
        version: '3.0.0',
        config: { globalProperties: {} },
      };

      // Mock createApp using module mock
      const vueModule = await import('vue');
      vi.spyOn(vueModule, 'createApp').mockReturnValue(mockApp as never);

      mountVueApp({
        component: TestComponent,
        selector: '#recovery-app',
        appId: 'recovery-app',
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[VueMountApp] Attempting recovery from nextSibling error for #recovery-app'
      );

      await vi.advanceTimersByTimeAsync(10);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[VueMountApp] Successfully recovered from nextSibling error for #recovery-app'
      );

      vi.useRealTimers();
    });

    it('should not attempt recovery with skipRecovery flag', async () => {
      const element = document.createElement('div');
      element.id = 'no-recovery-app';
      document.body.appendChild(element);

      const mockApp = {
        use: vi.fn().mockReturnThis(),
        provide: vi.fn().mockReturnThis(),
        mount: vi.fn().mockImplementation(() => {
          throw new TypeError('Cannot read property nextSibling of null');
        }),
        unmount: vi.fn(),
        version: '3.0.0',
        config: { globalProperties: {} },
      };

      const vueModule = await import('vue');
      vi.spyOn(vueModule, 'createApp').mockReturnValue(mockApp as never);

      expect(() => {
        mountVueApp({
          component: TestComponent,
          selector: '#no-recovery-app',
          skipRecovery: true,
        });
      }).toThrow('Cannot read property nextSibling of null');

      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Attempting recovery')
      );
    });
  });

  describe('global exposure', () => {
    it('should expose mountedApps globally', () => {
      expect(window.mountedApps).toBeDefined();
      expect(window.mountedApps).toBeInstanceOf(Map);
    });

    it('should expose globalPinia globally', () => {
      expect(window.globalPinia).toBeDefined();
      expect(window.globalPinia).toBe(mockGlobalPinia);
    });
  });
});
