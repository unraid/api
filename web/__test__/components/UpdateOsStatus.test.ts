import { defineStore } from 'pinia';
import { enableAutoUnmount, mount } from '@vue/test-utils';

import { createTestingPinia } from '@pinia/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import UpdateOsStatus from '~/components/UpdateOs/Status.vue';
import { createTestI18n } from '../utils/i18n';

enableAutoUnmount(afterEach);

vi.mock('@unraid/ui', () => ({
  Badge: { template: '<span><slot /></span>' },
  BrandLoading: { template: '<span />' },
  Button: { template: '<button><slot /></button>' },
}));

const useServerStore = defineStore('server', {
  state: () => ({
    rebootType: '',
    rebootVersion: '',
    osVersion: '7.2.0',
    dateTimeFormat: {},
    regExp: 0,
    regUpdatesExpired: false,
  }),
});
const useUpdateOsStore = defineStore('updateOs', {
  state: () => ({
    available: undefined as string | undefined,
    availableWithRenewal: undefined as string | undefined,
  }),
  actions: { localCheckForUpdate: vi.fn(), setModalOpen: vi.fn(), cancelUpdate: vi.fn() },
});
const useUpdateOsActionsStore = defineStore('updateOsActions', {
  state: () => ({ status: 'ready', ineligibleText: '', rebootTypeText: '' }),
  actions: { viewReleaseNotes: vi.fn(), rebootServer: vi.fn() },
});
vi.mock('~/store/server', () => ({ useServerStore: () => useServerStore() }));
vi.mock('~/store/updateOs', () => ({ useUpdateOsStore: () => useUpdateOsStore() }));
vi.mock('~/store/updateOsActions', () => ({ useUpdateOsActionsStore: () => useUpdateOsActionsStore() }));
vi.mock('~/store/account', () => ({
  useAccountStore: () => ({ updateOs: vi.fn(), downgradeOs: vi.fn() }),
}));

const mountStatus = (props = {}) => {
  const pinia = createTestingPinia({ createSpy: vi.fn });
  const server = useServerStore(pinia);
  server.rebootType = '';
  server.osVersion = '7.2.0';
  const update = useUpdateOsStore(pinia);
  const actions = useUpdateOsActionsStore(pinia);
  actions.status = 'ready';
  const wrapper = mount(UpdateOsStatus, {
    props,
    global: { plugins: [pinia, createTestI18n()] },
  });
  return { wrapper, server, update, actions };
};

describe('Update OS status actions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('checks for updates when no release is available', async () => {
    const { wrapper, update } = mountStatus();
    const check = wrapper.findAll('button').filter((button) => button.text() === 'Check for Update');
    expect(check).toHaveLength(1);
    await check[0].trigger('click');
    expect(update.localCheckForUpdate).toHaveBeenCalledTimes(1);
  });

  it.each(['available', 'availableWithRenewal'] as const)(
    'keeps refresh beside the %s action',
    async (field) => {
      const { wrapper, update } = mountStatus();
      update[field] = '7.3.0';
      await wrapper.vm.$nextTick();
      const check = wrapper.findAll('button').find((button) => button.text() === 'Check for Update')!;
      const release = wrapper.findAll('button').find((button) => button.text().includes('7.3.0'))!;
      expect(check.exists()).toBe(true);
      expect(release.exists()).toBe(true);
      await release.trigger('click');
      expect(update.setModalOpen).toHaveBeenCalledWith(true);
      await check.trigger('click');
      expect(update.localCheckForUpdate).toHaveBeenCalledTimes(1);
    }
  );

  it('disables refresh and release actions while checking', async () => {
    const { wrapper, update, actions } = mountStatus();
    update.available = '7.3.0';
    actions.status = 'checking';
    await wrapper.vm.$nextTick();
    const buttons = wrapper
      .findAll('button')
      .filter((button) => button.text() === 'Check for Update' || button.text().includes('7.3.0'));
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      expect(button.attributes('disabled')).toBeDefined();
      await button.trigger('click');
    }
    expect(update.localCheckForUpdate).not.toHaveBeenCalled();
    expect(update.setModalOpen).not.toHaveBeenCalled();
  });

  it.each(['update', 'downgrade'] as const)(
    'hides refresh while a %s reboot is pending',
    async (rebootType) => {
      const { wrapper, update, server } = mountStatus();
      update.available = '7.3.0';
      server.rebootType = rebootType;
      await wrapper.vm.$nextTick();
      expect(wrapper.findAll('button').some((button) => button.text() === 'Check for Update')).toBe(
        false
      );
    }
  );

  it('hides refresh on the external downgrade flow', async () => {
    const { wrapper, update } = mountStatus({ showExternalDowngrade: true });
    update.available = '7.3.0';
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('button').some((button) => button.text() === 'Check for Update')).toBe(false);
  });
});
