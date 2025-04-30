/**
 * ThemeSwitcher Component Test Coverage
 */

import { ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';

import { createTestingPinia } from '@pinia/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Mock, MockInstance } from 'vitest';

const mockFormUrlPostRes = vi.fn();
const mockFormUrlPost = vi.fn(() => ({ res: mockFormUrlPostRes }));
const mockFormUrl = vi.fn(() => ({ post: mockFormUrlPost }));

vi.doMock('~/composables/services/webgui', () => ({
  WebguiUpdate: {
    formUrl: mockFormUrl,
  },
}));

const mockServerStore = {
  csrf: ref('mock-csrf-token-123'),
};
vi.mock('~/store/server', () => ({
  useServerStore: () => mockServerStore,
}));

vi.stubGlobal('sessionStorage', {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});
vi.stubGlobal('localStorage', {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});

const mockLocation = {
  reload: vi.fn(),
};

vi.stubGlobal('location', mockLocation);

describe('ThemeSwitcher.ce.vue', () => {
  let consoleDebugSpy: MockInstance;
  let consoleLogSpy: MockInstance;
  let consoleErrorSpy: MockInstance;
  let ThemeSwitcher: unknown;

  beforeEach(async () => {
    ThemeSwitcher = (await import('~/components/ThemeSwitcher.ce.vue')).default;

    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();

    (sessionStorage.getItem as Mock).mockReturnValue(null);
    (localStorage.getItem as Mock).mockReturnValue(null);

    mockFormUrl.mockClear();
    mockFormUrlPost.mockClear();
    mockFormUrlPostRes.mockClear();

    mockLocation.reload.mockClear();

    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not render if enableThemeSwitcher is not set in storage', () => {
    const wrapper = mount(ThemeSwitcher, {
      props: { current: 'azure' },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
    });

    expect(wrapper.find('select').exists()).toBe(false);
  });

  it('renders if enableThemeSwitcher is set in sessionStorage', () => {
    (sessionStorage.getItem as Mock).mockImplementation((key: string) =>
      key === 'enableThemeSwitcher' ? 'true' : null
    );
    const wrapper = mount(ThemeSwitcher, {
      props: { current: 'azure' },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
    });

    expect(wrapper.find('select').exists()).toBe(true);
  });

  it('renders if enableThemeSwitcher is set in localStorage', () => {
    (localStorage.getItem as Mock).mockImplementation((key: string) =>
      key === 'enableThemeSwitcher' ? 'true' : null
    );

    const wrapper = mount(ThemeSwitcher, {
      props: { current: 'azure' },
      global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
    });

    expect(wrapper.find('select').exists()).toBe(true);
  });

  describe('when rendered', () => {
    beforeEach(() => {
      // Ensure component renders for subsequent tests
      (sessionStorage.getItem as Mock).mockImplementation((key: string) =>
        key === 'enableThemeSwitcher' ? 'true' : null
      );
      // No need to re-import ThemeSwitcher here, already done in outer beforeEach
    });

    it('renders default theme options when themes prop is not provided', () => {
      const wrapper = mount(ThemeSwitcher, {
        props: { current: 'azure' },
        global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
      });
      const options = wrapper.findAll('option');

      expect(options).toHaveLength(4);
      expect(options.map((o) => o.attributes('value'))).toEqual(['azure', 'black', 'gray', 'white']);
    });

    it('renders theme options from themes prop (array)', () => {
      const customThemes = ['red', 'blue'];
      const wrapper = mount(ThemeSwitcher, {
        props: { current: 'red', themes: customThemes },
        global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
      });
      const options = wrapper.findAll('option');

      expect(options).toHaveLength(2);
      expect(options.map((o) => o.attributes('value'))).toEqual(customThemes);
    });

    it('renders theme options from themes prop (JSON string)', () => {
      const customThemes = ['green', 'yellow'];
      const jsonThemes = JSON.stringify(customThemes);
      const wrapper = mount(ThemeSwitcher, {
        props: { current: 'green', themes: jsonThemes },
        global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
      });
      const options = wrapper.findAll('option');

      expect(options).toHaveLength(2);
      expect(options.map((o) => o.attributes('value'))).toEqual(customThemes);
    });

    it('sets the initial value based on the current prop', () => {
      const currentTheme = 'black';
      const wrapper = mount(ThemeSwitcher, {
        props: { current: currentTheme },
        global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
      });
      const select = wrapper.find('select');

      expect((select.element as HTMLSelectElement).value).toBe(currentTheme);
    });

    describe('handleThemeChange', () => {
      it('does nothing if the selected theme is the current theme', async () => {
        const currentTheme = 'azure';
        const wrapper = mount(ThemeSwitcher, {
          props: { current: currentTheme },
          global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
        });
        const select = wrapper.find('select');

        await select.setValue(currentTheme);

        expect(mockFormUrl).not.toHaveBeenCalled();
        expect(consoleDebugSpy).toHaveBeenCalledWith('[ThemeSwitcher.setTheme] Theme is already set');
        expect(select.attributes('disabled')).toBeUndefined();
      });

      it('calls WebguiUpdate and reloads on selecting a new theme', async () => {
        const currentTheme = 'azure';
        const newTheme = 'black';
        const wrapper = mount(ThemeSwitcher, {
          props: { current: currentTheme },
          global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
        });
        const select = wrapper.find('select');

        // Mock the successful response callback chain
        const mockResCallback = vi.fn();

        mockFormUrlPostRes.mockImplementation((cb: Function) => {
          cb();
          mockResCallback();
        });

        await select.setValue(newTheme);

        // Assertions before timeout
        expect(consoleDebugSpy).toHaveBeenCalledWith('[ThemeSwitcher.setTheme] Submitting form');
        expect(mockFormUrl).toHaveBeenCalledTimes(1);
        expect(mockFormUrl).toHaveBeenCalledWith({
          csrf_token: 'mock-csrf-token-123',
          '#file': 'dynamix/dynamix.cfg',
          '#section': 'display',
          theme: newTheme,
        });
        expect(mockFormUrlPost).toHaveBeenCalledTimes(1);
        expect(mockFormUrlPostRes).toHaveBeenCalledTimes(1);
        expect(select.attributes('disabled')).toBeDefined();
        expect(mockLocation.reload).not.toHaveBeenCalled();

        expect(mockResCallback).toHaveBeenCalledTimes(1);
        expect(consoleLogSpy).toHaveBeenCalledWith('[ThemeSwitcher.setTheme] Theme updated, reloading…');

        await vi.advanceTimersByTimeAsync(1000);

        expect(mockLocation.reload).toHaveBeenCalledTimes(1);
      });

      it('handles error during WebguiUpdate call', async () => {
        const currentTheme = 'azure';
        const newTheme = 'black';
        const updateError = new Error('Network Error');
        const componentThrownErrorMsg = '[ThemeSwitcher.setTheme] Failed to update theme';
        const mockResWithError = vi.fn(() => {
          throw updateError;
        });
        const mockPostWithError = vi.fn(() => ({ res: mockResWithError }));

        mockFormUrl.mockImplementationOnce(() => ({ post: mockPostWithError }));

        // Mock Vue's global error handler for this specific mount
        const mockErrorHandler = vi.fn();

        const wrapper = mount(ThemeSwitcher, {
          props: { current: currentTheme },
          global: {
            plugins: [createTestingPinia({ createSpy: vi.fn })],
            config: {
              errorHandler: mockErrorHandler,
            },
          },
        });
        const select = wrapper.find('select');

        // Trigger the change that will cause an error
        await select.setValue(newTheme);
        await flushPromises();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[ThemeSwitcher.setTheme] Failed to update theme',
          updateError
        );
        expect(mockErrorHandler).toHaveBeenCalledTimes(1);

        const caughtError = mockErrorHandler.mock.calls[0][0] as Error;

        expect(caughtError).toBeInstanceOf(Error);
        expect(caughtError.message).toBe(componentThrownErrorMsg);
        expect(select.attributes('disabled')).toBeDefined();
        expect(mockLocation.reload).not.toHaveBeenCalled();
      });
    });
  });
});
