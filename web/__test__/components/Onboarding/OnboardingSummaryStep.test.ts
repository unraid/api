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
import { UPDATE_SERVER_IDENTITY_AND_RESUME_MUTATION } from '@/components/Onboarding/graphql/updateServerIdentityAndResume.mutation';
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
  coreSettingsLoading,
  coreSettingsError,
  internalBootContextResult,
  installedPluginsResult,
  installedPluginsLoading,
  installedPluginsError,
  availableLanguagesResult,
  availableLanguagesLoading,
  availableLanguagesError,
  refetchCoreSettingsMock,
  refetchInstalledPluginsMock,
  refetchAvailableLanguagesMock,
  setModalHiddenMock,
  updateSystemTimeMock,
  updateServerIdentityMock,
  updateServerIdentityAndResumeMock,
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
      devices: Array<{ id: string; sizeBytes: number; deviceName: string }>;
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
  coreSettingsLoading: { value: false },
  coreSettingsError: { value: null as unknown },
  internalBootContextResult: { value: null as GetInternalBootContextQuery | null },
  installedPluginsResult: { value: { installedUnraidPlugins: [] as string[] } },
  installedPluginsLoading: { value: false },
  installedPluginsError: { value: null as unknown },
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
  availableLanguagesLoading: { value: false },
  availableLanguagesError: { value: null as unknown },
  refetchCoreSettingsMock: vi.fn().mockResolvedValue(undefined),
  refetchInstalledPluginsMock: vi.fn().mockResolvedValue(undefined),
  refetchAvailableLanguagesMock: vi.fn().mockResolvedValue(undefined),
  setModalHiddenMock: vi.fn(),
  updateSystemTimeMock: vi.fn().mockResolvedValue({}),
  updateServerIdentityMock: vi.fn().mockResolvedValue({}),
  updateServerIdentityAndResumeMock: vi.fn().mockResolvedValue({}),
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

const createBootDevice = (id: string, sizeBytes: number, deviceName: string) => ({
  id,
  sizeBytes,
  deviceName,
});

const mockLocation = {
  origin: 'https://tower.local:4443',
  hostname: 'tower.local',
  pathname: '/',
  search: '',
  hash: '',
  reload: vi.fn(),
  replace: vi.fn(),
};

vi.mock('pinia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pinia')>();
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => store,
  };
});

vi.stubGlobal('location', mockLocation);

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
  Spinner: {
    name: 'Spinner',
    template: '<div data-testid="loading-spinner" />',
  },
}));

vi.mock('@/components/Onboarding/components/OnboardingConsole.vue', () => ({
  default: {
    props: ['logs'],
    template: '<div data-testid="onboarding-console">{{ JSON.stringify(logs) }}</div>',
  },
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
    if (doc === UPDATE_SERVER_IDENTITY_AND_RESUME_MUTATION) {
      return { mutate: updateServerIdentityAndResumeMock };
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
      return {
        result: coreSettingsResult,
        loading: coreSettingsLoading,
        error: coreSettingsError,
        refetch: refetchCoreSettingsMock,
      };
    }
    if (doc === GetInternalBootContextDocument) {
      return { result: internalBootContextResult };
    }
    if (doc === INSTALLED_UNRAID_PLUGINS_QUERY) {
      return {
        result: installedPluginsResult,
        loading: installedPluginsLoading,
        error: installedPluginsError,
        refetch: refetchInstalledPluginsMock,
      };
    }
    if (doc === GET_AVAILABLE_LANGUAGES_QUERY) {
      return {
        result: availableLanguagesResult,
        loading: availableLanguagesLoading,
        error: availableLanguagesError,
        refetch: refetchAvailableLanguagesMock,
      };
    }
    return { result: { value: null } };
  });
};

const mountComponent = (props: Record<string, unknown> = {}) => {
  const onComplete =
    (props.onComplete as (() => void | Promise<void>) | undefined) ??
    vi.fn<() => void | Promise<void>>();
  const wrapper = mount(OnboardingSummaryStep, {
    props: {
      draft: {
        coreSettings: {
          serverName: draftStore.serverName,
          serverDescription: draftStore.serverDescription,
          timeZone: draftStore.selectedTimeZone,
          theme: draftStore.selectedTheme,
          language: draftStore.selectedLanguage,
          useSsh: draftStore.useSsh,
        },
        plugins: {
          selectedIds: Array.from(draftStore.selectedPlugins),
        },
        internalBoot: {
          bootMode: draftStore.bootMode,
          skipped: draftStore.internalBootSkipped,
          selection: draftStore.internalBootSelection,
        },
      },
      internalBootState: {
        applyAttempted: draftStore.internalBootApplyAttempted,
        applySucceeded: draftStore.internalBootApplySucceeded,
      },
      onInternalBootStateChange: vi.fn((state: { applyAttempted: boolean; applySucceeded: boolean }) => {
        setInternalBootApplyAttemptedMock(state.applyAttempted);
        setInternalBootApplySucceededMock(state.applySucceeded);
      }),
      onComplete,
      onCloseOnboarding: vi.fn(),
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
      vm.showApplyResultDialog ? (vm.applyResultFollowUpMessage ?? '') : '',
    ]
      .filter(Boolean)
      .join(' ');

    return `${originalText()} ${extraText}`.trim();
  }) as typeof wrapper.text;

  return { wrapper, onComplete };
};

