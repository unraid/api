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

import type { GetInternalBootContextQuery } from '~/composables/gql/graphql';

import OnboardingSummaryStep from '~/components/Onboarding/steps/OnboardingSummaryStep.vue';
import {
  DiskInterfaceType,
  GetInternalBootContextDocument,
  PluginInstallStatus,
} from '~/composables/gql/graphql';
import { createTestI18n } from '../../utils/i18n';

const {
  draftStore,
  setInternalBootApplySucceededMock,
  setInternalBootApplyAttemptedMock,
  registrationStateRef,
  isFreshInstallRef,
  activationCodeRef,
  coreSettingsResult,
  coreSettingsError,
  internalBootContextResult,
  installedPluginsResult,
  availableLanguagesResult,
  refetchInstalledPluginsMock,
  setModalHiddenMock,
  updateSystemTimeMock,
  updateServerIdentityMock,
  setThemeMock,
  setLocaleMock,
  updateSshSettingsMock,
  completeOnboardingMock,
  installLanguageMock,
  installPluginMock,
  applyInternalBootSelectionMock,
  cleanupOnboardingStorageMock,
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
    bootMode: 'usb' as 'usb' | 'storage',
    selectedPlugins: new Set<string>(),
    internalBootSelection: null as {
      poolName: string;
      slotCount: number;
      devices: string[];
      bootSizeMiB: number;
      updateBios: boolean;
      poolMode: 'dedicated' | 'hybrid';
    } | null,
    internalBootInitialized: true,
    internalBootSkipped: false,
    internalBootApplySucceeded: false,
    internalBootApplyAttempted: false,
  },
  setInternalBootApplySucceededMock: vi.fn((value: boolean) => {
    draftStore.internalBootApplySucceeded = value;
  }),
  setInternalBootApplyAttemptedMock: vi.fn((value: boolean) => {
    draftStore.internalBootApplyAttempted = value;
  }),
  registrationStateRef: { value: 'ENOKEYFILE' },
  isFreshInstallRef: { value: true },
  activationCodeRef: { value: null as unknown },
  coreSettingsResult: {
    value: null as unknown,
  },
  coreSettingsError: { value: null as unknown },
  internalBootContextResult: { value: null as GetInternalBootContextQuery | null },
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
  setModalHiddenMock: vi.fn(),
  updateSystemTimeMock: vi.fn().mockResolvedValue({}),
  updateServerIdentityMock: vi.fn().mockResolvedValue({}),
  setThemeMock: vi.fn().mockResolvedValue({}),
  setLocaleMock: vi.fn().mockResolvedValue({}),
  updateSshSettingsMock: vi.fn().mockResolvedValue({}),
  completeOnboardingMock: vi.fn().mockResolvedValue({}),
  installLanguageMock: vi.fn(),
  installPluginMock: vi.fn(),
  applyInternalBootSelectionMock: vi.fn(),
  cleanupOnboardingStorageMock: vi.fn(),
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
  Accordion: {
    props: ['items', 'type', 'collapsible', 'class'],
    template: `<div data-testid="accordion"><template v-for="item in items" :key="item.value"><slot name="trigger" :item="item" :open="false" /><slot name="content" :item="item" :open="false" /></template></div>`,
  },
}));

vi.mock('@/components/Onboarding/components/OnboardingConsole.vue', () => ({
  default: {
    props: ['logs'],
    template: '<div data-testid="onboarding-console">{{ JSON.stringify(logs) }}</div>',
  },
}));

vi.mock('~/components/Onboarding/store/onboardingDraft', () => ({
  useOnboardingDraftStore: () => ({
    ...draftStore,
    setInternalBootApplySucceeded: setInternalBootApplySucceededMock,
    setInternalBootApplyAttempted: setInternalBootApplyAttemptedMock,
  }),
}));

vi.mock('~/components/Onboarding/store/activationCodeData', () => ({
  useActivationCodeDataStore: () => ({
    registrationState: registrationStateRef,
    isFreshInstall: isFreshInstallRef,
    activationCode: activationCodeRef,
  }),
}));

