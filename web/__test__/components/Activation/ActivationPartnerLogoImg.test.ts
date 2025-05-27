/**
 * ActivationPartnerLogoImg Component Test Coverage
 */

import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import ActivationPartnerLogoImg from '~/components/Activation/ActivationPartnerLogoImg.vue';

const mockActivationCodeDataStore = {
  partnerInfo: ref({
    partnerLogoUrl: null as string | null,
    hasPartnerLogo: false,
  }),
};

const mockThemeStore = {
  darkMode: ref(false),
};

vi.mock('~/components/Activation/store/activationCodeData', () => ({
  useActivationCodeDataStore: () => mockActivationCodeDataStore,
}));

vi.mock('~/store/theme', () => ({
  useThemeStore: () => mockThemeStore,
}));

describe('ActivationPartnerLogoImg', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActivationCodeDataStore.partnerInfo.value = {
      partnerLogoUrl: null,
      hasPartnerLogo: false,
    };
    mockThemeStore.darkMode.value = false;
  });

  const mountComponent = () => {
    return mount(ActivationPartnerLogoImg);
  };

  it('renders the image when partnerLogoUrl exists', () => {
    mockActivationCodeDataStore.partnerInfo.value = {
      partnerLogoUrl: 'https://example.com/logo.png',
      hasPartnerLogo: true,
    };

    const wrapper = mountComponent();
    const img = wrapper.find('img');

    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://example.com/logo.png');
    expect(img.classes()).toContain('w-72');
  });

  it('does not render when partnerLogoUrl is null', () => {
    const wrapper = mountComponent();
    const img = wrapper.find('img');

    expect(img.exists()).toBe(false);
  });

  it('applies invert class when in dark mode and has partner logo', () => {
    mockActivationCodeDataStore.partnerInfo.value = {
      partnerLogoUrl: 'https://example.com/logo.png',
      hasPartnerLogo: true,
    };
    mockThemeStore.darkMode.value = true;

    const wrapper = mountComponent();
    const img = wrapper.find('img');

    expect(img.classes()).toContain('invert');
  });

  it('does not apply invert class when in dark mode but no partner logo', () => {
    mockActivationCodeDataStore.partnerInfo.value = {
      partnerLogoUrl: 'https://example.com/logo.png',
      hasPartnerLogo: false,
    };
    mockThemeStore.darkMode.value = true;

    const wrapper = mountComponent();
    const img = wrapper.find('img');

    expect(img.classes()).not.toContain('invert');
  });

  it('does not apply invert class when not in dark mode', () => {
    mockActivationCodeDataStore.partnerInfo.value = {
      partnerLogoUrl: 'https://example.com/logo.png',
      hasPartnerLogo: true,
    };
    mockThemeStore.darkMode.value = false;

    const wrapper = mountComponent();
    const img = wrapper.find('img');

    expect(img.classes()).not.toContain('invert');
  });
});
