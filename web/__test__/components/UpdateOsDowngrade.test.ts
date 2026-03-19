import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import UpdateOsDowngrade from '~/components/UpdateOs/Downgrade.vue';
import { createTestI18n } from '../utils/i18n';

const mockViewReleaseNotes = vi.fn();
const mockServerStore = {
  bootedFromFlashWithInternalBootSetup: false,
  dateTimeFormat: { date: '%A, %m/%d/%Y', time: '%R' },
  osVersion: '7.3.0',
};

vi.mock('pinia', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('pinia');
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) =>
      Object.fromEntries(
        Object.keys(store).map((key) => [
          key,
          {
            get value() {
              return store[key];
            },
            set value(value: unknown) {
              store[key] = value;
            },
          },
        ])
      ),
  };
});

vi.mock('@unraid/ui', () => ({
  BrandButton: {
    template:
      '<button :data-button-name="name" :data-button-text="text" @click="$emit(\'click\')">{{ text }}</button>',
    emits: ['click'],
    props: ['name', 'text'],
  },
  CardWrapper: {
    template: '<div><slot /></div>',
  },
}));

vi.mock('~/helpers/urls', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/helpers/urls')>();
  return {
    ...actual,
    FORUMS_BUG_REPORT: new URL('https://example.com/bug-report'),
  };
});

vi.mock('~/store/server', () => ({
  useServerStore: () => mockServerStore,
}));

vi.mock('~/store/updateOsActions', () => ({
  useUpdateOsActionsStore: () => ({
    viewReleaseNotes: mockViewReleaseNotes,
  }),
}));

describe('UpdateOs/Downgrade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerStore.bootedFromFlashWithInternalBootSetup = false;
    mockServerStore.dateTimeFormat = { date: '%A, %m/%d/%Y', time: '%R' };
    mockServerStore.osVersion = '7.3.0';
    (window as Window & { confirmDowngrade?: () => void }).confirmDowngrade = vi.fn();
  });

  const mountComponent = (version = '7.2.5') =>
    mount(UpdateOsDowngrade, {
      props: {
        releaseDate: '2024-01-01',
        version,
      },
      global: {
        plugins: [createTestI18n()],
      },
    });

  it('starts downgrade immediately when warning conditions are not met', async () => {
    mockServerStore.osVersion = '7.2.9';
    mockServerStore.bootedFromFlashWithInternalBootSetup = true;

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const wrapper = mountComponent('7.2.8');

    await wrapper.find('[data-button-name="downgrade"]').trigger('click');

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(window.confirmDowngrade).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).not.toContain('Internal boot downgrade risk');
  });

  it('shows warning and blocks downgrade when user cancels confirmation', async () => {
    mockServerStore.osVersion = '7.3.0-beta.2';
    mockServerStore.bootedFromFlashWithInternalBootSetup = true;

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const wrapper = mountComponent('7.2.3');

    await wrapper.find('[data-button-name="downgrade"]').trigger('click');

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(window.confirmDowngrade).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Internal boot downgrade risk');
  });

  it('shows warning and allows downgrade after explicit confirmation', async () => {
    mockServerStore.osVersion = '7.3.1';
    mockServerStore.bootedFromFlashWithInternalBootSetup = true;

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const wrapper = mountComponent('7.1.0');

    await wrapper.find('[data-button-name="downgrade"]').trigger('click');

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(window.confirmDowngrade).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('Internal boot downgrade risk');
  });
});
