/**
 * ActivationPartnerLogo Component Test Coverage
 */

import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import ActivationPartnerLogo from '~/components/Activation/ActivationPartnerLogo.vue';

const mockActivationPartnerLogoImg = {
  template: '<div data-testid="partner-logo-img"></div>',
  props: ['partnerInfo'],
};

describe('ActivationPartnerLogo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mountComponent = (props = {}) => {
    return mount(ActivationPartnerLogo, {
      props,
      global: {
        stubs: {
          ActivationPartnerLogoImg: mockActivationPartnerLogoImg,
        },
      },
    });
  };

  it('renders a link with partner logo when partnerUrl exists', () => {
    const wrapper = mountComponent({
      partnerInfo: {
        partnerUrl: 'https://example.com',
      },
    });
    const link = wrapper.find('a');
    const logoImg = wrapper.find('[data-testid="partner-logo-img"]');

    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('https://example.com');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener noreferrer');
    expect(logoImg.exists()).toBe(true);
  });

  it('does not render anything when no partnerUrl exists', () => {
    const wrapper = mountComponent({
      partnerInfo: {
        partnerUrl: null,
      },
    });
    const link = wrapper.find('a');
    const logoImg = wrapper.find('[data-testid="partner-logo-img"]');

    expect(link.exists()).toBe(false);
    expect(logoImg.exists()).toBe(false);
  });

  it('applies correct opacity classes for hover and focus states', () => {
    const wrapper = mountComponent({
      partnerInfo: {
        partnerUrl: 'https://example.com',
      },
    });
    const link = wrapper.find('a');

    expect(link.classes()).toContain('opacity-100');
    expect(link.classes()).toContain('hover:opacity-75');
    expect(link.classes()).toContain('focus:opacity-75');
  });
});
