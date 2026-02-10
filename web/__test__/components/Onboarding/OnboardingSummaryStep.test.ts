import { flushPromises, mount } from '@vue/test-utils';

import { GET_AVAILABLE_LANGUAGES_QUERY } from '@/components/Onboarding/graphql/availableLanguages.query';
import { COMPLETE_ONBOARDING_MUTATION } from '@/components/Onboarding/graphql/completeUpgradeStep.mutation';
import {
  SET_LOCALE_MUTATION,
  SET_THEME_MUTATION,
  UPDATE_SERVER_IDENTITY_MUTATION,
  UPDATE_SSH_SETTINGS_MUTATION,
} from '@/components/Onboarding/graphql/coreSettings.mutations';
import { GET_CORE_SETTINGS_QUERY } from '@/components/Onboarding/graphql/getCoreSettings.query';
import { INSTALLED_UNRAID_PLUGINS_QUERY } from '@/components/Onboarding/graphql/installedPlugins.query';
import { UPDATE_SYSTEM_TIME_MUTATION } from '@/components/Onboarding/graphql/updateSystemTime.mutation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import OnboardingSummaryStep from '~/components/Onboarding/steps/OnboardingSummaryStep.vue';
import { PluginInstallStatus } from '~/composables/gql/graphql';
import { createTestI18n } from '../../utils/i18n';

const {
  draftStore,
  registrationStateRef,
  coreSettingsResult,
  coreSettingsError,
  installedPluginsResult,
  availableLanguagesResult,
  refetchInstalledPluginsMock,
  refetchOnboardingMock,
  setModalHiddenMock,
  updateSystemTimeMock,
  updateServerIdentityMock,
  setThemeMock,
  setLocaleMock,
  updateSshSettingsMock,
  completeOnboardingMock,
  installLanguageMock,
  installPluginMock,
  useMutationMock,
  useQueryMock,
} = vi.hoisted(() => ({
  draftStore: {
    serverName: 'Tower',
    serverDescription: '',
    selectedTimeZone: 'UTC',
    selectedTheme: 'white',
    selectedLanguage: 'en_US',
    useSsh: false,
    selectedPlugins: new Set<string>(),
  },
  registrationStateRef: { value: 'ENOKEYFILE' },
  coreSettingsResult: {
    value: {
      vars: { name: 'Tower', useSsh: false, localTld: 'local' },
      server: { name: 'Tower', comment: '' },
      display: { theme: 'white', locale: 'en_US' },
      systemTime: { timeZone: 'UTC' },
      info: { primaryNetwork: { ipAddress: '192.168.1.2' } },
    },
  },
  coreSettingsError: { value: null as unknown },
  installedPluginsResult: { value: { installedUnraidPlugins: [] as string[] } },
  availableLanguagesResult: {
    value: {
      availableLanguages: [
        { code: 'en_US', name: 'English', url: 'https://example.com/en_US.txz' },
        { code: 'fr_FR', name: 'French', url: 'https://example.com/fr_FR.txz' },
      ],
    },
  },
  refetchInstalledPluginsMock: vi.fn().mockResolvedValue(undefined),
  refetchOnboardingMock: vi.fn().mockResolvedValue(undefined),
  setModalHiddenMock: vi.fn(),
  updateSystemTimeMock: vi.fn().mockResolvedValue({}),
  updateServerIdentityMock: vi.fn().mockResolvedValue({}),
  setThemeMock: vi.fn().mockResolvedValue({}),
  setLocaleMock: vi.fn().mockResolvedValue({}),
  updateSshSettingsMock: vi.fn().mockResolvedValue({}),
  completeOnboardingMock: vi.fn().mockResolvedValue({}),
  installLanguageMock: vi.fn(),
  installPluginMock: vi.fn(),
  useMutationMock: vi.fn(),
  useQueryMock: vi.fn(),
}));

vi.mock('pinia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pinia')>();
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => store,
  };
});

vi.mock('@unraid/ui', () => ({
  BrandButton: {
    props: ['text', 'disabled'],
    emits: ['click'],
    template:
      '<button data-testid="brand-button" :disabled="disabled" @click="$emit(\'click\')"><slot />{{ text }}</button>',
  },
  Dialog: {
    props: ['modelValue'],
    template: '<div v-if="modelValue" data-testid="dialog"><slot /></div>',
  },
}));

vi.mock('@headlessui/vue', () => ({
  Disclosure: {
    template: '<div><slot :open="false" /></div>',
  },
  DisclosureButton: {
    props: ['disabled'],
    template: '<button :disabled="disabled"><slot /></button>',
  },
  DisclosurePanel: {
    template: '<div><slot /></div>',
  },
}));

