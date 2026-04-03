import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OnboardingWizardDraft } from '~/components/Onboarding/onboardingWizardState';
import type { StepId } from '~/components/Onboarding/stepRegistry';

import { SAVE_ONBOARDING_DRAFT_MUTATION } from '~/components/Onboarding/graphql/saveOnboardingDraft.mutation';
import OnboardingModal from '~/components/Onboarding/OnboardingModal.vue';
import { createTestI18n } from '../../utils/i18n';

const {
  wizardRef,
  onboardingContextLoading,
  onboardingModalStoreState,
  activationCodeDataStore,
  onboardingStatusStore,
  purchaseStore,
  serverStore,
  themeStore,
  saveOnboardingDraftMock,
  cleanupOnboardingStorageMock,
  stepperPropsRef,
} = vi.hoisted(() => ({
  wizardRef: {
    value: {
      currentStepId: 'OVERVIEW' as StepId,
      visibleStepIds: ['OVERVIEW', 'CONFIGURE_SETTINGS', 'ADD_PLUGINS', 'SUMMARY', 'NEXT_STEPS'],
      draft: {} as OnboardingWizardDraft,
      internalBootState: {
        applyAttempted: false,
        applySucceeded: false,
      },
    },
  },
  onboardingContextLoading: { value: false },
  onboardingModalStoreState: {
    isVisible: { value: true },
    sessionSource: { value: 'automatic' as 'automatic' | 'manual' },
    closeModal: vi.fn().mockResolvedValue(true),
  },
  activationCodeDataStore: {
    activationRequired: { value: false },
    hasActivationCode: { value: true },
  },
  onboardingStatusStore: {
    isVersionDrift: { value: false },
    completedAtVersion: { value: null as string | null },
    canDisplayOnboardingModal: { value: true },
  },
  purchaseStore: {
    generateUrl: vi.fn(() => 'https://example.com/activate'),
    openInNewTab: true,
  },
  serverStore: {
    keyfile: { value: null },
  },
  themeStore: {
    fetchTheme: vi.fn().mockResolvedValue(undefined),
  },
  saveOnboardingDraftMock: vi.fn(),
  cleanupOnboardingStorageMock: vi.fn(),
  stepperPropsRef: { value: null as Record<string, unknown> | null },
}));

vi.mock('pinia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pinia')>();
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => store,
  };
});

vi.mock('@unraid/ui', () => ({
  Dialog: {
    name: 'Dialog',
    props: ['modelValue', 'showCloseButton', 'size'],
    emits: ['update:modelValue'],
    template: '<div v-if="modelValue" data-testid="dialog"><slot /></div>',
  },
}));

vi.mock('@heroicons/vue/24/solid', () => ({
  ArrowTopRightOnSquareIcon: { template: '<svg />' },
  XMarkIcon: { template: '<svg />' },
}));

vi.mock('~/components/Onboarding/components/OnboardingLoadingState.vue', () => ({
  default: {
    props: ['title', 'description'],
    template:
      '<div data-testid="onboarding-loading-state"><div>{{ title }}</div><div>{{ description }}</div></div>',
  },
}));

vi.mock('~/components/Onboarding/OnboardingSteps.vue', () => ({
  default: {
    props: ['steps', 'activeStepIndex', 'onStepClick'],
    setup(props: Record<string, unknown>) {
      stepperPropsRef.value = props;
      return { props };
    },
    template: `
      <div data-testid="onboarding-steps">{{ props.steps.map((step) => step.id).join(",") }}|{{ props.activeStepIndex }}</div>
      <button data-testid="onboarding-steps-click-0" @click="props.onStepClick?.(0)">step-0</button>
    `,
  },
}));

