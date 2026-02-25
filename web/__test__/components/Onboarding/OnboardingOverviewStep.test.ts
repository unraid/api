import { mount } from '@vue/test-utils';

import limitlessImage from '@/assets/limitless_possibilities.jpg';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import OnboardingOverviewStep from '~/components/Onboarding/steps/OnboardingOverviewStep.vue';
import { createTestI18n } from '../../utils/i18n';

const {
  completeOnboardingMock,
  refetchOnboardingMock,
  partnerInfoRef,
  isFreshInstallRef,
  isUpgradeRef,
  isDowngradeRef,
  isIncompleteRef,
  themeRef,
} = vi.hoisted(() => ({
  completeOnboardingMock: vi.fn().mockResolvedValue({}),
  refetchOnboardingMock: vi.fn().mockResolvedValue({}),
  partnerInfoRef: {
    value: {
      partner: { name: '45Drives' },
      branding: {
        hasPartnerLogo: true,
        partnerLogoLightUrl: 'data:image/png;base64,AAA=',
        partnerLogoDarkUrl: 'data:image/png;base64,BBB=',
      },
    },
  },
  isFreshInstallRef: { value: false },
  isUpgradeRef: { value: false },
  isDowngradeRef: { value: false },
  isIncompleteRef: { value: true },
  themeRef: { value: { name: 'azure' } },
}));

vi.mock('pinia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pinia')>();
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => store,
  };
});

vi.mock('@vue/apollo-composable', async () => {
  const actual =
    await vi.importActual<typeof import('@vue/apollo-composable')>('@vue/apollo-composable');
  return {
    ...actual,
    useMutation: () => ({
      mutate: completeOnboardingMock,
    }),
  };
});

vi.mock('@unraid/ui', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    BrandButton: {
      props: ['text', 'disabled', 'loading', 'iconRight'],
      emits: ['click'],
      template:
        '<button data-testid="brand-button" :disabled="disabled" @click="$emit(\'click\')">{{ text }}</button>',
    },
  };
});

vi.mock('@/components/Onboarding/store/activationCodeData', () => ({
  useActivationCodeDataStore: () => ({
    partnerInfo: partnerInfoRef,
    isFreshInstall: isFreshInstallRef,
  }),
}));

vi.mock('@/components/Onboarding/store/upgradeOnboarding', () => ({
  useUpgradeOnboardingStore: () => ({
    isUpgrade: isUpgradeRef,
    isDowngrade: isDowngradeRef,
    isIncomplete: isIncompleteRef,
    refetchOnboarding: refetchOnboardingMock,
  }),
}));

vi.mock('@/store/theme', () => ({
  useThemeStore: () => ({
    theme: themeRef,
  }),
}));

vi.mock('@/components/Onboarding/store/onboardingStorageCleanup', () => ({
  cleanupOnboardingStorage: vi.fn(),
}));

describe('OnboardingOverviewStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    partnerInfoRef.value = {
      partner: { name: '45Drives' },
      branding: {
        hasPartnerLogo: true,
        partnerLogoLightUrl: 'data:image/png;base64,AAA=',
        partnerLogoDarkUrl: 'data:image/png;base64,BBB=',
      },
    };
    isFreshInstallRef.value = false;
    isUpgradeRef.value = false;
    isDowngradeRef.value = false;
    isIncompleteRef.value = true;
    themeRef.value = { name: 'azure' };
  });

  const mountComponent = () =>
    mount(OnboardingOverviewStep, {
      props: {
        onComplete: vi.fn(),
      },
      global: {
        plugins: [createTestI18n()],
      },
    });

  it('uses partner logo by default when partner branding is present', () => {
    const wrapper = mountComponent();
    const img = wrapper.find('img');

    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('data:image/png;base64,AAA=');
    expect(img.attributes('alt')).toBe('45Drives');
  });

  it('falls back to default overview image when partner logo fails to load', async () => {
    const wrapper = mountComponent();
    const img = wrapper.find('img');

    await img.trigger('error');

    const updatedImg = wrapper.find('img');
    expect(updatedImg.attributes('src')).toBe(limitlessImage);
    expect(updatedImg.attributes('alt')).toBe('Limitless Possibilities');
  });
});