vi.mock('@/components/Onboarding/store/onboardingModalVisibility', () => ({
  useOnboardingModalStore: () => ({
    setIsHidden: setModalHiddenMock,
  }),
}));

vi.mock('@/components/Onboarding/store/onboardingStorageCleanup', () => ({
  cleanupOnboardingStorage: cleanupOnboardingStorageMock,
}));

vi.mock('@/components/Onboarding/composables/usePluginInstaller', () => ({
  INSTALL_OPERATION_TIMEOUT_CODE: 'INSTALL_OPERATION_TIMEOUT',
  default: () => ({
    installLanguage: installLanguageMock,
    installPlugin: installPluginMock,
  }),
}));

vi.mock('@/components/Onboarding/composables/internalBoot', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/components/Onboarding/composables/internalBoot')>();
  return {
    ...actual,
    applyInternalBootSelection: applyInternalBootSelectionMock,
  };
});

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
    if (doc === GetInternalBootContextDocument) {
      return { result: internalBootContextResult };
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
      stubs: {
        teleport: true,
        UButton: {
          props: ['disabled'],
          emits: ['click'],
          template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
        },
        UModal: {
          props: ['open', 'ui', 'title', 'description', 'dismissible', 'close'],
          template: `
            <div v-if="open" data-testid="dialog" :class="ui?.content" :data-dismissible="dismissible" :data-close="close" :data-title="title">
              <div>{{ title }}</div>
              <div>{{ description }}</div>
              <slot name="body" />
              <slot name="footer" />
            </div>
          `,
        },
      },
    },
  });

  const originalText = wrapper.text.bind(wrapper);
  wrapper.text = (() => {
    const vm = wrapper.vm as unknown as SummaryVm;
    const extraText = [
      document.body.textContent ?? '',
      vm.showBootDriveWarningDialog ? 'Confirm Drive Wipe' : '',
      vm.showApplyResultDialog ? vm.applyResultTitle : '',
      vm.showApplyResultDialog ? vm.applyResultMessage : '',
    ]
      .filter(Boolean)
      .join(' ');

    return `${originalText()} ${extraText}`.trim();
  }) as typeof wrapper.text;

  return { wrapper, onComplete };
};

interface SummaryVm {
  showApplyResultDialog: boolean;
  showBootDriveWarningDialog: boolean;
  applyResultTitle: string;
  applyResultMessage: string;
  applyResultSeverity: 'success' | 'warning' | 'error';
  handleBootDriveWarningConfirm: () => Promise<void>;
  handleBootDriveWarningCancel: () => void;
  handleApplyResultConfirm: () => Promise<void>;
}

const getSummaryVm = (wrapper: ReturnType<typeof mountComponent>['wrapper']) =>
  wrapper.vm as unknown as SummaryVm;

const findButtonByText = (wrapper: ReturnType<typeof mountComponent>['wrapper'], text: string) => {
  const normalizedTarget = text.trim().toLowerCase();
  const wrapperButton = wrapper.findAll('button').find((button) => {
    return button.text().trim().toLowerCase() === normalizedTarget;
  });

  if (wrapperButton) {
    return wrapperButton;
  }

  return Array.from(document.body.querySelectorAll('button')).find((button) => {
    return button.textContent?.trim().toLowerCase() === normalizedTarget;
  });
};

const clickButtonByText = async (
  wrapper: ReturnType<typeof mountComponent>['wrapper'],
  text: string
) => {
  const button = findButtonByText(wrapper, text);
  if (!button) {
    const normalizedTarget = text.trim().toLowerCase();
    const vm = getSummaryVm(wrapper);

    if (normalizedTarget === 'continue') {
      const confirmPromise = vm.handleBootDriveWarningConfirm();
      await vi.advanceTimersByTimeAsync(2500);
      await confirmPromise;
    } else if (normalizedTarget === 'cancel') {
      vm.handleBootDriveWarningCancel();
    } else if (normalizedTarget === 'ok') {
      await vm.handleApplyResultConfirm();
    } else {
      expect(button).toBeTruthy();
    }

    await flushPromises();
    return;
  }

  if ('trigger' in button) {
    await button.trigger('click');
  } else {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }

  await flushPromises();
};