vi.mock('~/components/Onboarding/stepRegistry', () => ({
  STEP_IDS: [
    'OVERVIEW',
    'CONFIGURE_SETTINGS',
    'CONFIGURE_BOOT',
    'ADD_PLUGINS',
    'ACTIVATE_LICENSE',
    'SUMMARY',
    'NEXT_STEPS',
  ],
  stepComponents: {
    OVERVIEW: {
      props: ['onComplete', 'onSkipSetup', 'saveError'],
      template:
        '<div data-testid="overview-step"><div data-testid="overview-step-error">{{ saveError }}</div><button data-testid="overview-step-complete" @click="onComplete()">next</button><button data-testid="overview-step-skip" @click="onSkipSetup()">skip</button></div>',
    },
    CONFIGURE_SETTINGS: {
      props: [
        'initialDraft',
        'onComplete',
        'onBack',
        'onCloseOnboarding',
        'showBack',
        'isSavingStep',
        'saveError',
      ],
      template: `
        <div data-testid="settings-step">
          <div data-testid="settings-step-error">{{ saveError }}</div>
          <button data-testid="settings-step-complete" @click="onComplete({ serverName: 'Tower', useSsh: true })">next</button>
          <button v-if="showBack" data-testid="settings-step-back" @click="onBack({ serverName: 'Tower', useSsh: true })">back</button>
          <button data-testid="settings-step-close" @click="onCloseOnboarding?.()">close</button>
        </div>
      `,
    },
    CONFIGURE_BOOT: {
      props: ['initialDraft', 'onComplete', 'onBack', 'onCloseOnboarding', 'showBack', 'saveError'],
      template: `
        <div data-testid="internal-boot-step">
          <div data-testid="internal-boot-step-error">{{ saveError }}</div>
          <button
            data-testid="internal-boot-step-complete"
            @click="onComplete({
              bootMode: 'storage',
              skipped: false,
              selection: {
                poolName: 'cache',
                slotCount: 1,
                devices: [{ id: 'DISK-A', sizeBytes: 500 * 1024 * 1024 * 1024, deviceName: 'sda' }],
                bootSizeMiB: 16384,
                updateBios: true,
                poolMode: 'hybrid',
              },
            })"
          >
            next
          </button>
          <button v-if="showBack" data-testid="internal-boot-step-back" @click="onBack({ bootMode: 'usb', skipped: true, selection: null })">back</button>
        </div>
      `,
    },
    ADD_PLUGINS: {
      props: [
        'initialDraft',
        'onComplete',
        'onSkip',
        'onBack',
        'onCloseOnboarding',
        'showBack',
        'saveError',
      ],
      template: `
        <div data-testid="plugins-step">
          <div data-testid="plugins-step-error">{{ saveError }}</div>
          <button data-testid="plugins-step-complete" @click="onComplete({ selectedIds: ['community-apps'] })">next</button>
          <button data-testid="plugins-step-skip" @click="onSkip?.({ selectedIds: [] })">skip</button>
          <button v-if="showBack" data-testid="plugins-step-back" @click="onBack({ selectedIds: ['community-apps'] })">back</button>
        </div>
      `,
    },
    ACTIVATE_LICENSE: {
      props: ['onComplete', 'onBack', 'showBack', 'saveError'],
      template:
        '<div data-testid="license-step"><div data-testid="license-step-error">{{ saveError }}</div><button data-testid="license-step-complete" @click="onComplete()">next</button><button v-if="showBack" data-testid="license-step-back" @click="onBack()">back</button></div>',
    },
    SUMMARY: {
      props: [
        'draft',
        'internalBootState',
        'onInternalBootStateChange',
        'onComplete',
        'onBack',
        'onCloseOnboarding',
        'showBack',
        'saveError',
      ],
      template: `
        <div data-testid="summary-step">
          <div data-testid="summary-step-error">{{ saveError }}</div>
          <button data-testid="summary-step-mark-locked" @click="onInternalBootStateChange({ applyAttempted: true, applySucceeded: true })">lock</button>
          <button data-testid="summary-step-complete" @click="onComplete()">next</button>
          <button v-if="showBack" data-testid="summary-step-back" @click="onBack()">back</button>
        </div>
      `,
    },
    NEXT_STEPS: {
      props: ['draft', 'internalBootState', 'onComplete', 'onBack', 'showBack'],
      template: `
        <div data-testid="next-step">
          <button data-testid="next-step-complete" @click="onComplete()">finish</button>
          <button v-if="showBack" data-testid="next-step-back" @click="onBack()">back</button>
        </div>
      `,
    },
  },
}));