vi.mock('@/components/Onboarding/components/OnboardingConsole.vue', () => ({
  default: {
    props: ['logs'],
    template: '<div data-testid="onboarding-console">{{ JSON.stringify(logs) }}</div>',
  },
}));

vi.mock('~/components/Onboarding/store/onboardingDraft', () => ({
  useOnboardingDraftStore: () => draftStore,
}));

vi.mock('~/components/Onboarding/store/activationCodeData', () => ({
  useActivationCodeDataStore: () => ({
    registrationState: registrationStateRef,
  }),
}));

vi.mock('@/components/Onboarding/store/activationCodeModal', () => ({
  useActivationCodeModalStore: () => ({
    setIsHidden: setModalHiddenMock,
  }),
}));

vi.mock('@/components/Onboarding/store/upgradeOnboarding', () => ({
  useUpgradeOnboardingStore: () => ({
    refetchOnboarding: refetchOnboardingMock,
  }),
}));

vi.mock('@/components/Onboarding/composables/usePluginInstaller', () => ({
  default: () => ({
    installLanguage: installLanguageMock,
    installPlugin: installPluginMock,
  }),
}));

vi.mock('@vue/apollo-composable', async () => {
  const actual =
    await vi.importActual<typeof import('@vue/apollo-composable')>('@vue/apollo-composable');
  return {
    ...actual,
    useMutation: useMutationMock,
    useQuery: useQueryMock,
  };
});

const setupApolloMocks = () => {
  useMutationMock.mockImplementation((doc: unknown) => {
    if (doc === UPDATE_SYSTEM_TIME_MUTATION) {
      return { mutate: updateSystemTimeMock };
    }
    if (doc === UPDATE_SERVER_IDENTITY_MUTATION) {
      return { mutate: updateServerIdentityMock };
    }
    if (doc === SET_THEME_MUTATION) {
      return { mutate: setThemeMock };
    }
    if (doc === SET_LOCALE_MUTATION) {
      return { mutate: setLocaleMock };
    }
    if (doc === UPDATE_SSH_SETTINGS_MUTATION) {
      return { mutate: updateSshSettingsMock };
    }
    if (doc === COMPLETE_ONBOARDING_MUTATION) {
      return { mutate: completeOnboardingMock };
    }
    return { mutate: vi.fn() };
  });

  useQueryMock.mockImplementation((doc: unknown) => {
    if (doc === GET_CORE_SETTINGS_QUERY) {
      return { result: coreSettingsResult, error: coreSettingsError };
    }
    if (doc === INSTALLED_UNRAID_PLUGINS_QUERY) {
      return {
        result: installedPluginsResult,
        refetch: refetchInstalledPluginsMock,
      };
    }
    if (doc === GET_AVAILABLE_LANGUAGES_QUERY) {
      return { result: availableLanguagesResult };
    }
    return { result: { value: null } };
  });
};

const mountComponent = (props: Record<string, unknown> = {}) => {
  const onComplete = vi.fn();
  const wrapper = mount(OnboardingSummaryStep, {
    props: {
      onComplete,
      showBack: true,
      ...props,
    },
    global: {
      plugins: [createTestI18n()],
    },
  });

  return { wrapper, onComplete };
};

const clickApply = async (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
  const buttons = wrapper.findAll('[data-testid="brand-button"]');
  const applyButton = buttons[buttons.length - 1];
  await applyButton.trigger('click');
  await flushPromises();
  await vi.runAllTimersAsync();
  await flushPromises();
};

