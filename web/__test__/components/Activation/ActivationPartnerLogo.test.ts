/**
 * ActivationPartnerLogo Component Test Coverage
 */

import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import ActivationPartnerLogo from '~/components/Activation/ActivationPartnerLogo.vue';

const mockActivationPartnerLogoImg = {
  template: '<div data-testid="partner-logo-img"></div>',
};

const mockActivationCodeDataStore = {
  partnerInfo: ref({
    partnerUrl: null as string | null,
  }),
};

vi.mock('~/components/Activation/store/activationCodeData', () => ({
  useActivationCodeDataStore: () => mockActivationCodeDataStore,
}));

describe('ActivationPartnerLogo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActivationCodeDataStore.partnerInfo.value = {
      partnerUrl: null,
    };
  });

  const mountComponent = () => {
    return mount(ActivationPartnerLogo, {
      global: {
        stubs: {
          ActivationPartnerLogoImg: mockActivationPartnerLogoImg,
        },
      },
    });
  };

  it('renders a link with partner logo when partnerUrl exists', () => {
    mockActivationCodeDataStore.partnerInfo.value = {
      partnerUrl: 'https://example.com',
    };

    const wrapper = mountComponent();
    const link = wrapper.find('a');
    const logoImg = wrapper.find('[data-testid="partner-logo-img"]');

    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('https://example.com');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener noreferrer');
    expect(logoImg.exists()).toBe(true);
  });

  it('does not render anything when no partnerUrl exists', () => {
    const wrapper = mountComponent();
    const link = wrapper.find('a');
    const logoImg = wrapper.find('[data-testid="partner-logo-img"]');

    expect(link.exists()).toBe(false);
    expect(logoImg.exists()).toBe(false);
  });

  it('applies correct opacity classes for hover and focus states', () => {
    mockActivationCodeDataStore.partnerInfo.value = {
      partnerUrl: 'https://example.com',
    };

    const wrapper = mountComponent();
    const link = wrapper.find('a');

    expect(link.classes()).toContain('opacity-100');
    expect(link.classes()).toContain('hover:opacity-75');
    expect(link.classes()).toContain('focus:opacity-75');
  });
});
