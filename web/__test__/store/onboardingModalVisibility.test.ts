import { createApp, defineComponent, nextTick, ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useSessionStorage } from '@vueuse/core';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { App } from 'vue';

import {
  ONBOARDING_MODAL_HIDDEN_STORAGE_KEY,
  ONBOARDING_TEMP_BYPASS_STORAGE_KEY,
} from '~/components/Onboarding/constants';
import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import { useOnboardingModalStore } from '~/components/Onboarding/store/onboardingModalVisibility';
import { useOnboardingStore } from '~/components/Onboarding/store/onboardingStatus.js';
import { useCallbackActionsStore } from '~/store/callbackActions';
import { useServerStore } from '~/store/server';

vi.mock('@vueuse/core', () => ({
  useSessionStorage: vi.fn(),
}));

vi.mock('~/components/Onboarding/store/activationCodeData', () => ({
  useActivationCodeDataStore: vi.fn(),
}));

vi.mock('~/store/callbackActions', () => ({
  useCallbackActionsStore: vi.fn(),
}));

vi.mock('~/store/server', () => ({
  useServerStore: vi.fn(),
}));

vi.mock('~/components/Onboarding/store/onboardingStatus', () => ({
  useOnboardingStore: vi.fn(),
}));

describe('OnboardingModalVisibility Store', () => {
  let store: ReturnType<typeof useOnboardingModalStore>;
  let mockIsHidden: ReturnType<typeof ref>;
  let mockTemporaryBypassState: ReturnType<typeof ref>;
  let mockIsFreshInstall: ReturnType<typeof ref>;
  let mockCompleted: ReturnType<typeof ref>;
  let mockCallbackData: ReturnType<typeof ref>;
  let mockUptime: ReturnType<typeof ref>;
  let app: App<Element> | null = null;
  let mountTarget: HTMLElement | null = null;

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

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-19T12:00:00.000Z'));
    vi.clearAllMocks();

    mockIsHidden = ref(null);
    mockTemporaryBypassState = ref(null);
    mockIsFreshInstall = ref(false);
    mockCompleted = ref(false);
    mockCallbackData = ref(null);
    mockUptime = ref(3600);

    vi.mocked(useSessionStorage).mockImplementation(((key: unknown, initialValue: unknown) => {
      const storageKey = typeof key === 'string' ? key : '';
      if (storageKey === ONBOARDING_MODAL_HIDDEN_STORAGE_KEY) {
        return mockIsHidden as unknown as ReturnType<typeof useSessionStorage>;
      }
      if (storageKey === ONBOARDING_TEMP_BYPASS_STORAGE_KEY) {
        return mockTemporaryBypassState as unknown as ReturnType<typeof useSessionStorage>;
      }
      return ref(initialValue) as unknown as ReturnType<typeof useSessionStorage>;
    }) as typeof useSessionStorage);

    vi.mocked(useActivationCodeDataStore).mockReturnValue({
      isFreshInstall: mockIsFreshInstall,
    } as unknown as ReturnType<typeof useActivationCodeDataStore>);

    vi.mocked(useOnboardingStore).mockReturnValue({
      completed: mockCompleted,
    } as unknown as ReturnType<typeof useOnboardingStore>);

    vi.mocked(useCallbackActionsStore).mockReturnValue({
      callbackData: mockCallbackData,
    } as unknown as ReturnType<typeof useCallbackActionsStore>);

    vi.mocked(useServerStore).mockReturnValue({
      uptime: mockUptime,
    } as unknown as ReturnType<typeof useServerStore>);

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

  it('initializes hidden and temporary bypass session-storage keys', () => {
    expect(useSessionStorage).toHaveBeenNthCalledWith(1, ONBOARDING_MODAL_HIDDEN_STORAGE_KEY, null);
    expect(useSessionStorage).toHaveBeenNthCalledWith(
      2,
      ONBOARDING_TEMP_BYPASS_STORAGE_KEY,
      null,
      expect.objectContaining({
        serializer: expect.objectContaining({
          read: expect.any(Function),
          write: expect.any(Function),
        }),
      })
    );
  });

  it('sets hidden state directly', () => {
    store.setIsHidden(true);
    expect(mockIsHidden.value).toBe(true);

    store.setIsHidden(false);
    expect(mockIsHidden.value).toBe(false);

    store.setIsHidden(null);
    expect(mockIsHidden.value).toBe(null);
  });

  it('restores automatic visibility without forcing the modal visible', () => {
    store.setIsHidden(false);
    expect(mockIsHidden.value).toBe(false);

    store.resetToAutomaticVisibility();
    expect(mockIsHidden.value).toBe(null);
  });

  it('clears force-open state when hidden is set to true', () => {
    store.forceOpenModal();
    expect(store.isForceOpened).toBe(true);

    store.setIsHidden(true);
    expect(store.isForceOpened).toBe(false);
  });

  it('uses robust serializer for temporary bypass state', () => {
    const call = vi.mocked(useSessionStorage).mock.calls[1];
    const options = call?.[2] as
      | {
          serializer?: {
            read: (value: string) => unknown;
            write: (value: unknown) => string;
          };
        }
      | undefined;

    expect(options?.serializer).toBeDefined();

    const serializer = options!.serializer!;
    expect(serializer.read('[object Object]')).toBe(null);
    expect(serializer.read('')).toBe(null);
    expect(
      serializer.read(
        JSON.stringify({
          active: true,
          bootMarker: 123,
        })
      )
    ).toEqual({ active: true, bootMarker: 123 });
    expect(serializer.write({ active: true, bootMarker: 123 })).toBe(
      JSON.stringify({ active: true, bootMarker: 123 })
    );
  });

  it('applies keyboard shortcut bypass without completing onboarding', () => {
    window.localStorage.setItem('onboardingDraft', '{"currentStepIndex":2}');

    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'o',
        code: 'KeyO',
        ctrlKey: true,
        altKey: true,
        shiftKey: true,
      })
    );

    expect(store.isBypassActive).toBe(true);
    expect(mockIsHidden.value).toBe(true);
    expect(mockTemporaryBypassState.value).toMatchObject({ active: true });
    expect(window.localStorage.getItem('onboardingDraft')).toBeNull();
  });

  it('does not bypass when using 0 key with modifiers', () => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: ')',
        code: 'Digit0',
        metaKey: true,
        altKey: true,
        shiftKey: true,
      })
    );

    expect(store.isBypassActive).toBe(false);
    expect(mockIsHidden.value).toBe(null);
    expect(mockTemporaryBypassState.value).toBe(null);
  });

  it('does not bypass when required modifiers are missing', () => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'o',
        code: 'KeyO',
        metaKey: true,
        altKey: true,
      })
    );

    expect(store.isBypassActive).toBe(false);
    expect(mockIsHidden.value).toBe(null);
    expect(mockTemporaryBypassState.value).toBe(null);
  });

  it('does not bypass on repeated keydown events', () => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'o',
        code: 'KeyO',
        metaKey: true,
        altKey: true,
        shiftKey: true,
        repeat: true,
      })
    );

    expect(store.isBypassActive).toBe(false);
    expect(mockIsHidden.value).toBe(null);
    expect(mockTemporaryBypassState.value).toBe(null);
  });

  it('is visible on fresh install when not hidden or bypassed', () => {
    mockIsFreshInstall.value = true;
    mockIsHidden.value = null;
    mockCallbackData.value = null;

    expect(store.isAutoVisible).toBe(true);
  });

  it('is not visible when temporary bypass is active', () => {
    mockIsFreshInstall.value = true;
    store.setTemporaryBypass(true);

    expect(store.isBypassActive).toBe(true);
    expect(store.isAutoVisible).toBe(false);
  });

  it('supports onboarding=bypass URL param and removes it from URL', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
    const historyState = { source: 'existing-state' };
    window.history.replaceState(historyState, '', '/Dashboard?onboarding=bypass');

    store.applyOnboardingUrlAction();

    expect(store.isBypassActive).toBe(true);
    expect(mockIsHidden.value).toBe(true);
    expect(window.location.search).not.toContain('onboarding=');
    expect(replaceStateSpy).toHaveBeenLastCalledWith(historyState, '', '/Dashboard');
  });

  it('applies onboarding=bypass automatically on mount', () => {
    if (app) {
      app.unmount();
      app = null;
    }

    window.history.replaceState({}, '', '/Dashboard?onboarding=bypass');
    mountStoreHost();

    expect(store.isBypassActive).toBe(true);
    expect(mockIsHidden.value).toBe(true);
    expect(window.location.search).not.toContain('onboarding=');
  });

  it('supports onboarding=resume URL param and removes bypass', () => {
    store.setTemporaryBypass(true);
    mockIsHidden.value = true;
    window.history.replaceState({}, '', '/Dashboard?onboarding=resume');

    store.applyOnboardingUrlAction();

    expect(store.isBypassActive).toBe(false);
    expect(mockTemporaryBypassState.value).toBe(null);
    expect(mockIsHidden.value).toBe(false);
    expect(window.location.search).not.toContain('onboarding=');
  });

  it('supports onboarding=open URL param and removes it from URL', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
    window.history.replaceState({}, '', '/Dashboard?onboarding=open');

    store.applyOnboardingUrlAction();

    expect(store.isForceOpened).toBe(true);
    expect(mockIsHidden.value).toBe(false);
    expect(window.location.search).not.toContain('onboarding=');
    expect(replaceStateSpy).toHaveBeenCalled();
  });

  it('opens when onboarding force-open event is dispatched', () => {
    window.dispatchEvent(new Event('unraid:onboarding:open'));

    expect(store.isForceOpened).toBe(true);
    expect(mockIsHidden.value).toBe(false);
  });

  it('applies onboarding=resume automatically on mount', () => {
    if (app) {
      app.unmount();
      app = null;
    }

    mockTemporaryBypassState.value = { active: true, bootMarker: 0 };
    mockIsHidden.value = true;
    window.history.replaceState({}, '', '/Dashboard?onboarding=resume');
    mountStoreHost();

    expect(store.isBypassActive).toBe(false);
    expect(mockTemporaryBypassState.value).toBe(null);
    expect(mockIsHidden.value).toBe(false);
    expect(window.location.search).not.toContain('onboarding=');
  });

  it('ignores unknown onboarding URL param actions', () => {
    window.history.replaceState({}, '', '/Dashboard?onboarding=unknown');

    store.applyOnboardingUrlAction();

    expect(store.isBypassActive).toBe(false);
    expect(mockTemporaryBypassState.value).toBe(null);
    expect(mockIsHidden.value).toBe(null);
    expect(window.location.search).toContain('onboarding=unknown');
  });

  it('keeps bypass active in-session when uptime is unavailable', async () => {
    mockUptime.value = 0;
    store.setTemporaryBypass(true);
    await nextTick();

    expect(store.isBypassActive).toBe(true);
  });

  it('automatically invalidates bypass when boot marker changes', async () => {
    store.setTemporaryBypass(true);
    expect(store.isBypassActive).toBe(true);

    // Simulate a reboot by drastically changing uptime-derived boot marker.
    mockUptime.value = 120;
    await nextTick();

    expect(store.isBypassActive).toBe(false);
  });
});