describe('OnboardingSummaryStep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    setupApolloMocks();

    draftStore.serverName = 'Tower';
    draftStore.serverDescription = '';
    draftStore.selectedTimeZone = 'UTC';
    draftStore.selectedTheme = 'white';
    draftStore.selectedLanguage = 'en_US';
    draftStore.useSsh = false;
    draftStore.selectedPlugins = new Set();

    registrationStateRef.value = 'ENOKEYFILE';
    coreSettingsError.value = null;
    coreSettingsResult.value = {
      vars: { name: 'Tower', useSsh: false, localTld: 'local' },
      server: { name: 'Tower', comment: '' },
      display: { theme: 'white', locale: 'en_US' },
      systemTime: { timeZone: 'UTC' },
      info: { primaryNetwork: { ipAddress: '192.168.1.2' } },
    };
    installedPluginsResult.value = { installedUnraidPlugins: [] };
    availableLanguagesResult.value = {
      availableLanguages: [
        { code: 'en_US', name: 'English', url: 'https://example.com/en_US.txz' },
        { code: 'fr_FR', name: 'French', url: 'https://example.com/fr_FR.txz' },
      ],
    };

    updateSystemTimeMock.mockResolvedValue({});
    updateServerIdentityMock.mockResolvedValue({});
    setThemeMock.mockResolvedValue({});
    setLocaleMock.mockResolvedValue({});
    updateSshSettingsMock.mockResolvedValue({});
    completeOnboardingMock.mockResolvedValue({});
    installLanguageMock.mockResolvedValue({
      operationId: 'lang-op',
      status: PluginInstallStatus.SUCCEEDED,
      output: [],
    });
    installPluginMock.mockResolvedValue({
      operationId: 'plugin-op',
      status: PluginInstallStatus.SUCCEEDED,
      output: [],
    });
    refetchInstalledPluginsMock.mockResolvedValue(undefined);
    refetchOnboardingMock.mockResolvedValue(undefined);
  });

  it('logs plugin failure when installer returns FAILED', async () => {
    draftStore.selectedPlugins = new Set(['community-apps']);
    installPluginMock.mockResolvedValue({
      operationId: 'plugin-op',
      status: PluginInstallStatus.FAILED,
      output: ['failure'],
    });

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    const text = wrapper.text();
    expect(text).toContain('Community Apps installation failed. Continuing.');
    expect(text).not.toContain('Community Apps installed.');
  });

  it('does not call setLocale when language install fails', async () => {
    draftStore.selectedLanguage = 'fr_FR';
    installLanguageMock.mockResolvedValue({
      operationId: 'lang-op',
      status: PluginInstallStatus.FAILED,
      output: ['failed'],
    });

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(installLanguageMock).toHaveBeenCalled();
    expect(setLocaleMock).not.toHaveBeenCalledWith({ locale: 'fr_FR' });
  });

  it('skips core setting mutations when baseline is loaded and nothing changed', async () => {
    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(updateSystemTimeMock).not.toHaveBeenCalled();
    expect(updateServerIdentityMock).not.toHaveBeenCalled();
    expect(setThemeMock).not.toHaveBeenCalled();
    expect(setLocaleMock).not.toHaveBeenCalled();
    expect(updateSshSettingsMock).not.toHaveBeenCalled();
    expect(completeOnboardingMock).toHaveBeenCalledTimes(1);
  });

  it('applies trusted defaults + draft values when baseline query is down', async () => {
    coreSettingsResult.value = null;
    coreSettingsError.value = new Error('Graphql is offline.');
    draftStore.serverName = 'MyTower';
    draftStore.serverDescription = 'Edge host';
    draftStore.selectedTimeZone = 'America/New_York';
    draftStore.selectedTheme = 'black';
    draftStore.selectedLanguage = 'en_US';
    draftStore.useSsh = true;

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(updateSystemTimeMock).toHaveBeenCalledWith({ input: { timeZone: 'America/New_York' } });
    expect(updateServerIdentityMock).toHaveBeenCalledWith({
      name: 'MyTower',
      comment: 'Edge host',
    });
    expect(setThemeMock).toHaveBeenCalledWith({ theme: 'black' });
    expect(setLocaleMock).toHaveBeenCalledWith({ locale: 'en_US' });
    expect(updateSshSettingsMock).toHaveBeenCalledWith({ enabled: true, port: 22 });
  });

  it('shows completion dialog in offline mode and advances only after OK', async () => {
    coreSettingsResult.value = null;
    coreSettingsError.value = new Error('Graphql is offline.');
    completeOnboardingMock.mockRejectedValue(new Error('offline'));

    const { wrapper, onComplete } = mountComponent();
    await clickApply(wrapper);

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Setup Saved in Best-Effort Mode');
    expect(onComplete).not.toHaveBeenCalled();

    const okButton = wrapper
      .findAll('button')
      .find((button) => button.text().trim().toUpperCase() === 'OK');
    expect(okButton).toBeTruthy();
    await okButton!.trigger('click');

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('continues and classifies warnings when server identity mutation rejects invalid input', async () => {
    draftStore.serverName = 'bad name!';
    updateServerIdentityMock.mockRejectedValue(new Error('Server name contains invalid characters'));

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(wrapper.text()).toContain('Server identity request returned an error, continuing');
    expect(wrapper.text()).toContain('Setup Applied with Warnings');
  });
});
