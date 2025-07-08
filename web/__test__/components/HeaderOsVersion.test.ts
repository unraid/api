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
import type { Error as CustomApiError } from '~/store/errors';
import type { ServerUpdateOsResponse } from '~/types/server';

import HeaderOsVersion from '~/components/HeaderOsVersion.ce.vue';
import { useErrorsStore } from '~/store/errors';
import { useServerStore } from '~/store/server';

const testMockReleaseNotesUrl = 'http://mock.release.notes/v';

vi.mock('crypto-js/aes', () => ({ default: {} }));
vi.mock('@unraid/shared-callbacks', () => ({
  useCallback: vi.fn(() => ({ send: vi.fn(), watcher: vi.fn() })),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: { value: {} },
    loading: { value: false },
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

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: unknown) => {
      if (params && Array.isArray(params)) {
        let result = key;
        params.forEach((val, index) => {
          result = result.replace(`{${index}}`, String(val));
        });

        return result;
      }

      const keyMap: Record<string, string> = {
        'Reboot Required for Update': 'Reboot Required for Update',
        'Reboot Required for Downgrade': 'Reboot Required for Downgrade',
        'Updating 3rd party drivers': 'Updating 3rd party drivers',
        'Update Available': 'Update Available',
        'Update Released': 'Update Released',
        'View release notes': 'View release notes',
      };

      return keyMap[key] ?? key;
    },
  }),
}));

describe('HeaderOsVersion', () => {
  let wrapper: VueWrapper<unknown>;
  let testingPinia: TestingPinia;
  let serverStore: ReturnType<typeof useServerStore>;
  let errorsStore: ReturnType<typeof useErrorsStore>;

  const findUpdateStatusComponent = () => {
    const statusElement = wrapper.find('a.group:not([title*="release notes"]), button.group');
    return statusElement.exists() ? statusElement : null;
  };

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
        plugins: [testingPinia],
      },
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.restoreAllMocks();
  });

  it('renders OS version link with correct URL and no update status initially', () => {
    const versionLink = wrapper.find('a[title*="release notes"]');

    expect(versionLink.exists()).toBe(true);
    expect(versionLink.attributes('href')).toBe(`${testMockReleaseNotesUrl}6.12.0`);

    expect(versionLink.text()).toContain('6.12.0');
    expect(findUpdateStatusComponent()).toBeNull();
  });

  it('does not render update status when stateDataError is present', async () => {
    const mockError: CustomApiError = {
      message: 'State data fetch failed',
      heading: 'Fetch Error',
      level: 'error',
      type: 'serverState',
    };
    errorsStore.errors = [mockError];
    serverStore.updateOsResponse = {
      version: '6.13.0',
      isNewer: true,
      isEligible: true,
    } as ServerUpdateOsResponse;
    serverStore.rebootType = '';

    await nextTick();

    expect(findUpdateStatusComponent()).toBeNull();
  });
});
