/**
 * ActivationPartnerLogoImg Component Test Coverage
 */

import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import ActivationPartnerLogoImg from '~/components/Activation/ActivationPartnerLogoImg.vue';

const mockThemeStore = {
  darkMode: ref(false),
};

vi.mock('~/store/theme', () => ({
  useThemeStore: () => mockThemeStore,
}));

describe('ActivationPartnerLogoImg', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockThemeStore.darkMode.value = false;
  });

  const mountComponent = (props = {}) => {
    return mount(ActivationPartnerLogoImg, {
      props,
    });
  };

  it('renders the image when partnerLogoUrl exists', () => {
    const wrapper = mountComponent({
      partnerInfo: {
        partnerLogoUrl: 'https://example.com/logo.png',
        hasPartnerLogo: true,
      },
    });
    const img = wrapper.find('img');

    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://example.com/logo.png');
    expect(img.classes()).toContain('w-72');
  });

  it('does not render when partnerLogoUrl is null', () => {
    const wrapper = mountComponent({
      partnerInfo: {
        partnerLogoUrl: null,
        hasPartnerLogo: false,
      },
    });
    const img = wrapper.find('img');

    expect(img.exists()).toBe(false);
  });

  it('applies invert class when in dark mode and has partner logo', () => {
    mockThemeStore.darkMode.value = true;
    const wrapper = mountComponent({
      partnerInfo: {
        partnerLogoUrl: 'https://example.com/logo.png',
        hasPartnerLogo: true,
      },
    });
    const img = wrapper.find('img');

    expect(img.classes()).toContain('invert');
  });

  it('does not apply invert class when in dark mode but no partner logo', () => {
    mockThemeStore.darkMode.value = true;
    const wrapper = mountComponent({
      partnerInfo: {
        partnerLogoUrl: 'https://example.com/logo.png',
        hasPartnerLogo: false,
      },
    });
    const img = wrapper.find('img');

    expect(img.classes()).not.toContain('invert');
  });

  it('does not apply invert class when not in dark mode', () => {
    mockThemeStore.darkMode.value = false;
    const wrapper = mountComponent({
      partnerInfo: {
        partnerLogoUrl: 'https://example.com/logo.png',
        hasPartnerLogo: true,
      },
    });
    const img = wrapper.find('img');

    expect(img.classes()).not.toContain('invert');
  });
});