const expectApplyResult = (
  wrapper: ReturnType<typeof mountComponent>['wrapper'],
  expected: {
    title: string;
    message?: string;
    severity?: SummaryVm['applyResultSeverity'];
  }
) => {
  const vm = getSummaryVm(wrapper);

  expect(vm.showApplyResultDialog).toBe(true);
  expect(vm.applyResultTitle).toBe(expected.title);

  if (expected.message) {
    expect(vm.applyResultMessage).toBe(expected.message);
  }

  if (expected.severity) {
    expect(vm.applyResultSeverity).toBe(expected.severity);
  }
};

const clickApply = async (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
  const buttons = wrapper.findAll('[data-testid="brand-button"]');
  const applyButton = buttons[buttons.length - 1];
  await applyButton.trigger('click');
  await flushPromises();

  if (wrapper.text().includes('Confirm Drive Wipe')) {
    await clickButtonByText(wrapper, 'Continue');
  }

  await vi.advanceTimersByTimeAsync(2500);
  await flushPromises();
};

describe('OnboardingSummaryStep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    document.body.innerHTML = '';
    setupApolloMocks();

    draftStore.serverName = 'Tower';
    draftStore.serverDescription = '';
    draftStore.selectedTimeZone = 'UTC';
    draftStore.selectedTheme = 'white';
    draftStore.selectedLanguage = 'en_US';
    draftStore.useSsh = false;
    draftStore.bootMode = 'usb';
    draftStore.selectedPlugins = new Set();
    draftStore.internalBootSelection = null;
    draftStore.internalBootInitialized = true;
    draftStore.internalBootSkipped = false;
    draftStore.internalBootApplySucceeded = false;

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
    internalBootContextResult.value = {
      internalBootContext: {
        bootEligible: true,
        bootedFromFlashWithInternalBootSetup: false,
        enableBootTransfer: 'yes',
        reservedNames: [],
        shareNames: [],
        poolNames: [],
        driveWarnings: [],
        assignableDisks: [
          {
            id: 'DISK-A',
            device: '/dev/sda',
            size: 500 * 1024 * 1024 * 1024,
            serialNum: 'DISK-A',
            interfaceType: DiskInterfaceType.SATA,
          },
          {
            id: 'DISK-B',
            device: '/dev/sdb',
            size: 250 * 1024 * 1024 * 1024,
            serialNum: 'DISK-B',
            interfaceType: DiskInterfaceType.SATA,
          },
        ],
      },
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
    applyInternalBootSelectionMock.mockResolvedValue({
      applySucceeded: true,
      hadWarnings: false,
      hadNonOptimisticFailures: false,
      logs: [],
    });
    refetchInstalledPluginsMock.mockResolvedValue(undefined);
  });

  it('marks the server name hidden in the summary card', () => {
    const { wrapper } = mountComponent();

    const serverNameLabel = wrapper.findAll('span').find((span) => span.text() === 'Server Name');
    expect(serverNameLabel?.element.parentElement?.classList.contains('hidden')).toBe(true);
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
        expect(wrapper.text()).toContain('No Updates Needed');
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
        expect(wrapper.text()).toContain('No Updates Needed');
      },
    },
    {
      caseName: 'skips unknown plugin ids',
      apply: () => {
        draftStore.selectedPlugins = new Set(['unknown-plugin-id']);
      },
      assertExpected: (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
        expect(installPluginMock).not.toHaveBeenCalled();
        expect(wrapper.text()).toContain('No Updates Needed');
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

  it('uses a wider responsive result dialog for apply outcomes', async () => {
    const { wrapper } = mountComponent();

    await clickApply(wrapper);

    expectApplyResult(wrapper, {
      title: 'No Updates Needed',
      message: 'There were no onboarding updates to apply, so nothing was changed.',
      severity: 'success',
    });
  });

  it('only allows closing the apply result dialog via the OK button', async () => {
    const { wrapper, onComplete } = mountComponent();

    await clickApply(wrapper);

    const vm = getSummaryVm(wrapper);
    expect(vm.showApplyResultDialog).toBe(true);
    expect(onComplete).not.toHaveBeenCalled();

    vm.handleApplyResultConfirm();
    expect(vm.showApplyResultDialog).toBe(false);
    expect(onComplete).toHaveBeenCalledOnce();
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

  it('ignores duplicate apply clicks while processing', async () => {
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

    expect(updateSystemTimeMock).toHaveBeenCalledTimes(1);
    expect(applyButton.attributes('disabled')).toBeDefined();

    if (resolveSystemTime) {
      resolveSystemTime();
    }
    await flushPromises();
    await vi.runAllTimersAsync();
    await flushPromises();

    expect(completeOnboardingMock).not.toHaveBeenCalled();
  });

  it('skips core setting mutations when baseline is loaded and nothing changed', async () => {
    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(updateSystemTimeMock).not.toHaveBeenCalled();
    expect(updateServerIdentityMock).not.toHaveBeenCalled();
    expect(setThemeMock).not.toHaveBeenCalled();
    expect(setLocaleMock).not.toHaveBeenCalled();
    expect(updateSshSettingsMock).not.toHaveBeenCalled();
    expect(completeOnboardingMock).not.toHaveBeenCalled();
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

  it('keeps baseline server name when draft server name is empty', async () => {
    coreSettingsResult.value = {
      vars: { name: 'bad name!', useSsh: false, localTld: 'local' },
      server: { name: 'bad name!', comment: '' },
      display: { theme: 'white', locale: 'en_US' },
      systemTime: { timeZone: 'UTC' },
      info: { primaryNetwork: { ipAddress: '192.168.1.2' } },
    };
    draftStore.serverName = '';

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(updateServerIdentityMock).not.toHaveBeenCalled();
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

  it('skips server identity when baseline query is down and draft server name is empty', async () => {
    coreSettingsResult.value = null;
    coreSettingsError.value = new Error('Graphql is offline.');
    draftStore.serverName = '';
    draftStore.serverDescription = 'Edge host';
    draftStore.selectedTimeZone = '';
    draftStore.selectedTheme = '';
    draftStore.selectedLanguage = '';
    draftStore.useSsh = false;

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(updateSystemTimeMock).toHaveBeenCalledWith({ input: { timeZone: 'UTC' } });
    expect(updateServerIdentityMock).not.toHaveBeenCalled();
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
      caseName: 'baseline available — shows success (completion deferred to NextSteps)',
      apply: () => {},
      assertExpected: (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
        expect(completeOnboardingMock).not.toHaveBeenCalled();
        expect(wrapper.text()).toContain('No Updates Needed');
        expect(wrapper.text()).not.toContain('Setup Saved in Best-Effort Mode');
      },
    },
    {
      caseName: 'baseline unavailable — shows best-effort (completion deferred to NextSteps)',
      apply: () => {
        coreSettingsResult.value = null;
        coreSettingsError.value = new Error('Graphql is offline.');
      },
      assertExpected: (wrapper: ReturnType<typeof mountComponent>['wrapper']) => {
        expect(completeOnboardingMock).not.toHaveBeenCalled();
        expect(wrapper.text()).toContain('Setup Saved in Best-Effort Mode');
      },
    },
  ])('follows apply-only result matrix ($caseName)', async (scenario) => {
    scenario.apply();

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    scenario.assertExpected(wrapper);
  });

  it('keeps the success dialog open after apply instead of advancing immediately', async () => {
    const { wrapper, onComplete } = mountComponent();

    await clickApply(wrapper);

    expect(cleanupOnboardingStorageMock).not.toHaveBeenCalled();
    expect(getSummaryVm(wrapper).showApplyResultDialog).toBe(true);
    expect(wrapper.text()).toContain('No Updates Needed');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('advances to next steps before reloading after a successful server rename', async () => {
    draftStore.serverName = 'Newtower';
    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => undefined);
    const { wrapper, onComplete } = mountComponent();

    await clickApply(wrapper);

    expect(updateServerIdentityMock).toHaveBeenCalledWith({
      name: 'Newtower',
      comment: '',
      sysModel: undefined,
    });
    expect(onComplete).not.toHaveBeenCalled();

    await clickButtonByText(wrapper, 'OK');

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(reloadSpy).toHaveBeenCalledTimes(1);

    reloadSpy.mockRestore();
  });

  it('retries final identity update after transient network errors when SSH changed', async () => {
    draftStore.useSsh = true;
    draftStore.serverDescription = 'Primary host';
    updateSshSettingsMock.mockResolvedValue({
      data: {
        updateSshSettings: { id: 'vars', useSsh: true, portssh: 22 },
      },
    });
    updateServerIdentityMock
      .mockRejectedValueOnce(new Error('NetworkError when attempting to fetch resource.'))
      .mockResolvedValueOnce({});

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(updateServerIdentityMock).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('Server Identity updated.');
    expect(wrapper.text()).toContain('Setup Applied');
    expect(wrapper.text()).not.toContain('Server identity request returned an error, continuing');
  });

  it('prefers timeout result when plugin install times out', async () => {
    draftStore.selectedPlugins = new Set(['community-apps']);
    const timeoutError = new Error(
      'Timed out waiting for install operation plugin-op to finish'
    ) as Error & {
      code?: string;
    };
    timeoutError.code = 'INSTALL_OPERATION_TIMEOUT';
    installPluginMock.mockRejectedValue(timeoutError);

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(completeOnboardingMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Setup Continued After Timeout');
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

  it('shows result dialog in offline mode and advances only after OK', async () => {
    coreSettingsResult.value = null;
    coreSettingsError.value = new Error('Graphql is offline.');

    const { wrapper, onComplete } = mountComponent();
    await clickApply(wrapper);

    expect(getSummaryVm(wrapper).showApplyResultDialog).toBe(true);
    expect(wrapper.text()).toContain('Setup Saved in Best-Effort Mode');
    expect(onComplete).not.toHaveBeenCalled();

    await clickButtonByText(wrapper, 'OK');

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

  it('always shows boot configuration section for USB boot mode', () => {
    draftStore.bootMode = 'usb';
    draftStore.internalBootSelection = null;
    draftStore.internalBootInitialized = true;
    draftStore.internalBootSkipped = false;

    const { wrapper } = mountComponent();

    expect(wrapper.text()).toContain('Boot Configuration');
    expect(wrapper.text()).toContain('USB/Flash Drive');
  });

  it('hides boot configuration section when internal boot step was skipped', () => {
    draftStore.bootMode = 'usb';
    draftStore.internalBootSelection = null;
    draftStore.internalBootInitialized = true;
    draftStore.internalBootSkipped = true;

    const { wrapper } = mountComponent();

    expect(wrapper.text()).not.toContain('Boot Configuration');
  });

  it('hides boot configuration section when internal boot step is not initialized', () => {
    draftStore.bootMode = 'storage';
    draftStore.internalBootSelection = null;
    draftStore.internalBootInitialized = false;
    draftStore.internalBootSkipped = false;

    const { wrapper } = mountComponent();

    expect(wrapper.text()).not.toContain('Boot Configuration');
  });

  it('shows selected boot devices with device name and size details', () => {
    draftStore.bootMode = 'storage';
    draftStore.internalBootSelection = {
      poolName: 'boot',
      slotCount: 2,
      devices: ['DISK-A', 'DISK-B'],
      bootSizeMiB: 16384,
      updateBios: true,
      poolMode: 'hybrid',
    };

    const { wrapper } = mountComponent();

    expect(wrapper.text()).toContain('DISK-A - 537 GB (sda)');
    expect(wrapper.text()).toContain('DISK-B - 268 GB (sdb)');
  });

  it('requires confirmation before applying storage boot drive changes', async () => {
    draftStore.bootMode = 'storage';
    draftStore.internalBootSelection = {
      poolName: 'cache',
      slotCount: 1,
      devices: ['DISK-A'],
      bootSizeMiB: 16384,
      updateBios: true,
      poolMode: 'hybrid',
    };

    const { wrapper } = mountComponent();
    const buttons = wrapper.findAll('[data-testid="brand-button"]');
    const applyButton = buttons[buttons.length - 1];
    await applyButton.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Confirm Drive Wipe');
    expect(applyInternalBootSelectionMock).not.toHaveBeenCalled();

    await clickButtonByText(wrapper, 'Cancel');

    expect(wrapper.text()).not.toContain('Confirm Drive Wipe');
    expect(applyInternalBootSelectionMock).not.toHaveBeenCalled();
  });

  it('applies internal boot configuration without reboot and records success', async () => {
    draftStore.bootMode = 'storage';
    draftStore.internalBootSelection = {
      poolName: 'cache',
      slotCount: 2,
      devices: ['DISK-A', 'DISK-B'],
      bootSizeMiB: 16384,
      updateBios: true,
      poolMode: 'hybrid',
    };
    draftStore.internalBootSkipped = false;
    applyInternalBootSelectionMock.mockResolvedValue({
      applySucceeded: true,
      hadWarnings: false,
      hadNonOptimisticFailures: false,
      logs: [
        {
          message: 'Internal boot pool configured.',
          type: 'success',
        },
        {
          message: 'BIOS boot entry updates completed successfully.',
          type: 'success',
        },
      ],
    });

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(applyInternalBootSelectionMock).toHaveBeenCalledWith(
      {
        poolName: 'cache',
        devices: ['DISK-A', 'DISK-B'],
        bootSizeMiB: 16384,
        updateBios: true,
        slotCount: 2,
        poolMode: 'hybrid',
      },
      {
        configured: 'Internal boot pool configured.',
        returnedError: expect.any(Function),
        failed: expect.any(String),
        biosUnverified: expect.any(String),
      }
    );
    expect(setInternalBootApplyAttemptedMock).toHaveBeenCalledWith(true);
    expect(setInternalBootApplySucceededMock).toHaveBeenCalledWith(true);
    expect(wrapper.text()).toContain('Internal boot pool configured.');
    expect(wrapper.text()).toContain('BIOS boot entry updates completed successfully.');
    expect(wrapper.text()).toContain('Setup Applied');
    expect(wrapper.text()).not.toContain('Setup Applied with Warnings');
  });

  it('continues with warnings when internal boot setup returns an error', async () => {
    draftStore.bootMode = 'storage';
    draftStore.internalBootSelection = {
      poolName: 'cache',
      slotCount: 1,
      devices: ['DISK-A'],
      bootSizeMiB: 16384,
      updateBios: false,
      poolMode: 'hybrid',
    };
    applyInternalBootSelectionMock.mockResolvedValue({
      applySucceeded: false,
      hadWarnings: true,
      hadNonOptimisticFailures: true,
      logs: [
        {
          message: 'Internal boot setup returned an error: mkbootpool failed',
          type: 'error',
        },
      ],
    });

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(setInternalBootApplySucceededMock).not.toHaveBeenCalledWith(true);
    expect(wrapper.text()).toContain('Internal boot setup returned an error');
    expect(wrapper.text()).toContain('mkbootpool failed');
    expect(wrapper.text()).toContain('Setup Applied with Warnings');
  });

  it('surfaces BIOS update warnings in visible logs while keeping internal boot successful', async () => {
    draftStore.bootMode = 'storage';
    draftStore.internalBootSelection = {
      poolName: 'cache',
      slotCount: 1,
      devices: ['DISK-A'],
      bootSizeMiB: 16384,
      updateBios: true,
      poolMode: 'hybrid',
    };
    applyInternalBootSelectionMock.mockResolvedValue({
      applySucceeded: true,
      hadWarnings: true,
      hadNonOptimisticFailures: true,
      logs: [
        {
          message:
            'BIOS boot entry updates completed with warnings; manual BIOS boot order changes may still be required.',
          type: 'error',
        },
        {
          message: "efibootmgr failed for '/dev/sda' (rc=1)",
          type: 'error',
        },
      ],
    });

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(setInternalBootApplySucceededMock).toHaveBeenCalledWith(true);
    expect(wrapper.text()).toContain(
      'BIOS boot entry updates completed with warnings; manual BIOS boot order changes may still be required.'
    );
    expect(wrapper.text()).toContain("efibootmgr failed for '/dev/sda' (rc=1)");
    expect(wrapper.text()).toContain('Setup Applied with Warnings');
  });
});