vi.mock('~/components/Onboarding/store/onboardingModalVisibility', () => ({
  useOnboardingModalStore: () => onboardingModalStoreState,
}));

vi.mock('~/components/Onboarding/store/activationCodeData', () => ({
  useActivationCodeDataStore: () => activationCodeDataStore,
}));

vi.mock('~/components/Onboarding/store/onboardingContextData', () => ({
  useOnboardingContextDataStore: () => ({
    wizard: wizardRef,
    loading: onboardingContextLoading,
  }),
}));

vi.mock('~/components/Onboarding/store/onboardingStatus', () => ({
  useOnboardingStore: () => onboardingStatusStore,
}));

vi.mock('~/store/purchase', () => ({
  usePurchaseStore: () => purchaseStore,
}));

vi.mock('~/store/server', () => ({
  useServerStore: () => serverStore,
}));

vi.mock('~/store/theme', () => ({
  useThemeStore: () => themeStore,
}));

vi.mock('~/components/Onboarding/store/onboardingStorageCleanup', () => ({
  cleanupOnboardingStorage: cleanupOnboardingStorageMock,
}));

vi.mock('@vue/apollo-composable', async () => {
  const actual =
    await vi.importActual<typeof import('@vue/apollo-composable')>('@vue/apollo-composable');
  return {
    ...actual,
    useMutation: (document: unknown) => {
      if (document === SAVE_ONBOARDING_DRAFT_MUTATION) {
        return {
          mutate: saveOnboardingDraftMock,
        };
      }

      return {
        mutate: vi.fn(),
      };
    },
  };
});

const mountComponent = () =>
  mount(OnboardingModal, {
    global: {
      plugins: [createTestI18n()],
    },
  });

const findButtonByText = (wrapper: ReturnType<typeof mountComponent>, text: string) =>
  wrapper.findAll('button').find((button) => button.text().trim().toLowerCase() === text.toLowerCase());

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return { promise, resolve, reject };
};

