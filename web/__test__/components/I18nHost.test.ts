/**
 * I18nHost Component Test Coverage
 */

import { defineComponent, inject } from 'vue';
import { I18nInjectionKey } from 'vue-i18n';
import { mount } from '@vue/test-utils';

import _en_US from '~/locales/en_US.json';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { VueWrapper } from '@vue/test-utils';
import type { Composer, I18n } from 'vue-i18n';

import I18nHost from '~/components/I18nHost.ce.vue';

const en_US: Record<string, string> = _en_US;

vi.mock('~/helpers/i18n-utils', () => ({
  createHtmlEntityDecoder: vi.fn(() => (text: string) => text),
}));

const TestConsumerComponent = defineComponent({
  template: '<div>{{ i18n?.global.locale.value }}</div>',

  setup() {
    const i18n = inject(I18nInjectionKey);
    return { i18n };
  },
});

describe('I18nHost', () => {
  let wrapper: VueWrapper<unknown>;
  const originalWindowLocaleData = (window as unknown as { LOCALE_DATA?: string }).LOCALE_DATA;

  beforeEach(() => {
    delete (window as unknown as { LOCALE_DATA?: string }).LOCALE_DATA;
    vi.clearAllMocks();
  });

  afterEach(() => {
    wrapper?.unmount();

    if (originalWindowLocaleData !== undefined) {
      (window as unknown as { LOCALE_DATA?: string }).LOCALE_DATA = originalWindowLocaleData;
    } else {
      delete (window as unknown as { LOCALE_DATA?: string }).LOCALE_DATA;
    }
    vi.restoreAllMocks();
  });

  it('provides i18n instance with default locale when no window data exists', () => {
    wrapper = mount(I18nHost, {
      slots: {
        default: TestConsumerComponent,
      },
    });

    const consumerWrapper = wrapper.findComponent(TestConsumerComponent);
    const providedI18n = consumerWrapper.vm.i18n as I18n<{
      message: typeof en_US;
    }>;

    expect(providedI18n).toBeDefined();
    expect((providedI18n.global as Composer).locale.value).toBe('en_US');
    expect((providedI18n.global as Composer).fallbackLocale.value).toBe('en_US');

    const messages = (providedI18n.global as Composer).messages.value as {
      en_US?: Record<string, string>;
      ja?: Record<string, string>;
    };

    expect(messages.en_US?.['My Servers']).toBe(en_US['My Servers']);
  });

  it('parses and provides i18n instance with locale from window.LOCALE_DATA', () => {
    const mockJaMessages = { 'test-key': 'テストキー' };
    const localeData = { ja: mockJaMessages };
    (window as unknown as { LOCALE_DATA?: string }).LOCALE_DATA = encodeURIComponent(
      JSON.stringify(localeData)
    );

    wrapper = mount(I18nHost, {
      slots: {
        default: TestConsumerComponent,
      },
    });

    const consumerWrapper = wrapper.findComponent(TestConsumerComponent);
    const providedI18n = consumerWrapper.vm.i18n as I18n<{
      message: typeof en_US;
    }>;
    const messages = (providedI18n.global as Composer).messages.value as {
      en_US?: Record<string, string>;
      ja?: Record<string, string>;
    };

    expect(providedI18n).toBeDefined();
    expect((providedI18n.global as Composer).locale.value).toBe('ja');
    expect((providedI18n.global as Composer).fallbackLocale.value).toBe('en_US');
    expect(messages.ja?.['test-key']).toBe(mockJaMessages['test-key']);
    expect(messages.en_US?.['My Servers']).toBe(en_US['My Servers']);
  });

  it('handles invalid JSON in window.LOCALE_DATA gracefully', () => {
    (window as unknown as { LOCALE_DATA?: string }).LOCALE_DATA = 'invalid JSON string{%';
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    wrapper = mount(I18nHost, {
      slots: {
        default: TestConsumerComponent,
      },
    });

    const consumerWrapper = wrapper.findComponent(TestConsumerComponent);
    const providedI18n = consumerWrapper.vm.i18n as I18n<{
      message: typeof en_US;
    }>;
    const messages = (providedI18n.global as Composer).messages.value as {
      en_US?: Record<string, string>;
      ja?: Record<string, string>;
    };

    expect(providedI18n).toBeDefined();
    expect((providedI18n.global as Composer).locale.value).toBe('en_US');
    expect((providedI18n.global as Composer).fallbackLocale.value).toBe('en_US');
    expect(errorSpy).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalledWith('[I18nHost] error parsing messages', expect.any(Error));
    expect(messages.en_US?.['My Servers']).toBe(en_US['My Servers']);

    errorSpy.mockRestore();
  });
});
