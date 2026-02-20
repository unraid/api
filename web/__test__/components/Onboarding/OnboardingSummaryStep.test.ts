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
  isFreshInstallRef,
  activationCodeRef,
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
  isFreshInstallRef: { value: true },
  activationCodeRef: { value: null as unknown },
  coreSettingsResult: {
    value: null as unknown,
  },
  coreSettingsError: { value: null as unknown },
  installedPluginsResult: { value: { installedUnraidPlugins: [] as string[] } },
  availableLanguagesResult: {
    value: {
      customization: {
        availableLanguages: [
          { code: 'en_US', name: 'English', url: 'https://example.com/en_US.txz' },
          { code: 'fr_FR', name: 'French', url: 'https://example.com/fr_FR.txz' },
        ],
      },
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
    isFreshInstall: isFreshInstallRef,
    activationCode: activationCodeRef,
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
  INSTALL_OPERATION_TIMEOUT_CODE: 'INSTALL_OPERATION_TIMEOUT',
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
    isFreshInstallRef.value = true;
    activationCodeRef.value = null;
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
      customization: {
        availableLanguages: [
          { code: 'en_US', name: 'English', url: 'https://example.com/en_US.txz' },
          { code: 'fr_FR', name: 'French', url: 'https://example.com/fr_FR.txz' },
        ],
      },
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

  it.each([
    {
      caseName: 'skips install when plugin is already present',
      apply: () => {
        draftStore.selectedPlugins = new Set(['community-apps']);
        installedPluginsResult.value = { installedUnraidPlugins: ['community.applications.plg'] };
      },
      assertExpected: (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
        expect(installPluginMock).not.toHaveBeenCalled();
        expect(wrapper.text()).toContain('Already installed');
        expect(wrapper.text()).toContain('Setup Applied');
      },
    },
    {
      caseName: 'skips install when installed plugin matches after trim/lowercase normalization',
      apply: () => {
        draftStore.selectedPlugins = new Set(['community-apps']);
        installedPluginsResult.value = { installedUnraidPlugins: ['  COMMUNITY.APPLICATIONS.PLG  '] };
      },
      assertExpected: (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
        expect(installPluginMock).not.toHaveBeenCalled();
        expect(wrapper.text()).toContain('Already installed');
        expect(wrapper.text()).toContain('Setup Applied');
      },
    },
    {
      caseName: 'skips unknown plugin ids',
      apply: () => {
        draftStore.selectedPlugins = new Set(['unknown-plugin-id']);
      },
      assertExpected: (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
        expect(installPluginMock).not.toHaveBeenCalled();
        expect(wrapper.text()).toContain('Setup Applied');
      },
    },
    {
      caseName: 'installs missing plugin successfully',
      apply: () => {
        draftStore.selectedPlugins = new Set(['community-apps']);
      },
      assertExpected: (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
        expect(installPluginMock).toHaveBeenCalledWith({
          url: 'https://raw.githubusercontent.com/unraid/community.applications/master/plugins/community.applications.plg',
          name: 'Community Apps',
          forced: false,
          onEvent: expect.any(Function),
        });
        expect(wrapper.text()).toContain('Community Apps installed.');
      },
    },
    {
      caseName: 'marks warning when plugin install returns FAILED',
      apply: () => {
        draftStore.selectedPlugins = new Set(['community-apps']);
        installPluginMock.mockResolvedValue({
          operationId: 'plugin-op',
          status: PluginInstallStatus.FAILED,
          output: ['failure'],
        });
      },
      assertExpected: (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
        expect(wrapper.text()).toContain('Community Apps installation failed. Continuing.');
        expect(wrapper.text()).toContain('Setup Applied with Warnings');
      },
    },
    {
      caseName: 'marks timeout result when plugin tracking times out',
      apply: () => {
        draftStore.selectedPlugins = new Set(['community-apps']);
        const timeoutError = new Error(
          'Timed out waiting for install operation plugin-op to finish'
        ) as Error & {
          code?: string;
        };
        timeoutError.code = 'INSTALL_OPERATION_TIMEOUT';
        installPluginMock.mockRejectedValue(timeoutError);
      },
      assertExpected: (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
        expect(wrapper.text()).toContain('Setup Continued After Timeout');
        expect(wrapper.text()).toContain(
          'One or more install operations timed out. Some settings may have been applied.'
        );
      },
    },
  ])('follows plugin install decision matrix ($caseName)', async (scenario) => {
    scenario.apply();

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    scenario.assertExpected(wrapper);
  });

  it.each([
    {
      caseName: 'switches to en_US directly without language pack install',
      apply: () => {
        coreSettingsResult.value = {
          vars: { name: 'Tower', useSsh: false, localTld: 'local' },
          server: { name: 'Tower', comment: '' },
          display: { theme: 'white', locale: 'fr_FR' },
          systemTime: { timeZone: 'UTC' },
          info: { primaryNetwork: { ipAddress: '192.168.1.2' } },
        };
        draftStore.selectedLanguage = 'en_US';
      },
      assertExpected: () => {
        expect(installLanguageMock).not.toHaveBeenCalled();
        expect(setLocaleMock).toHaveBeenCalledWith({ locale: 'en_US' });
      },
    },
    {
      caseName: 'installs language pack then sets locale',
      apply: () => {
        draftStore.selectedLanguage = 'fr_FR';
      },
      assertExpected: () => {
        expect(installLanguageMock).toHaveBeenCalledWith({
          forced: false,
          name: 'French',
          url: 'https://example.com/fr_FR.txz',
        });
        expect(setLocaleMock).toHaveBeenCalledWith({ locale: 'fr_FR' });
      },
    },
    {
      caseName: 'skips locale change when language metadata is missing',
      apply: () => {
        draftStore.selectedLanguage = 'fr_FR';
        availableLanguagesResult.value = {
          customization: {
            availableLanguages: [
              { code: 'en_US', name: 'English', url: 'https://example.com/en_US.txz' },
            ],
          },
        };
      },
      assertExpected: (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
        expect(installLanguageMock).not.toHaveBeenCalled();
        expect(setLocaleMock).not.toHaveBeenCalledWith({ locale: 'fr_FR' });
        expect(wrapper.text()).toContain(
          'Language pack metadata for fr_FR is unavailable. Skipping locale change.'
        );
        expect(wrapper.text()).toContain('Setup Applied with Warnings');
      },
    },
    {
      caseName: 'keeps locale when language install returns FAILED',
      apply: () => {
        draftStore.selectedLanguage = 'fr_FR';
        installLanguageMock.mockResolvedValue({
          operationId: 'lang-op',
          status: PluginInstallStatus.FAILED,
          output: ['failed'],
        });
      },
      assertExpected: (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
        expect(installLanguageMock).toHaveBeenCalled();
        expect(setLocaleMock).not.toHaveBeenCalledWith({ locale: 'fr_FR' });
        expect(wrapper.text()).toContain(
          'Language pack installation did not succeed for French. Keeping current locale.'
        );
        expect(wrapper.text()).toContain('Setup Applied with Warnings');
      },
    },
    {
      caseName: 'keeps locale when language installer returns malformed payload',
      apply: () => {
        draftStore.selectedLanguage = 'fr_FR';
        installLanguageMock.mockResolvedValue({
          operationId: 'lang-op',
          output: ['missing status'],
        });
      },
      assertExpected: (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
        expect(installLanguageMock).toHaveBeenCalled();
        expect(setLocaleMock).not.toHaveBeenCalledWith({ locale: 'fr_FR' });
        expect(wrapper.text()).toContain(
          'Language pack installation did not succeed for French. Keeping current locale.'
        );
        expect(wrapper.text()).toContain('Setup Applied with Warnings');
      },
    },
    {
      caseName: 'keeps locale when language installer returns unknown status',
      apply: () => {
        draftStore.selectedLanguage = 'fr_FR';
        installLanguageMock.mockResolvedValue({
          operationId: 'lang-op',
          status: 'UNKNOWN',
          output: ['unknown status'],
        });
      },
      assertExpected: (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
        expect(installLanguageMock).toHaveBeenCalled();
        expect(setLocaleMock).not.toHaveBeenCalledWith({ locale: 'fr_FR' });
        expect(wrapper.text()).toContain(
          'Language pack installation did not succeed for French. Keeping current locale.'
        );
        expect(wrapper.text()).toContain('Setup Applied with Warnings');
      },
    },
    {
      caseName: 'classifies language install timeout separately',
      apply: () => {
        draftStore.selectedLanguage = 'fr_FR';
        const timeoutError = new Error(
          'Timed out waiting for install operation lang-op to finish'
        ) as Error & {
          code?: string;
        };
        timeoutError.code = 'INSTALL_OPERATION_TIMEOUT';
        installLanguageMock.mockRejectedValue(timeoutError);
      },
      assertExpected: (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
        expect(installLanguageMock).toHaveBeenCalled();
        expect(setLocaleMock).not.toHaveBeenCalledWith({ locale: 'fr_FR' });
        expect(wrapper.text()).toContain('Setup Continued After Timeout');
      },
    },
  ])('follows locale endpoint decision matrix ($caseName)', async (scenario) => {
    scenario.apply();

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    scenario.assertExpected(wrapper);
  });

  it('locks modal visibility and ignores duplicate apply clicks while processing', async () => {
    draftStore.selectedTimeZone = 'America/New_York';
    let resolveSystemTime: (() => void) | undefined;
    updateSystemTimeMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSystemTime = () => resolve({});
        })
    );

    const { wrapper } = mountComponent();
    const buttons = wrapper.findAll('[data-testid="brand-button"]');
    const applyButton = buttons[buttons.length - 1];

    await applyButton.trigger('click');
    await applyButton.trigger('click');

    expect(setModalHiddenMock).toHaveBeenCalledWith(false);
    expect(updateSystemTimeMock).toHaveBeenCalledTimes(1);
    expect(applyButton.attributes('disabled')).toBeDefined();

    if (resolveSystemTime) {
      resolveSystemTime();
    }
    await flushPromises();
    await vi.runAllTimersAsync();
    await flushPromises();

    expect(completeOnboardingMock).toHaveBeenCalledTimes(1);
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

  it('keeps custom baseline server identity when draft mirrors baseline values', async () => {
    coreSettingsResult.value = {
      vars: { name: 'MyServer', useSsh: false, localTld: 'local' },
      server: { name: 'MyServer', comment: 'Primary host' },
      display: { theme: 'white', locale: 'en_US' },
      systemTime: { timeZone: 'UTC' },
      info: { primaryNetwork: { ipAddress: '192.168.1.2' } },
    };
    draftStore.serverName = 'MyServer';
    draftStore.serverDescription = 'Primary host';

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(updateServerIdentityMock).not.toHaveBeenCalled();
    expect(updateSystemTimeMock).not.toHaveBeenCalled();
    expect(setThemeMock).not.toHaveBeenCalled();
    expect(setLocaleMock).not.toHaveBeenCalled();
    expect(updateSshSettingsMock).not.toHaveBeenCalled();
  });

  it.each([
    {
      caseName: 'server identity name only',
      apply: () => {
        draftStore.serverName = 'Tower2';
      },
      assertExpected: () => {
        expect(updateServerIdentityMock).toHaveBeenCalledWith({ name: 'Tower2', comment: '' });
      },
    },
    {
      caseName: 'server identity description only',
      apply: () => {
        draftStore.serverDescription = 'Edge host';
      },
      assertExpected: () => {
        expect(updateServerIdentityMock).toHaveBeenCalledWith({
          name: 'Tower',
          comment: 'Edge host',
        });
      },
    },
    {
      caseName: 'timezone only',
      apply: () => {
        draftStore.selectedTimeZone = 'America/New_York';
      },
      assertExpected: () => {
        expect(updateSystemTimeMock).toHaveBeenCalledWith({
          input: { timeZone: 'America/New_York' },
        });
      },
    },
    {
      caseName: 'theme only',
      apply: () => {
        draftStore.selectedTheme = 'black';
      },
      assertExpected: () => {
        expect(setThemeMock).toHaveBeenCalledWith({ theme: 'black' });
      },
    },
    {
      caseName: 'language only',
      apply: () => {
        draftStore.selectedLanguage = 'fr_FR';
      },
      assertExpected: () => {
        expect(installLanguageMock).toHaveBeenCalledWith({
          forced: false,
          name: 'French',
          url: 'https://example.com/fr_FR.txz',
        });
        expect(setLocaleMock).toHaveBeenCalledWith({ locale: 'fr_FR' });
      },
    },
    {
      caseName: 'ssh only',
      apply: () => {
        draftStore.useSsh = true;
      },
      assertExpected: () => {
        expect(updateSshSettingsMock).toHaveBeenCalledWith({ enabled: true, port: 22 });
      },
    },
  ])('applies only the changed core setting when baseline is loaded ($caseName)', async (scenario) => {
    scenario.apply();

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    scenario.assertExpected();

    if (
      scenario.caseName !== 'server identity name only' &&
      scenario.caseName !== 'server identity description only'
    ) {
      expect(updateServerIdentityMock).not.toHaveBeenCalled();
    }
    if (scenario.caseName !== 'timezone only') {
      expect(updateSystemTimeMock).not.toHaveBeenCalled();
    }
    if (scenario.caseName !== 'theme only') {
      expect(setThemeMock).not.toHaveBeenCalled();
    }
    if (scenario.caseName !== 'language only') {
      expect(setLocaleMock).not.toHaveBeenCalled();
      expect(installLanguageMock).not.toHaveBeenCalled();
    }
    if (scenario.caseName !== 'ssh only') {
      expect(updateSshSettingsMock).not.toHaveBeenCalled();
    }
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

  it('applies trusted defaults when baseline query is down and draft values are empty', async () => {
    coreSettingsResult.value = null;
    coreSettingsError.value = new Error('Graphql is offline.');
    draftStore.serverName = '';
    draftStore.serverDescription = '';
    draftStore.selectedTimeZone = '';
    draftStore.selectedTheme = '';
    draftStore.selectedLanguage = '';
    draftStore.useSsh = false;

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(updateSystemTimeMock).toHaveBeenCalledWith({ input: { timeZone: 'UTC' } });
    expect(updateServerIdentityMock).toHaveBeenCalledWith({
      name: 'Tower',
      comment: '',
    });
    expect(setThemeMock).toHaveBeenCalledWith({ theme: 'white' });
    expect(setLocaleMock).toHaveBeenCalledWith({ locale: 'en_US' });
    expect(updateSshSettingsMock).toHaveBeenCalledWith({ enabled: false, port: 22 });
  });

  it('keeps best-effort fallback path once readiness times out before baseline is ready', async () => {
    coreSettingsResult.value = null;
    coreSettingsError.value = null;
    draftStore.serverName = 'Tower';
    draftStore.serverDescription = '';
    draftStore.selectedTimeZone = 'UTC';
    draftStore.selectedTheme = 'white';
    draftStore.selectedLanguage = 'en_US';
    draftStore.useSsh = false;

    const { wrapper } = mountComponent();
    await vi.advanceTimersByTimeAsync(10000);

    coreSettingsResult.value = {
      vars: { name: 'Tower', useSsh: false, localTld: 'local' },
      server: { name: 'Tower', comment: '' },
      display: { theme: 'white', locale: 'en_US' },
      systemTime: { timeZone: 'UTC' },
      info: { primaryNetwork: { ipAddress: '192.168.1.2' } },
    };
    await flushPromises();

    await clickApply(wrapper);

    expect(updateSystemTimeMock).toHaveBeenCalledWith({ input: { timeZone: 'UTC' } });
    expect(updateServerIdentityMock).toHaveBeenCalledWith({
      name: 'Tower',
      comment: '',
    });
    expect(setThemeMock).toHaveBeenCalledWith({ theme: 'white' });
    expect(setLocaleMock).toHaveBeenCalledWith({ locale: 'en_US' });
    expect(updateSshSettingsMock).toHaveBeenCalledWith({ enabled: false, port: 22 });
    expect(wrapper.text()).toContain(
      'Baseline settings unavailable. Applying trusted defaults + draft values without diff checks.'
    );
  });

  it.each([
    {
      caseName: 'baseline available + completion/refetch succeed',
      apply: () => {},
      assertExpected: (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
        expect(completeOnboardingMock).toHaveBeenCalledTimes(1);
        expect(refetchOnboardingMock).toHaveBeenCalledTimes(1);
        expect(wrapper.text()).toContain('Setup Applied');
        expect(wrapper.text()).not.toContain('Setup Saved in Best-Effort Mode');
      },
    },
    {
      caseName: 'baseline available + onboarding refetch fails',
      apply: () => {
        refetchOnboardingMock.mockRejectedValue(new Error('refresh failed'));
      },
      assertExpected: (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
        expect(completeOnboardingMock).toHaveBeenCalledTimes(1);
        expect(refetchOnboardingMock).toHaveBeenCalledTimes(1);
        expect(wrapper.text()).toContain('Could not refresh onboarding state right now. Continuing.');
        expect(wrapper.text()).toContain('Setup Saved in Best-Effort Mode');
      },
    },
    {
      caseName: 'baseline unavailable + completion succeeds',
      apply: () => {
        coreSettingsResult.value = null;
        coreSettingsError.value = new Error('Graphql is offline.');
      },
      assertExpected: (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
        expect(completeOnboardingMock).toHaveBeenCalledTimes(1);
        expect(refetchOnboardingMock).not.toHaveBeenCalled();
        expect(wrapper.text()).toContain('Skipping onboarding state refresh while API is unavailable.');
        expect(wrapper.text()).toContain('Setup Saved in Best-Effort Mode');
      },
    },
    {
      caseName: 'completion mutation fails',
      apply: () => {
        completeOnboardingMock.mockRejectedValue(new Error('offline'));
      },
      assertExpected: (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
        expect(completeOnboardingMock).toHaveBeenCalledTimes(1);
        expect(refetchOnboardingMock).not.toHaveBeenCalled();
        expect(wrapper.text()).toContain(
          'Could not mark onboarding complete right now (API may be offline): offline'
        );
        expect(wrapper.text()).toContain('Setup Saved in Best-Effort Mode');
      },
    },
  ])('follows completion endpoint decision matrix ($caseName)', async (scenario) => {
    scenario.apply();

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    scenario.assertExpected(wrapper);
  });

  it('prefers best-effort result over timeout classification when completion fails', async () => {
    draftStore.selectedPlugins = new Set(['community-apps']);
    const timeoutError = new Error(
      'Timed out waiting for install operation plugin-op to finish'
    ) as Error & {
      code?: string;
    };
    timeoutError.code = 'INSTALL_OPERATION_TIMEOUT';
    installPluginMock.mockRejectedValue(timeoutError);
    completeOnboardingMock.mockRejectedValue(new Error('offline'));

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(wrapper.text()).toContain('Setup Saved in Best-Effort Mode');
    expect(wrapper.text()).not.toContain('Setup Continued After Timeout');
  });

  it('prefers timeout result over warning classification when completion succeeds', async () => {
    draftStore.selectedPlugins = new Set(['community-apps']);
    draftStore.serverName = 'bad name!';
    updateServerIdentityMock.mockRejectedValue(new Error('Server name contains invalid characters'));
    const timeoutError = new Error(
      'Timed out waiting for install operation plugin-op to finish'
    ) as Error & {
      code?: string;
    };
    timeoutError.code = 'INSTALL_OPERATION_TIMEOUT';
    installPluginMock.mockRejectedValue(timeoutError);

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(wrapper.text()).toContain('Setup Continued After Timeout');
    expect(wrapper.text()).not.toContain('Setup Applied with Warnings');
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

  it('verifies SSH settings and reports fully applied setup when state matches', async () => {
    draftStore.useSsh = true;
    updateSshSettingsMock.mockResolvedValue({
      data: {
        updateSshSettings: { id: 'vars', useSsh: true, portssh: 22 },
      },
    });

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(updateSshSettingsMock).toHaveBeenCalledWith({ enabled: true, port: 22 });
    expect(wrapper.text()).toContain('SSH settings verified.');
    expect(wrapper.text()).toContain('Setup Applied');
    expect(wrapper.text()).not.toContain('Best-Effort');
  });

  it('keeps best-effort messaging when SSH state cannot be verified in time', async () => {
    draftStore.useSsh = true;
    updateSshSettingsMock.mockResolvedValue({
      data: {
        updateSshSettings: { id: 'vars', useSsh: false, portssh: 22 },
      },
    });

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(updateSshSettingsMock).toHaveBeenCalledWith({ enabled: true, port: 22 });
    expect(wrapper.text()).toContain(
      'SSH update submitted, but final SSH state could not be verified yet.'
    );
    expect(wrapper.text()).toContain('Setup Saved in Best-Effort Mode');
  });
});
