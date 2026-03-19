import { createApp, defineComponent, ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useMutation } from '@vue/apollo-composable';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OperationVariables } from '@apollo/client/core';
import type { UseMutationReturn } from '@vue/apollo-composable';
import type { App } from 'vue';

import { BYPASS_ONBOARDING_MUTATION } from '~/components/Onboarding/graphql/bypassOnboarding.mutation';
import { CLOSE_ONBOARDING_MUTATION } from '~/components/Onboarding/graphql/closeOnboarding.mutation';
import { OPEN_ONBOARDING_MUTATION } from '~/components/Onboarding/graphql/openOnboarding.mutation';
import { RESUME_ONBOARDING_MUTATION } from '~/components/Onboarding/graphql/resumeOnboarding.mutation';
import { useOnboardingDraftStore } from '~/components/Onboarding/store/onboardingDraft';
import { useOnboardingModalStore } from '~/components/Onboarding/store/onboardingModalVisibility';
import { useOnboardingStore } from '~/components/Onboarding/store/onboardingStatus.js';
import { useCallbackActionsStore } from '~/store/callbackActions';

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(),
}));

vi.mock('~/store/callbackActions', () => ({
  useCallbackActionsStore: vi.fn(),
}));

vi.mock('~/components/Onboarding/store/onboardingStatus', () => ({
  useOnboardingStore: vi.fn(),
}));

