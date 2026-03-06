import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import OnboardingPartnerLogo from '~/components/Onboarding/components/OnboardingPartnerLogo.vue';

describe('OnboardingPartnerLogo', () => {
  const mountComponent = (partnerInfo?: Record<string, unknown> | null) => {
    return mount(OnboardingPartnerLogo, {
      props: { partnerInfo },
      global: {
        stubs: {
          OnboardingPartnerLogoImg: {
            template: '<div data-testid="partner-logo-img"></div>',
          },
        },
      },
    });
  };

  it('renders a link with partner logo when partner url exists', () => {
    const wrapper = mountComponent({
      partner: {
        url: 'https://example.com',
      },
      branding: {
        hasPartnerLogo: true,
      },
    });

    const link = wrapper.find('a');

    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('https://example.com');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener noreferrer');
    expect(wrapper.find('[data-testid="partner-logo-img"]').exists()).toBe(true);
    expect(link.classes()).toContain('opacity-100');
    expect(link.classes()).toContain('hover:opacity-75');
    expect(link.classes()).toContain('focus:opacity-75');
  });

  it('does not render logo/link when partner url is missing', () => {
    const wrapper = mountComponent({
      partner: {
        url: null,
      },
    });

    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.find('[data-testid="partner-logo-img"]').exists()).toBe(false);
  });

  it('does not render when partner info is empty', () => {
    const wrapper = mountComponent(null);

    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.find('[data-testid="partner-logo-img"]').exists()).toBe(false);
  });
});
