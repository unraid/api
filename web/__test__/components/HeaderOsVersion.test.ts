/**
 * HeaderOsVersion Component Test Coverage
 */

import { nextTick } from 'vue';
import { setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';

import { createTestingPinia } from '@pinia/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TestingPinia } from '@pinia/testing';
import type { VueWrapper } from '@vue/test-utils';
import type { ServerUpdateOsResponse } from '~/types/server';

import HeaderOsVersion from '~/components/HeaderOsVersion.standalone.vue';
import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';
import { createTestI18n, testTranslate } from '../utils/i18n';

vi.mock('crypto-js/aes', () => ({ default: {} }));
vi.mock('@unraid/shared-callbacks', () => ({
  useCallback: vi.fn(() => ({ send: vi.fn(), watcher: vi.fn() })),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: { value: {} },
    loading: { value: false },
    onResult: vi.fn(),
    onError: vi.fn(),
  }),
  useLazyQuery: () => ({
    result: { value: {} },
    loading: { value: false },
    load: vi.fn(),
    refetch: vi.fn(),
    onResult: vi.fn(),
    onError: vi.fn(),
  }),
  useMutation: () => ({
    mutate: vi.fn(),
    onDone: vi.fn(),
    onError: vi.fn(),
  }),
  provideApolloClient: vi.fn(),
}));

vi.mock('~/helpers/urls', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/helpers/urls')>();
  const mockReleaseNotesUrl = 'http://mock.release.notes/v';
  const mockWebGuiToolsUpdate = '/mock/Tools/Update';
  const mockWebGuiToolsDowngrade = '/mock/Tools/Downgrade';

  return {
    ...actual,
    getReleaseNotesUrl: vi.fn((version: string) => `${mockReleaseNotesUrl}${version}`),
    WEBGUI_TOOLS_UPDATE: mockWebGuiToolsUpdate,
    WEBGUI_TOOLS_DOWNGRADE: mockWebGuiToolsDowngrade,
  };
});

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('vue-i18n');
  return {
    ...actual,
    useI18n: () => ({
      t: testTranslate,
    }),
  };
});

describe('HeaderOsVersion', () => {
  let wrapper: VueWrapper<unknown>;
  let testingPinia: TestingPinia;
  let serverStore: ReturnType<typeof useServerStore>;
  let errorsStore: ReturnType<typeof useErrorsStore>;

  beforeEach(() => {
    testingPinia = createTestingPinia({ createSpy: vi.fn });
    setActivePinia(testingPinia);

    serverStore = useServerStore();
    errorsStore = useErrorsStore();

    serverStore.osVersion = '6.12.0';
    serverStore.rebootType = '';
    serverStore.updateOsResponse = undefined;
    serverStore.regExp = 0;
    serverStore.updateOsIgnoredReleases = [];
    errorsStore.errors = [];

    wrapper = mount(HeaderOsVersion, {
      global: {
        plugins: [testingPinia, createTestI18n()],
      },
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.restoreAllMocks();
  });

  it('renders OS version button with correct version and no update status initially', () => {
    // The version button is within the DropdownMenuTrigger
    const versionButton = wrapper.find('[title="Version Information"]');

    expect(versionButton.exists()).toBe(true);
    expect(versionButton.text()).toContain('6.12.0');

    // No update status button should be rendered initially
    const updateButtons = wrapper.findAll('button');
    const hasUpdateButton = updateButtons.some((button) => {
      const title = button.attributes('title');
      return title && (title.includes('Update') || title.includes('Reboot'));
    });
    expect(hasUpdateButton).toBe(false);
  });

  it('still renders the update-available badge when the server has a state error', async () => {
    // A registration/key error (EGUID GUID mismatch → stateDataError) must not
    // hide an available OS update — update eligibility is independent of it.
    serverStore.state = 'EGUID';
    serverStore.updateOsResponse = {
      version: '6.13.0',
      isNewer: true,
      isEligible: true,
    } as ServerUpdateOsResponse;
    serverStore.rebootType = '';

    await nextTick();

    expect(serverStore.stateDataError).toBeDefined();
    expect(wrapper.find('[title="Unraid OS 6.13.0 Update Available"]').exists()).toBe(true);
  });

  it('renders the pending-reboot badge even when stateDataError is present', async () => {
    // EGUID (registration/key mismatch) produces a state error, but a pending
    // reboot applies an already-installed update and must still be surfaced.
    serverStore.state = 'EGUID';
    serverStore.rebootType = 'update';

    await nextTick();

    expect(wrapper.find('[title="Reboot Required for Update"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Reboot Required for Update');
  });

  it('removes logo class from logo wrapper on mount', async () => {
    // Create a mock logo element
    const logoElement = document.createElement('div');
    logoElement.classList.add('logo');
    document.body.appendChild(logoElement);

    // Mount component
    const newWrapper = mount(HeaderOsVersion, {
      global: {
        plugins: [testingPinia, createTestI18n()],
      },
    });

    // Wait for nextTick to allow onMounted to complete
    await nextTick();
    await nextTick(); // Double nextTick since onMounted uses nextTick internally

    expect(logoElement.classList.contains('logo')).toBe(false);

    // Cleanup
    newWrapper.unmount();
    document.body.removeChild(logoElement);
  });
});