describe('OnboardingModal.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onboardingModalStoreState.isVisible.value = true;
    onboardingModalStoreState.sessionSource.value = 'automatic';
    onboardingStatusStore.canDisplayOnboardingModal.value = true;
    onboardingContextLoading.value = false;
    wizardRef.value = {
      currentStepId: 'OVERVIEW',
      visibleStepIds: ['OVERVIEW', 'CONFIGURE_SETTINGS', 'ADD_PLUGINS', 'SUMMARY', 'NEXT_STEPS'],
      draft: {},
      internalBootState: {
        applyAttempted: false,
        applySucceeded: false,
      },
    };
    saveOnboardingDraftMock.mockResolvedValue({
      data: {
        onboarding: {
          saveOnboardingDraft: true,
        },
      },
    });
  });

  it('renders the current step from bootstrap wizard state', async () => {
    wizardRef.value = {
      currentStepId: 'CONFIGURE_SETTINGS',
      visibleStepIds: ['OVERVIEW', 'CONFIGURE_SETTINGS', 'ADD_PLUGINS'],
      draft: {
        coreSettings: {
          serverName: 'Tower',
        },
      },
      internalBootState: {
        applyAttempted: false,
        applySucceeded: false,
      },
    };

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="settings-step"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="onboarding-steps"]').text()).toContain(
      'OVERVIEW,CONFIGURE_SETTINGS,ADD_PLUGINS|1'
    );
  });

  it('normalizes JSON bootstrap draft data before re-saving step transitions', async () => {
    wizardRef.value = {
      currentStepId: 'CONFIGURE_SETTINGS',
      visibleStepIds: ['OVERVIEW', 'CONFIGURE_SETTINGS', 'ADD_PLUGINS', 'SUMMARY'],
      draft: {
        coreSettings: {
          serverName: ' Existing Tower ',
          useSsh: 'nope',
        },
        plugins: {
          selectedIds: ['community.applications', 42],
        },
        internalBoot: {
          bootMode: 'storage',
          skipped: false,
          selection: {
            poolName: 'cache',
            slotCount: '2',
            devices: [{ id: 'DISK-A', sizeBytes: 500 * 1024 * 1024 * 1024, deviceName: 'sda' }, null],
            bootSizeMiB: 16384,
            updateBios: true,
            poolMode: 'hybrid',
          },
        },
      } as unknown as OnboardingWizardDraft,
      internalBootState: {
        applyAttempted: false,
        applySucceeded: false,
      },
    };

    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.get('[data-testid="settings-step-complete"]').trigger('click');
    await flushPromises();

    expect(saveOnboardingDraftMock).toHaveBeenCalledWith({
      input: {
        draft: {
          coreSettings: {
            serverName: 'Tower',
            useSsh: true,
          },
          plugins: {
            selectedIds: ['community.applications'],
          },
          internalBoot: {
            bootMode: 'storage',
            skipped: false,
            selection: {
              poolName: 'cache',
              slotCount: 2,
              devices: [{ id: 'DISK-A', sizeBytes: 500 * 1024 * 1024 * 1024, deviceName: 'sda' }],
              bootSizeMiB: 16384,
              updateBios: true,
              poolMode: 'hybrid',
            },
          },
        },
        navigation: {
          currentStepId: 'ADD_PLUGINS',
        },
        internalBootState: {
          applyAttempted: false,
          applySucceeded: false,
        },
      },
    });
  });

  it('falls forward to the nearest visible step when the saved step is no longer visible', async () => {
    wizardRef.value = {
      currentStepId: 'CONFIGURE_BOOT',
      visibleStepIds: ['OVERVIEW', 'CONFIGURE_SETTINGS', 'ADD_PLUGINS', 'SUMMARY'],
      draft: {},
      internalBootState: {
        applyAttempted: false,
        applySucceeded: false,
      },
    };

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.find('[data-testid="plugins-step"]').exists()).toBe(true);
  });

  it('persists step transitions with nested draft data before navigating', async () => {
    wizardRef.value = {
      currentStepId: 'CONFIGURE_SETTINGS',
      visibleStepIds: ['OVERVIEW', 'CONFIGURE_SETTINGS', 'ADD_PLUGINS', 'SUMMARY'],
      draft: {},
      internalBootState: {
        applyAttempted: false,
        applySucceeded: false,
      },
    };

    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.get('[data-testid="settings-step-complete"]').trigger('click');
    await flushPromises();

    expect(saveOnboardingDraftMock).toHaveBeenCalledTimes(1);
    expect(saveOnboardingDraftMock).toHaveBeenCalledWith({
      input: {
        draft: {
          coreSettings: {
            serverName: 'Tower',
            useSsh: true,
          },
          plugins: undefined,
          internalBoot: undefined,
        },
        navigation: {
          currentStepId: 'ADD_PLUGINS',
        },
        internalBootState: {
          applyAttempted: false,
          applySucceeded: false,
        },
      },
    });
    expect(wrapper.find('[data-testid="plugins-step"]').exists()).toBe(true);
  });

  it('ignores stepper navigation while a transition save is still in flight', async () => {
    wizardRef.value = {
      currentStepId: 'CONFIGURE_SETTINGS',
      visibleStepIds: ['OVERVIEW', 'CONFIGURE_SETTINGS', 'ADD_PLUGINS', 'SUMMARY'],
      draft: {},
      internalBootState: {
        applyAttempted: false,
        applySucceeded: false,
      },
    };

    const deferred = createDeferred<{ data: { onboarding: { saveOnboardingDraft: boolean } } }>();
    saveOnboardingDraftMock.mockReturnValueOnce(deferred.promise);

    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.get('[data-testid="settings-step-complete"]').trigger('click');
    await flushPromises();

    expect(saveOnboardingDraftMock).toHaveBeenCalledTimes(1);
    expect(wrapper.find('[data-testid="settings-step"]').exists()).toBe(true);

    await wrapper.get('[data-testid="onboarding-steps-click-0"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="settings-step"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="overview-step"]').exists()).toBe(false);

    deferred.resolve({
      data: {
        onboarding: {
          saveOnboardingDraft: true,
        },
      },
    });
    await flushPromises();

    expect(wrapper.find('[data-testid="plugins-step"]').exists()).toBe(true);
  });

  it('blocks navigation and offers a close path when a save fails', async () => {
    wizardRef.value = {
      currentStepId: 'CONFIGURE_SETTINGS',
      visibleStepIds: ['OVERVIEW', 'CONFIGURE_SETTINGS', 'ADD_PLUGINS'],
      draft: {},
      internalBootState: {
        applyAttempted: false,
        applySucceeded: false,
      },
    };
    saveOnboardingDraftMock.mockRejectedValueOnce(new Error('offline'));

    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.get('[data-testid="settings-step-complete"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="settings-step"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="settings-step-error"]').text()).not.toBe('');
    expect(
      wrapper.text().match(/We couldn't finish onboarding right now\. Please try again\./g)?.length ?? 0
    ).toBe(1);

    await wrapper.find('button[aria-label="Close onboarding"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Exit onboarding?');

    const exitButton = findButtonByText(wrapper, 'Exit setup');
    expect(exitButton).toBeTruthy();
    await exitButton!.trigger('click');
    await flushPromises();

    expect(onboardingModalStoreState.closeModal).toHaveBeenCalledWith();
  });

  it('opens exit confirmation and closes through the backend-owned close path', async () => {
    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => undefined);
    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.find('button[aria-label="Close onboarding"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Exit onboarding?');

    const exitButton = findButtonByText(wrapper, 'Exit setup');
    expect(exitButton).toBeTruthy();
    await exitButton!.trigger('click');
    await flushPromises();

    expect(onboardingModalStoreState.closeModal).toHaveBeenCalledWith();
    expect(cleanupOnboardingStorageMock).toHaveBeenCalledTimes(1);
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('reuses the existing exit flow when a step requests close onboarding', async () => {
    wizardRef.value = {
      currentStepId: 'CONFIGURE_SETTINGS',
      visibleStepIds: ['OVERVIEW', 'CONFIGURE_SETTINGS', 'ADD_PLUGINS'],
      draft: {},
      internalBootState: {
        applyAttempted: false,
        applySucceeded: false,
      },
    };

    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.get('[data-testid="settings-step-close"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Exit onboarding?');
    expect(onboardingModalStoreState.closeModal).not.toHaveBeenCalled();
  });

  it('hides exit controls and back navigation when internal boot is locked', async () => {
    wizardRef.value = {
      currentStepId: 'CONFIGURE_SETTINGS',
      visibleStepIds: ['OVERVIEW', 'CONFIGURE_SETTINGS', 'SUMMARY'],
      draft: {},
      internalBootState: {
        applyAttempted: true,
        applySucceeded: true,
      },
    };

    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.find('button[aria-label="Close onboarding"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="settings-step-back"]').exists()).toBe(false);
  });

  it('carries summary-owned internal boot state into the next save', async () => {
    wizardRef.value = {
      currentStepId: 'SUMMARY',
      visibleStepIds: ['OVERVIEW', 'SUMMARY', 'NEXT_STEPS'],
      draft: {},
      internalBootState: {
        applyAttempted: false,
        applySucceeded: false,
      },
    };

    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.get('[data-testid="summary-step-mark-locked"]').trigger('click');
    await wrapper.get('[data-testid="summary-step-complete"]').trigger('click');
    await flushPromises();

    expect(saveOnboardingDraftMock).toHaveBeenCalledWith({
      input: {
        draft: {
          coreSettings: undefined,
          plugins: undefined,
          internalBoot: undefined,
        },
        navigation: {
          currentStepId: 'NEXT_STEPS',
        },
        internalBootState: {
          applyAttempted: true,
          applySucceeded: true,
        },
      },
    });
    expect(wrapper.find('[data-testid="next-step"]').exists()).toBe(true);
  });

  it('closes from the final step without saving again', async () => {
    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => undefined);
    wizardRef.value = {
      currentStepId: 'NEXT_STEPS',
      visibleStepIds: ['OVERVIEW', 'NEXT_STEPS'],
      draft: {},
      internalBootState: {
        applyAttempted: false,
        applySucceeded: false,
      },
    };

    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.get('[data-testid="next-step-complete"]').trigger('click');
    await flushPromises();

    expect(saveOnboardingDraftMock).not.toHaveBeenCalled();
    expect(onboardingModalStoreState.closeModal).toHaveBeenCalledWith();
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });
});
