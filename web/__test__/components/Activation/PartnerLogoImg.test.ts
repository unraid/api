/**
 * Activation PartnerLogoImg Component Test Coverage
 */

import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import { describe, expect, it, vi } from 'vitest';

import PartnerLogoImg from '~/components/Activation/PartnerLogoImg.vue';
import { useActivationCodeStore } from '~/store/activationCode';
import { useThemeStore } from '~/store/theme';

vi.mock('~/store/activationCode', () => ({
  useActivationCodeStore: vi.fn(() => ({
    partnerLogo: ref('https://example.com/logo.png'),
  })),
}));

vi.mock('~/store/theme', () => ({
  useThemeStore: vi.fn(() => ({
    darkMode: ref(false),
  })),
}));

describe('Activation/PartnerLogoImg.vue', () => {
  it('renders the partner logo with proper source', () => {
    const wrapper = mount(PartnerLogoImg);

    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://example.com/logo.png');
  });

  it('does not add invert class in light mode', () => {
    const wrapper = mount(PartnerLogoImg);

    const img = wrapper.find('img');
    expect(img.classes()).toContain('w-72');
    expect(img.classes()).not.toContain('invert');
  });

  it('adds invert class in dark mode', async () => {
    vi.mocked(useThemeStore).mockReturnValue({
      darkMode: ref(true),
    } as unknown as ReturnType<typeof useThemeStore>);

    const wrapper = mount(PartnerLogoImg);

    const img = wrapper.find('img');
    expect(img.classes()).toContain('w-72');
    expect(img.classes()).toContain('invert');
  });

  it('does not render image when partner logo is not provided', () => {
    vi.mocked(useActivationCodeStore).mockReturnValue({
      partnerLogo: ref(''),
    } as unknown as ReturnType<typeof useActivationCodeStore>);

    const wrapper = mount(PartnerLogoImg);

    expect(wrapper.find('img').exists()).toBe(false);
  });
});
