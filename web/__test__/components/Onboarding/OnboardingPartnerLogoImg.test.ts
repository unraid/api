/**
 * OnboardingPartnerLogoImg Component Test Coverage
 */

import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import OnboardingPartnerLogoImg from '~/components/Onboarding/components/OnboardingPartnerLogoImg.vue';

const mockThemeStore = {
  theme: ref({ name: 'white' }),
};

vi.mock('~/store/theme', () => ({
  useThemeStore: () => mockThemeStore,
}));

describe('OnboardingPartnerLogoImg', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockThemeStore.theme.value = { name: 'white' };
  });

  const mountComponent = (props = {}) => {
    return mount(OnboardingPartnerLogoImg, {
      props,
    });
  };

  it('renders the image when a partner light logo exists', () => {
    const wrapper = mountComponent({
      partnerInfo: {
        branding: {
          partnerLogoLightUrl: 'https://example.com/logo-light.png',
          hasPartnerLogo: true,
        },
      },
    });
    const img = wrapper.find('img');

    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://example.com/logo-light.png');
    expect(img.classes()).toContain('w-72');
  });

  it('does not render when partnerLogoUrl is null', () => {
    const wrapper = mountComponent({
      partnerInfo: {
        branding: {
          partnerLogoLightUrl: null,
          partnerLogoDarkUrl: null,
          hasPartnerLogo: false,
        },
      },
    });
    const img = wrapper.find('img');

    expect(img.exists()).toBe(false);
  });

  it('uses dark logo when theme is dark', () => {
    mockThemeStore.theme.value = { name: 'gray' };
    const wrapper = mountComponent({
      partnerInfo: {
        branding: {
          partnerLogoLightUrl: 'https://example.com/logo-light.png',
          partnerLogoDarkUrl: 'https://example.com/logo-dark.png',
          hasPartnerLogo: true,
        },
      },
    });
    const img = wrapper.find('img');

    expect(img.attributes('src')).toBe('https://example.com/logo-dark.png');
  });

  it('uses light logo when theme is light', () => {
    mockThemeStore.theme.value = { name: 'azure' };
    const wrapper = mountComponent({
      partnerInfo: {
        branding: {
          partnerLogoLightUrl: 'https://example.com/logo-light.png',
          partnerLogoDarkUrl: 'https://example.com/logo-dark.png',
          hasPartnerLogo: true,
        },
      },
    });
    const img = wrapper.find('img');

    expect(img.attributes('src')).toBe('https://example.com/logo-light.png');
  });

  it('falls back to light logo when dark logo is missing', () => {
    mockThemeStore.theme.value = { name: 'black' };
    const wrapper = mountComponent({
      partnerInfo: {
        branding: {
          partnerLogoLightUrl: 'https://example.com/logo-light.png',
          hasPartnerLogo: true,
        },
      },
    });
    const img = wrapper.find('img');

    expect(img.attributes('src')).toBe('https://example.com/logo-light.png');
  });
});
