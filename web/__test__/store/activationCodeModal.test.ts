import { createApp, defineComponent, nextTick, ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useSessionStorage } from '@vueuse/core';

import { ACTIVATION_CODE_MODAL_HIDDEN_STORAGE_KEY, ONBOARDING_TEMP_BYPASS_STORAGE_KEY } from '~/consts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { App } from 'vue';

import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import { useActivationCodeModalStore } from '~/components/Onboarding/store/activationCodeModal';
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

describe('ActivationCodeModal Store', () => {
  let store: ReturnType<typeof useActivationCodeModalStore>;
  let mockIsHidden: ReturnType<typeof ref>;
  let mockTemporaryBypassState: ReturnType<typeof ref>;
  let mockIsFreshInstall: ReturnType<typeof ref>;
  let mockCallbackData: ReturnType<typeof ref>;
  let mockUptime: ReturnType<typeof ref>;
  let app: App<Element> | null = null;
  let mountTarget: HTMLElement | null = null;

  const mountStoreHost = () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const TestHost = defineComponent({
      setup() {
        store = useActivationCodeModalStore();
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
    mockCallbackData = ref(null);
    mockUptime = ref(3600);

    vi.mocked(useSessionStorage).mockImplementation(((key: unknown, initialValue: unknown) => {
      const storageKey = typeof key === 'string' ? key : '';
      if (storageKey === ACTIVATION_CODE_MODAL_HIDDEN_STORAGE_KEY) {
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
    expect(useSessionStorage).toHaveBeenNthCalledWith(1, ACTIVATION_CODE_MODAL_HIDDEN_STORAGE_KEY, null);
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

    expect(store.isTemporarilyBypassed).toBe(true);
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

    expect(store.isTemporarilyBypassed).toBe(false);
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

    expect(store.isTemporarilyBypassed).toBe(false);
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

    expect(store.isTemporarilyBypassed).toBe(false);
    expect(mockIsHidden.value).toBe(null);
    expect(mockTemporaryBypassState.value).toBe(null);
  });

  it('is visible on fresh install when not hidden or bypassed', () => {
    mockIsFreshInstall.value = true;
    mockIsHidden.value = null;
    mockCallbackData.value = null;

    expect(store.isVisible).toBe(true);
  });

  it('is not visible when temporary bypass is active', () => {
    mockIsFreshInstall.value = true;
    store.setTemporaryBypass(true);

    expect(store.isTemporarilyBypassed).toBe(true);
    expect(store.isVisible).toBe(false);
  });

  it('supports onboarding=bypass URL param and removes it from URL', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
    window.history.replaceState({}, '', '/Dashboard?onboarding=bypass');

    store.applyBypassFromUrlParam();

    expect(store.isTemporarilyBypassed).toBe(true);
    expect(mockIsHidden.value).toBe(true);
    expect(window.location.search).not.toContain('onboarding=');
    expect(replaceStateSpy).toHaveBeenCalled();
  });

  it('applies onboarding=bypass automatically on mount', () => {
    if (app) {
      app.unmount();
      app = null;
    }

    window.history.replaceState({}, '', '/Dashboard?onboarding=bypass');
    mountStoreHost();

    expect(store.isTemporarilyBypassed).toBe(true);
    expect(mockIsHidden.value).toBe(true);
    expect(window.location.search).not.toContain('onboarding=');
  });

  it('supports onboarding=resume URL param and removes bypass', () => {
    store.setTemporaryBypass(true);
    mockIsHidden.value = true;
    window.history.replaceState({}, '', '/Dashboard?onboarding=resume');

    store.applyBypassFromUrlParam();

    expect(store.isTemporarilyBypassed).toBe(false);
    expect(mockTemporaryBypassState.value).toBe(null);
    expect(mockIsHidden.value).toBe(false);
    expect(window.location.search).not.toContain('onboarding=');
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

    expect(store.isTemporarilyBypassed).toBe(false);
    expect(mockTemporaryBypassState.value).toBe(null);
    expect(mockIsHidden.value).toBe(false);
    expect(window.location.search).not.toContain('onboarding=');
  });

  it('ignores unknown onboarding URL param actions', () => {
    window.history.replaceState({}, '', '/Dashboard?onboarding=unknown');

    store.applyBypassFromUrlParam();

    expect(store.isTemporarilyBypassed).toBe(false);
    expect(mockTemporaryBypassState.value).toBe(null);
    expect(mockIsHidden.value).toBe(null);
    expect(window.location.search).toContain('onboarding=unknown');
  });

  it('keeps bypass active in-session when uptime is unavailable', async () => {
    mockUptime.value = 0;
    store.setTemporaryBypass(true);
    await nextTick();

    expect(store.isTemporarilyBypassed).toBe(true);
  });

  it('automatically invalidates bypass when boot marker changes', async () => {
    store.setTemporaryBypass(true);
    expect(store.isTemporarilyBypassed).toBe(true);

    // Simulate a reboot by drastically changing uptime-derived boot marker.
    mockUptime.value = 120;
    await nextTick();

    expect(store.isTemporarilyBypassed).toBe(false);
  });
});
