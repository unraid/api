import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { VueWrapper } from '@vue/test-utils';

import ServerStatus from '~/components/UserProfile/ServerStatus.vue';
import UptimeExpire from '~/components/UserProfile/UptimeExpire.vue';
import { useServerStore } from '~/store/server';
import { createTestI18n } from '../utils/i18n';

vi.mock('~/store/server', async () => {
  const { defineStore } = await import('pinia');
  return {
    useServerStore: defineStore('server', {
      state: () => ({
        state: 'LIFETIME',
        uptime: Date.now() - 9 * 86400000,
        expireTime: Date.now() + 14 * 86400000,
        dateTimeFormat: { date: '%c', time: '%R' },
      }),
    }),
  };
});

vi.mock('@unraid/ui', () => {
  const slot = { template: '<div><slot /></div>' };
  return {
    cn: (...values: string[]) => values.filter(Boolean).join(' '),
    Tooltip: slot,
    TooltipContent: slot,
    TooltipProvider: slot,
    TooltipTrigger: slot,
  };
});

describe('header uptime and expiry states', () => {
  let wrapper: VueWrapper | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-10T12:00:00Z'));
    setActivePinia(createPinia());
  });

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('refreshes the compact timestamp when a running server changes to a trial or expired trial', async () => {
    wrapper = mount(ServerStatus, {
      global: { plugins: [createTestI18n()], stubs: { UpcServerState: true } },
    });
    const server = useServerStore();
    expect(wrapper.text()).toContain('Uptime 9 days');

    server.state = 'TRIAL';
    await nextTick();
    expect(wrapper.text()).toContain('Expires in 14 days');
    expect(wrapper.text()).not.toContain('Expires in 9 days');

    server.expireTime = Date.now() + 17 * 86400000;
    await nextTick();
    expect(wrapper.text()).toContain('Expires in 17 days');

    server.state = 'ENOCONN';
    await nextTick();
    expect(wrapper.text()).toContain('Expires in 17 days');

    server.state = 'EEXPIRED';
    server.expireTime = Date.now() - 2 * 86400000;
    await nextTick();
    expect(wrapper.text()).toContain('Expired 2 days');
  });

  it('keeps compact expiry to its largest unit while preserving the full expiry display', () => {
    const server = useServerStore();
    server.state = 'TRIAL';
    server.expireTime = Date.now() + 14 * 86400000 + 2 * 3600000 + 3 * 60000;
    wrapper = mount(UptimeExpire, {
      props: { shortText: true },
      global: { plugins: [createTestI18n()] },
    });
    expect(wrapper.text()).toBe('Expires in 14 days');
    wrapper.unmount();
    wrapper = mount(UptimeExpire, { global: { plugins: [createTestI18n()] } });
    expect(wrapper.text()).toContain('14 days 2 hours 3 minutes');
  });
});