describe('OnboardingModalVisibility Store', () => {
  let store: ReturnType<typeof useOnboardingModalStore>;
  let mockShouldOpen: ReturnType<typeof ref>;
  let mockCanDisplayOnboardingModal: ReturnType<typeof ref>;
  let mockCallbackData: ReturnType<typeof ref>;
  let app: App<Element> | null = null;
  let mountTarget: HTMLElement | null = null;

  const openMutationMock = vi.fn();
  const closeMutationMock = vi.fn();
  const bypassMutationMock = vi.fn();
  const resumeMutationMock = vi.fn();
  const refetchOnboardingMock = vi.fn();

  const createMutationReturn = (
    mutateEffect: () => Promise<void>
  ): UseMutationReturn<unknown, OperationVariables> => ({
    mutate: async () => {
      await mutateEffect();
      return null;
    },
    loading: ref(false),
    error: ref(null),
    called: ref(false),
    onDone: () => ({ off: vi.fn() }),
    onError: () => ({ off: vi.fn() }),
  });

  const mountStoreHost = () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const TestHost = defineComponent({
      setup() {
        store = useOnboardingModalStore();
        return () => null;
      },
    });

    mountTarget = document.createElement('div');
    app = createApp(TestHost);
    app.use(pinia);
    app.mount(mountTarget);
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-19T12:00:00.000Z'));
    vi.clearAllMocks();

    mockShouldOpen = ref(false);
    mockCanDisplayOnboardingModal = ref(true);
    mockCallbackData = ref(null);

    vi.mocked(useMutation).mockImplementation((document) => {
      if (document === OPEN_ONBOARDING_MUTATION) {
        return createMutationReturn(
          openMutationMock.mockImplementation(async () => {
            mockShouldOpen.value = true;
          })
        );
      }

      if (document === CLOSE_ONBOARDING_MUTATION) {
        return createMutationReturn(
          closeMutationMock.mockImplementation(async () => {
            mockShouldOpen.value = false;
          })
        );
      }

      if (document === BYPASS_ONBOARDING_MUTATION) {
        return createMutationReturn(
          bypassMutationMock.mockImplementation(async () => {
            mockShouldOpen.value = false;
          })
        );
      }

      if (document === RESUME_ONBOARDING_MUTATION) {
        return createMutationReturn(
          resumeMutationMock.mockImplementation(async () => {
            mockShouldOpen.value = true;
          })
        );
      }

      return createMutationReturn(vi.fn());
    });

    vi.mocked(useOnboardingStore).mockReturnValue({
      shouldOpen: mockShouldOpen,
      canDisplayOnboardingModal: mockCanDisplayOnboardingModal,
      refetchOnboarding: refetchOnboardingMock,
    } as unknown as ReturnType<typeof useOnboardingStore>);

    vi.mocked(useCallbackActionsStore).mockReturnValue({
      callbackData: mockCallbackData,
    } as unknown as ReturnType<typeof useCallbackActionsStore>);

    refetchOnboardingMock.mockResolvedValue(undefined);
    window.history.replaceState({}, '', '/Dashboard');
    mountStoreHost();
  });

  afterEach(() => {
    if (app) {
      app.unmount();
      app = null;
    }
    mountTarget = null;
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('reflects backend visibility when no local bypass or callback gating applies', () => {
    mockShouldOpen.value = true;

    expect(store.isVisible).toBe(true);

    mockCallbackData.value = { foo: 'bar' };
    expect(store.isVisible).toBe(false);
  });

  it('forces onboarding open through the backend mutation', async () => {
    await expect(store.forceOpenModal()).resolves.toBe(true);

    expect(openMutationMock).toHaveBeenCalledTimes(1);
    expect(refetchOnboardingMock).toHaveBeenCalledTimes(1);
    expect(store.isVisible).toBe(true);
  });

  it('closes onboarding through the backend mutation', async () => {
    mockShouldOpen.value = true;

    await expect(store.closeModal()).resolves.toBe(true);

    expect(closeMutationMock).toHaveBeenCalledTimes(1);
    expect(refetchOnboardingMock).toHaveBeenCalledTimes(1);
    expect(store.isVisible).toBe(false);
  });

  it('does not force-open when modal display is unavailable', async () => {
    mockCanDisplayOnboardingModal.value = false;

    await expect(store.forceOpenModal()).resolves.toBe(false);
    expect(openMutationMock).not.toHaveBeenCalled();
    expect(refetchOnboardingMock).not.toHaveBeenCalled();
  });

  it('applies keyboard shortcut bypass through the backend mutation', () => {
    const draftStore = useOnboardingDraftStore();
    draftStore.setCoreSettings({
      serverName: 'tower',
      serverDescription: 'resume me',
      timeZone: 'UTC',
      theme: 'black',
      language: 'en_US',
      useSsh: true,
    });
    draftStore.setCurrentStep('CONFIGURE_BOOT', 2);
    mockShouldOpen.value = true;

    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'o',
        code: 'KeyO',
        ctrlKey: true,
        altKey: true,
        shiftKey: true,
      })
    );

    return vi.waitFor(() => {
      expect(bypassMutationMock).toHaveBeenCalledTimes(1);
      expect(refetchOnboardingMock).toHaveBeenCalledTimes(1);
      expect(store.isVisible).toBe(false);
      expect(draftStore.hasResumableDraft).toBe(false);
    });
  });

  it('opens onboarding through the backend when ?onboarding=open is present', async () => {
    if (app) {
      app.unmount();
      app = null;
    }

    window.history.replaceState({}, '', '/Dashboard?onboarding=open');
    mountStoreHost();

    await vi.waitFor(() => {
      expect(openMutationMock).toHaveBeenCalledTimes(1);
    });
    await vi.waitFor(() => {
      expect(window.location.search).toBe('');
    });
  });

  it('clears bypass on ?onboarding=resume without forcing open', async () => {
    if (app) {
      app.unmount();
      app = null;
    }

    window.history.replaceState({}, '', '/Dashboard?onboarding=resume');
    mountStoreHost();

    await vi.waitFor(() => {
      expect(resumeMutationMock).toHaveBeenCalledTimes(1);
      expect(refetchOnboardingMock).toHaveBeenCalledTimes(1);
    });
    expect(openMutationMock).not.toHaveBeenCalled();
    expect(window.location.search).toBe('');
  });
});
