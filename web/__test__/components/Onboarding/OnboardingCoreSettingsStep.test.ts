import { flushPromises, mount } from '@vue/test-utils';

import { GET_AVAILABLE_LANGUAGES_QUERY } from '@/components/Onboarding/graphql/availableLanguages.query';
import { GET_CORE_SETTINGS_QUERY } from '@/components/Onboarding/graphql/getCoreSettings.query';
import { TIME_ZONE_OPTIONS_QUERY } from '@/components/Onboarding/graphql/timeZoneOptions.query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import OnboardingCoreSettingsStep from '~/components/Onboarding/steps/OnboardingCoreSettingsStep.vue';
import { createTestI18n } from '../../utils/i18n';

const {
  draftStore,
  setCoreSettingsMock,
  timeZoneOptionsResult,
  languagesResult,
  languagesLoading,
  languagesError,
  coreOnResultHandlers,
  useQueryMock,
} = vi.hoisted(() => ({
  setCoreSettingsMock: vi.fn(),
  draftStore: {
    serverName: '',
    serverDescription: '',
    selectedTimeZone: '',
    selectedTheme: '',
    selectedLanguage: '',
    useSsh: false,
    coreSettingsInitialized: false,
    setCoreSettings: vi.fn(),
  },
  timeZoneOptionsResult: {
    value: {
      timeZoneOptions: [
        { value: 'UTC', label: 'UTC' },
        { value: 'America/New_York', label: 'America/New_York' },
      ],
    },
  },
  languagesResult: {
    value: {
      availableLanguages: [
        { code: 'en_US', name: 'English', url: 'https://example.com/en_US.txz' },
        { code: 'fr_FR', name: 'French', url: 'https://example.com/fr_FR.txz' },
      ],
    },
  },
  languagesLoading: { value: false },
  languagesError: { value: null as unknown },
  coreOnResultHandlers: [] as Array<(payload: unknown) => void>,
  useQueryMock: vi.fn(),
}));

draftStore.setCoreSettings = setCoreSettingsMock;

vi.mock('@unraid/ui', () => ({
  BrandButton: {
    props: ['text', 'disabled'],
    emits: ['click'],
    template:
      '<button data-testid="brand-button" :disabled="disabled" @click="$emit(\'click\')"><slot />{{ text }}</button>',
  },
  Select: {
    props: ['modelValue', 'items', 'disabled'],
    emits: ['update:modelValue'],
    template: `
      <select
        data-testid="select"
        :disabled="disabled"
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option v-for="item in items" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
    `,
  },
}));

vi.mock('@headlessui/vue', () => ({
  Switch: {
    props: ['modelValue', 'disabled'],
    emits: ['update:modelValue'],
    template: `
      <input
        data-testid="switch"
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
    `,
  },
}));

vi.mock('@vvo/tzdb', () => ({
  getTimeZones: () => [
    {
      name: 'UTC',
      alternativeName: 'UTC',
      currentTimeOffsetInMinutes: 0,
      group: ['UTC'],
    },
    {
      name: 'America/New_York',
      alternativeName: 'Eastern Time',
      currentTimeOffsetInMinutes: -300,
      group: ['America/New_York'],
    },
  ],
}));

vi.mock('@/components/Onboarding/store/onboardingDraft', () => ({
  useOnboardingDraftStore: () => draftStore,
}));

vi.mock('@vue/apollo-composable', async () => {
  const actual =
    await vi.importActual<typeof import('@vue/apollo-composable')>('@vue/apollo-composable');
  return {
    ...actual,
    useQuery: useQueryMock,
  };
});

const setupQueryMocks = () => {
  useQueryMock.mockImplementation((doc: unknown) => {
    if (doc === TIME_ZONE_OPTIONS_QUERY) {
      return { result: timeZoneOptionsResult };
    }
    if (doc === GET_CORE_SETTINGS_QUERY) {
      return {
        onResult: (cb: (payload: unknown) => void) => {
          coreOnResultHandlers.push(cb);
        },
      };
    }
    if (doc === GET_AVAILABLE_LANGUAGES_QUERY) {
      return {
        result: languagesResult,
        loading: languagesLoading,
        error: languagesError,
      };
    }
    return { result: { value: null } };
  });
};