const buildExpectedResumeInput = (expectedServerName: string) => ({
  draft: {
    coreSettings: {
      serverName: draftStore.serverName,
      serverDescription: draftStore.serverDescription,
      timeZone: draftStore.selectedTimeZone,
      theme: draftStore.selectedTheme,
      language: draftStore.selectedLanguage,
      useSsh: draftStore.useSsh,
    },
    plugins: {
      selectedIds: Array.from(draftStore.selectedPlugins),
    },
    internalBoot: {
      bootMode: draftStore.bootMode,
      skipped: draftStore.internalBootSkipped,
      selection: draftStore.internalBootSelection,
    },
  },
  navigation: {
    currentStepId: 'NEXT_STEPS',
  },
  internalBootState: {
    applyAttempted: draftStore.internalBootApplyAttempted,
    applySucceeded: draftStore.internalBootApplySucceeded,
  },
  expectedServerName,
});

interface SummaryVm {
  showApplyResultDialog: boolean;
  showBootDriveWarningDialog: boolean;
  applyResultTitle: string;
  applyResultMessage: string;
  applyResultFollowUpMessage: string | null;
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
    mockLocation.origin = 'https://tower.local:4443';
    mockLocation.hostname = 'tower.local';
    mockLocation.pathname = '/';
    mockLocation.search = '';
    mockLocation.hash = '';
    mockLocation.reload.mockReset();
    mockLocation.replace.mockReset();
    updateServerIdentityAndResumeMock.mockReset();

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
    coreSettingsLoading.value = false;
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
    installedPluginsLoading.value = false;
    installedPluginsError.value = null;
    installedPluginsResult.value = { installedUnraidPlugins: [] };
    availableLanguagesLoading.value = false;
    availableLanguagesError.value = null;
    availableLanguagesResult.value = {
      customization: {
        availableLanguages: [
          { code: 'en_US', name: 'English', url: 'https://example.com/en_US.txz' },
          { code: 'fr_FR', name: 'French', url: 'https://example.com/fr_FR.txz' },
        ],
      },
    };

    updateSystemTimeMock.mockResolvedValue({});
    updateServerIdentityMock.mockResolvedValue({
      data: {
        updateServerIdentity: {
          id: 'local',
          name: 'Tower',
          comment: '',
          defaultUrl: 'https://Tower.local:4443',
        },
      },
    });
    updateServerIdentityAndResumeMock.mockResolvedValue({
      data: {
        updateServerIdentity: {
          id: 'local',
          name: 'Tower',
          comment: '',
          defaultUrl: 'https://Tower.local:4443',
        },
        onboarding: {
          saveOnboardingDraft: true,
        },
      },
    });
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

  it('blocks summary apply behind a loading gate until all required queries are ready', async () => {
    coreSettingsResult.value = null;
    coreSettingsLoading.value = true;

    const { wrapper } = mountComponent();
    await flushPromises();

    expect(wrapper.find('[data-testid="onboarding-loading-state"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="brand-button"]').exists()).toBe(false);
  });

