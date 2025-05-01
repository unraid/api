/**
 * Activation PartnerLogo Component Test Coverage
 */

import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import { describe, expect, it, vi } from 'vitest';

import PartnerLogo from '~/components/Activation/PartnerLogo.vue';
import { useActivationCodeStore } from '~/store/activationCode';

vi.mock('~/components/Activation/PartnerLogoImg.vue', () => ({
  default: {
    name: 'ActivationPartnerLogoImg',
    template: '<div data-testid="partner-logo-img"></div>',
  },
}));

vi.mock('~/store/activationCode', () => ({
  useActivationCodeStore: vi.fn(() => ({
    partnerLogo: ref('https://example.com/logo.png'),
    partnerUrl: ref('https://example.com'),
  })),
}));

describe('Activation/PartnerLogo.vue', () => {
  it('renders nothing when partnerLogo is not provided', () => {
    vi.mocked(useActivationCodeStore).mockReturnValue({
      partnerLogo: ref(''),
      partnerUrl: ref('https://example.com'),
    } as unknown as ReturnType<typeof useActivationCodeStore>);

    const wrapper = mount(PartnerLogo);

    expect(wrapper.find('[data-testid="partner-logo-img"]').exists()).toBe(false);
  });

  it('renders logo with link when both partnerLogo and partnerUrl are provided', () => {
    vi.mocked(useActivationCodeStore).mockReturnValue({
      partnerLogo: ref('https://example.com/logo.png'),
      partnerUrl: ref('https://example.com'),
    } as unknown as ReturnType<typeof useActivationCodeStore>);

    const wrapper = mount(PartnerLogo);

    const link = wrapper.find('a');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('https://example.com');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener noreferrer');

    expect(link.find('[data-testid="partner-logo-img"]').exists()).toBe(true);
  });

  it('renders logo without link when partnerLogo is provided but partnerUrl is not', () => {
    vi.mocked(useActivationCodeStore).mockReturnValue({
      partnerLogo: ref('https://example.com/logo.png'),
      partnerUrl: ref(''),
    } as unknown as ReturnType<typeof useActivationCodeStore>);

    const wrapper = mount(PartnerLogo);

    expect(wrapper.find('a').exists()).toBe(false);

    expect(wrapper.find('[data-testid="partner-logo-img"]').exists()).toBe(true);
  });
});