const mountComponent = (props: Record<string, unknown> = {}) => {
  const onComplete = vi.fn();
  const wrapper = mount(OnboardingCoreSettingsStep, {
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

describe('OnboardingCoreSettingsStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupQueryMocks();
    coreOnResultHandlers.length = 0;

    draftStore.serverName = '';
    draftStore.serverDescription = '';
    draftStore.selectedTimeZone = '';
    draftStore.selectedTheme = '';
    draftStore.selectedLanguage = '';
    draftStore.useSsh = false;
    draftStore.coreSettingsInitialized = false;

    languagesLoading.value = false;
    languagesError.value = null;
  });

  it('uses trusted defaults when API baseline is unavailable', async () => {
    const { wrapper, onComplete } = mountComponent();
    await flushPromises();

    const submitButton = wrapper.find('[data-testid="brand-button"]');
    await submitButton.trigger('click');
    await flushPromises();

    expect(setCoreSettingsMock).toHaveBeenCalledTimes(1);
    const payload = setCoreSettingsMock.mock.calls[0][0];
    expect(payload.serverName).toBe('Tower');
    expect(payload.serverDescription).toBe('');
    expect(payload.theme).toBe('white');
    expect(payload.language).toBe('en_US');
    expect(typeof payload.timeZone).toBe('string');
    expect(payload.timeZone.length).toBeGreaterThan(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('blocks submission with invalid server name', async () => {
    const { wrapper, onComplete } = mountComponent();
    await flushPromises();

    const coreOnResult = coreOnResultHandlers[0];
    coreOnResult({
      data: {
        server: { name: 'bad name!', comment: '' },
        vars: { name: 'bad name!', useSsh: false, localTld: 'local' },
        display: { theme: 'white', locale: 'en_US' },
        systemTime: { timeZone: 'UTC' },
      },
    });
    await flushPromises();

    const submitButton = wrapper.find('[data-testid="brand-button"]');
    await submitButton.trigger('click');
    await flushPromises();

    expect(setCoreSettingsMock).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('blocks submission with too-long server description', async () => {
    const { wrapper, onComplete } = mountComponent();
    await flushPromises();

    const coreOnResult = coreOnResultHandlers[0];
    coreOnResult({
      data: {
        server: { name: 'Tower', comment: 'x'.repeat(65) },
        vars: { name: 'Tower', useSsh: false, localTld: 'local' },
        display: { theme: 'white', locale: 'en_US' },
        systemTime: { timeZone: 'UTC' },
      },
    });
    await flushPromises();

    const submitButton = wrapper.find('[data-testid="brand-button"]');
    await submitButton.trigger('click');
    await flushPromises();

    expect(setCoreSettingsMock).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('blocks submission with invalid server description characters', async () => {
    const { wrapper, onComplete } = mountComponent();
    await flushPromises();

    const coreOnResult = coreOnResultHandlers[0];
    coreOnResult({
      data: {
        server: { name: 'Tower', comment: 'bad "desc' },
        vars: { name: 'Tower', useSsh: false, localTld: 'local' },
        display: { theme: 'white', locale: 'en_US' },
        systemTime: { timeZone: 'UTC' },
      },
    });
    await flushPromises();

    const submitButton = wrapper.find('[data-testid="brand-button"]');
    await submitButton.trigger('click');
    await flushPromises();

    expect(setCoreSettingsMock).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('submits valid values to draft store', async () => {
    const { wrapper, onComplete } = mountComponent();
    await flushPromises();

    const coreOnResult = coreOnResultHandlers[0];
    coreOnResult({
      data: {
        server: { name: 'Tower2', comment: 'Primary host' },
        vars: { name: 'Tower2', useSsh: true, localTld: 'local' },
        display: { theme: 'black', locale: 'fr_FR' },
        systemTime: { timeZone: 'America/New_York' },
      },
    });
    await flushPromises();

    const submitButton = wrapper.find('[data-testid="brand-button"]');
    await submitButton.trigger('click');
    await flushPromises();

    expect(setCoreSettingsMock).toHaveBeenCalledWith({
      serverName: 'Tower2',
      serverDescription: 'Primary host',
      timeZone: 'America/New_York',
      theme: 'black',
      language: 'fr_FR',
      useSsh: true,
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('preserves intentionally empty draft description when baseline data is loaded', async () => {
    draftStore.coreSettingsInitialized = true;
    draftStore.serverName = 'Tower2';
    draftStore.serverDescription = '';
    draftStore.selectedTimeZone = 'UTC';
    draftStore.selectedTheme = 'white';
    draftStore.selectedLanguage = 'en_US';
    draftStore.useSsh = false;

    const { wrapper, onComplete } = mountComponent();
    await flushPromises();

    const coreOnResult = coreOnResultHandlers[0];
    coreOnResult({
      data: {
        server: { name: 'Tower2', comment: 'Should not override draft empty' },
        vars: { name: 'Tower2', useSsh: false, localTld: 'local' },
        display: { theme: 'black', locale: 'fr_FR' },
        systemTime: { timeZone: 'America/New_York' },
      },
    });
    await flushPromises();

    const submitButton = wrapper.find('[data-testid="brand-button"]');
    await submitButton.trigger('click');
    await flushPromises();

    expect(setCoreSettingsMock).toHaveBeenCalledWith({
      serverName: 'Tower2',
      serverDescription: '',
      timeZone: 'UTC',
      theme: 'white',
      language: 'en_US',
      useSsh: false,
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