  it('shows retry and close actions when a required summary query fails', async () => {
    coreSettingsError.value = new Error('offline');
    const onCloseOnboarding = vi.fn();

    const { wrapper } = mountComponent({ onCloseOnboarding });
    await flushPromises();

    expect(wrapper.find('[data-testid="onboarding-step-query-error"]').exists()).toBe(true);

    await wrapper.get('[data-testid="onboarding-step-query-retry"]').trigger('click');
    await wrapper.get('[data-testid="onboarding-step-query-close"]').trigger('click');

    expect(refetchCoreSettingsMock).toHaveBeenCalledTimes(1);
    expect(refetchInstalledPluginsMock).toHaveBeenCalledTimes(1);
    expect(refetchAvailableLanguagesMock).toHaveBeenCalledTimes(1);
    expect(onCloseOnboarding).toHaveBeenCalledTimes(1);
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
    expect(updateServerIdentityAndResumeMock).not.toHaveBeenCalled();
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
    expect(updateServerIdentityAndResumeMock).not.toHaveBeenCalled();
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
        expect(updateServerIdentityAndResumeMock).toHaveBeenCalledWith({
          name: 'Tower2',
          comment: '',
          sysModel: undefined,
          input: buildExpectedResumeInput('Tower2'),
        });
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
      expect(updateServerIdentityAndResumeMock).not.toHaveBeenCalled();
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

  it('does not apply changes when the baseline queries fail', async () => {
    coreSettingsResult.value = null;
    coreSettingsError.value = new Error('Graphql is offline.');

    const { wrapper } = mountComponent();
    await flushPromises();

    expect(wrapper.find('[data-testid="onboarding-step-query-error"]').exists()).toBe(true);
    expect(updateSystemTimeMock).not.toHaveBeenCalled();
    expect(updateServerIdentityMock).not.toHaveBeenCalled();
    expect(setThemeMock).not.toHaveBeenCalled();
    expect(setLocaleMock).not.toHaveBeenCalled();
    expect(updateSshSettingsMock).not.toHaveBeenCalled();
  });

  it('stays blocked instead of falling back after waiting for missing baseline data', async () => {
    coreSettingsResult.value = null;
    coreSettingsLoading.value = true;

    const { wrapper } = mountComponent();
    await vi.advanceTimersByTimeAsync(10000);
    await flushPromises();

    expect(wrapper.find('[data-testid="onboarding-loading-state"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Baseline settings unavailable');
  });

  it('shows the normal success result when required queries are ready', async () => {
    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(completeOnboardingMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('No Updates Needed');
    expect(wrapper.text()).not.toContain('Setup Saved in Best-Effort Mode');
  });

  it('keeps the success dialog open after apply instead of advancing immediately', async () => {
    const { wrapper, onComplete } = mountComponent();

    await clickApply(wrapper);

    expect(cleanupOnboardingStorageMock).not.toHaveBeenCalled();
    expect(getSummaryVm(wrapper).showApplyResultDialog).toBe(true);
    expect(wrapper.text()).toContain('No Updates Needed');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('advances to next steps before redirecting to the returned defaultUrl after a successful server rename', async () => {
    draftStore.serverName = 'Newtower';
    updateServerIdentityAndResumeMock.mockResolvedValue({
      data: {
        updateServerIdentity: {
          id: 'local',
          name: 'Newtower',
          comment: '',
          defaultUrl: 'https://Newtower.local:4443',
        },
        onboarding: {
          saveOnboardingDraft: true,
        },
      },
    });
    mockLocation.hostname = 'tower.local';
    mockLocation.pathname = '/Dashboard';
    mockLocation.search = '?foo=bar';
    mockLocation.hash = '#section';
    const { wrapper, onComplete } = mountComponent();

    await clickApply(wrapper);

    expect(updateServerIdentityAndResumeMock).toHaveBeenCalledWith({
      name: 'Newtower',
      comment: '',
      sysModel: undefined,
      input: buildExpectedResumeInput('Newtower'),
    });
    expect(onComplete).not.toHaveBeenCalled();
    expect(getSummaryVm(wrapper).applyResultFollowUpMessage).toContain(
      'Your server name has been updated. The page may reload or prompt you to sign in again.'
    );
    expect(wrapper.text()).toContain(
      'Your server name has been updated. The page may reload or prompt you to sign in again.'
    );

    await clickButtonByText(wrapper, 'OK');

    expect(onComplete).not.toHaveBeenCalled();
    expect(mockLocation.replace).toHaveBeenCalledWith(
      'https://newtower.local:4443/Dashboard?foo=bar#section'
    );
    expect(mockLocation.reload).not.toHaveBeenCalled();
  });

  it('does not redirect after a non-rename server identity update succeeds', async () => {
    draftStore.serverDescription = 'Primary host';
    const { wrapper, onComplete } = mountComponent();

    await clickApply(wrapper);
    await clickButtonByText(wrapper, 'OK');

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(mockLocation.replace).not.toHaveBeenCalled();
    expect(mockLocation.reload).not.toHaveBeenCalled();
  });

  it('shows a loading state while waiting to reconnect after a successful server rename', async () => {
    draftStore.serverName = 'Newtower';
    updateServerIdentityAndResumeMock.mockResolvedValue({
      data: {
        updateServerIdentity: {
          id: 'local',
          name: 'Newtower',
          comment: '',
          defaultUrl: 'https://Newtower.local:4443',
        },
        onboarding: {
          saveOnboardingDraft: true,
        },
      },
    });

    const { wrapper, onComplete } = mountComponent();

    await clickApply(wrapper);

    const confirmPromise = getSummaryVm(wrapper).handleApplyResultConfirm();
    await flushPromises();

    expect(wrapper.find('[data-testid="onboarding-loading-state"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Refreshing your connection');
    expect(wrapper.text()).toContain(
      'Your server name has been updated. The page may reload or prompt you to sign in again.'
    );
    expect(onComplete).not.toHaveBeenCalled();
    expect(mockLocation.replace).toHaveBeenCalledWith('https://newtower.local:4443/');
    expect(mockLocation.reload).not.toHaveBeenCalled();

    await confirmPromise;
    await flushPromises();

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('reloads the current page instead of redirecting when the user is on an IP-based URL', async () => {
    draftStore.serverName = 'Newtower';
    mockLocation.origin = 'http://192.168.1.2';
    mockLocation.hostname = '192.168.1.2';
    mockLocation.pathname = '/Dashboard';
    mockLocation.search = '?foo=bar';
    mockLocation.hash = '#section';

    const { wrapper, onComplete } = mountComponent();

    await clickApply(wrapper);
    await clickButtonByText(wrapper, 'OK');

    expect(onComplete).not.toHaveBeenCalled();
    expect(mockLocation.reload).not.toHaveBeenCalled();
    expect(mockLocation.replace).toHaveBeenCalledWith('http://192.168.1.2/Dashboard?foo=bar#section');
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
    updateServerIdentityAndResumeMock.mockRejectedValue(
      new Error('Server name contains invalid characters')
    );
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

  it('continues and classifies warnings when server identity mutation rejects invalid input', async () => {
    draftStore.serverName = 'bad name!';
    updateServerIdentityAndResumeMock.mockRejectedValue(
      new Error('Server name contains invalid characters')
    );

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
    expect(wrapper.find('[data-testid="boot-configuration-summary"]').exists()).toBe(true);
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
      devices: [
        createBootDevice('DISK-A', 500 * 1024 * 1024 * 1024, 'sda'),
        createBootDevice('DISK-B', 250 * 1024 * 1024 * 1024, 'sdb'),
      ],
      bootSizeMiB: 16384,
      updateBios: true,
      poolMode: 'hybrid',
    };

    const { wrapper } = mountComponent();

    expect(wrapper.find('[data-testid="boot-configuration-summary"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('DISK-A - 537 GB (sda)');
    expect(wrapper.text()).toContain('DISK-B - 268 GB (sdb)');
  });

  it('shows an inline warning and blocks apply when boot configuration is incomplete', () => {
    draftStore.bootMode = 'storage';
    draftStore.internalBootSelection = {
      poolName: '',
      slotCount: 1,
      devices: [createBootDevice('DISK-A', 500 * 1024 * 1024 * 1024, 'sda')],
      bootSizeMiB: 16384,
      updateBios: true,
      poolMode: 'hybrid',
    };

    const { wrapper } = mountComponent();
    const buttons = wrapper.findAll('[data-testid="brand-button"]');
    const applyButton = buttons[buttons.length - 1];

    expect(wrapper.find('[data-testid="boot-configuration-summary"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="boot-configuration-summary-invalid"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('This boot configuration is incomplete.');
    expect(applyButton.attributes('disabled')).toBeDefined();
  });

  it('requires confirmation before applying storage boot drive changes', async () => {
    draftStore.bootMode = 'storage';
    draftStore.internalBootSelection = {
      poolName: 'cache',
      slotCount: 1,
      devices: [createBootDevice('DISK-A', 500 * 1024 * 1024 * 1024, 'sda')],
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

  it('ignores stale storage selection data when internal boot is now usb', async () => {
    draftStore.bootMode = 'usb';
    draftStore.internalBootSkipped = false;
    draftStore.internalBootSelection = {
      poolName: 'cache',
      slotCount: 1,
      devices: [createBootDevice('DISK-A', 500 * 1024 * 1024 * 1024, 'sda')],
      bootSizeMiB: 16384,
      updateBios: true,
      poolMode: 'hybrid',
    };

    const { wrapper } = mountComponent();
    await clickApply(wrapper);

    expect(applyInternalBootSelectionMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Boot Method');
    expect(wrapper.text()).toContain('USB/Flash Drive');
    expect(wrapper.text()).toContain('Setup Applied');
  });

  it('applies internal boot configuration without reboot and records success', async () => {
    draftStore.bootMode = 'storage';
    draftStore.internalBootSelection = {
      poolName: 'cache',
      slotCount: 2,
      devices: [
        createBootDevice('DISK-A', 500 * 1024 * 1024 * 1024, 'sda'),
        createBootDevice('DISK-B', 250 * 1024 * 1024 * 1024, 'sdb'),
      ],
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
      devices: [createBootDevice('DISK-A', 500 * 1024 * 1024 * 1024, 'sda')],
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
      devices: [createBootDevice('DISK-A', 500 * 1024 * 1024 * 1024, 'sda')],
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
