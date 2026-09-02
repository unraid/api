import { flushPromises, mount } from '@vue/test-utils';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ManagedBackupStatus } from '~/components/ConnectTunnel/managed-backup.api';

import {
  getManagedBackupLocks,
  getManagedBackupStatus,
  runManagedBackup,
  setupManagedBackup,
  unlockManagedBackup,
} from '~/components/ConnectTunnel/managed-backup.api';
import ManagedBackupPanel from '~/components/ConnectTunnel/ManagedBackupPanel.vue';
import { createTestI18n } from '../../utils/i18n';

vi.mock('~/components/ConnectTunnel/managed-backup.api', () => ({
  getManagedBackupStatus: vi.fn(),
  getManagedBackupLocks: vi.fn(),
  setupManagedBackup: vi.fn(),
  runManagedBackup: vi.fn(),
  unlockManagedBackup: vi.fn(),
}));

const unconfigured = (): ManagedBackupStatus => ({
  schemaVersion: 1,
  signedIn: true,
  configured: false,
  repositoryConfigured: false,
  repositoryInitialized: false,
  setupPending: false,
  legacyMigrationPending: false,
  running: false,
  browseUrl: null,
  job: null,
  usage: {
    state: 'current',
    value: {
      schemaVersion: 1,
      tierId: 'included-10gb',
      quotaBytes: 10_000_000_000,
      usedBytes: 0,
      remainingBytes: 10_000_000_000,
      objectCount: 0,
      updatedAt: '2026-09-01T12:00:00.000Z',
    },
  },
});

const wrappers: ReturnType<typeof mount>[] = [];

async function render(value = unconfigured()) {
  vi.mocked(getManagedBackupStatus).mockResolvedValue(value);
  const wrapper = mount(ManagedBackupPanel, {
    global: { plugins: [createTestI18n()] },
  });
  wrappers.push(wrapper);
  await flushPromises();
  return wrapper;
}

const action = (wrapper: Awaited<ReturnType<typeof render>>, name: string) =>
  wrapper.findAll('[role="button"]').find((button) => button.text() === name)!;

const bodyButton = (name: string) =>
  [...document.body.querySelectorAll<HTMLElement>('[role="button"]')].find(
    (button) => button.textContent?.replace(/\s+/g, ' ').trim() === name
  )!;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
});

describe('managed flash backup', () => {
  it('generates a phrase locally and requires the user to confirm it is saved', async () => {
    const wrapper = await render();
    const phrase = wrapper.get('code').text();
    expect(phrase).toMatch(/^[a-f0-9]{4}(?:-[a-f0-9]{4}){7}$/);
    expect(wrapper.text()).toContain('Unraid cannot recover your backup if you lose it');
    expect(action(wrapper, 'Set up flash backup').attributes('aria-disabled')).toBe('true');

    await wrapper.get('input[type="checkbox"]').setValue(true);
    expect(action(wrapper, 'Set up flash backup').attributes('aria-disabled')).toBe('false');
    await action(wrapper, 'Set up flash backup').trigger('click');
    await flushPromises();

    expect(setupManagedBackup).toHaveBeenCalledExactlyOnceWith(phrase);
  });

  it('allows a low-friction custom phrase while warning about short values', async () => {
    const wrapper = await render();
    await action(wrapper, 'Use my own phrase').trigger('click');
    await wrapper.get('input[type="password"]').setValue('easy to remember');
    expect(wrapper.text()).toContain('Short phrases are allowed, but are easier to guess');
    await wrapper.get('input[type="checkbox"]').setValue(true);
    await wrapper.get('input[type="password"]').setValue('another easy phrase');
    expect(action(wrapper, 'Set up flash backup').attributes('aria-disabled')).toBe('true');
    await wrapper.get('input[type="checkbox"]').setValue(true);
    await action(wrapper, 'Set up flash backup').trigger('click');
    await flushPromises();
    expect(setupManagedBackup).toHaveBeenCalledExactlyOnceWith('another easy phrase');
  });

  it('prompts for the existing phrase instead of generating a new one when a repository exists', async () => {
    const value = unconfigured();
    value.repositoryInitialized = true;
    const wrapper = await render(value);

    expect(wrapper.text()).toContain('Unlock existing backup');
    expect(wrapper.text()).toContain('continue using the same snapshots');
    expect(wrapper.text()).not.toContain('Generate a phrase');
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false);
    expect(action(wrapper, 'Unlock backup').attributes('aria-disabled')).toBe('true');

    await wrapper.get('input[type="password"]').setValue('existing recovery phrase');
    expect(action(wrapper, 'Unlock backup').attributes('aria-disabled')).toBe('false');
    await action(wrapper, 'Unlock backup').trigger('click');
    await flushPromises();

    expect(setupManagedBackup).toHaveBeenCalledExactlyOnceWith('existing recovery phrase');
  });

  it('shows configured backup state and storage metrics and starts a backup once', async () => {
    const value = unconfigured();
    value.configured = true;
    const usage = value.usage.state === 'current' ? value.usage.value : undefined;
    expect(usage).toBeDefined();
    value.usage = {
      state: 'current',
      value: { ...usage!, usedBytes: 1_250_000_000, remainingBytes: 8_750_000_000 },
    };
    value.job = {
      id: 'connect-managed-flash-backup',
      name: 'Flash Backup',
      enabled: true,
      schedule: '0 3 * * *',
      lastRunAt: '2026-09-01T12:00:00.000Z',
      lastRunStatus: 'success',
    };
    value.browseUrl =
      'https://preview.account.unraid.net/servers/705372c2-c8ee-4199-8512-18dfa322617e/backup';
    vi.mocked(runManagedBackup).mockResolvedValue({ started: true });
    const wrapper = await render(value);

    expect(wrapper.text()).toContain('Last backup complete');
    expect(wrapper.text()).toContain('1.3 GB');
    expect(wrapper.text()).toContain('8.8 GB of 10 GB');
    expect(wrapper.text()).toContain('Automatic backups are enabled');
    expect(wrapper.get('a[href*="/servers/705372c2-c8ee-4199-8512-18dfa322617e/backup"]').text()).toBe(
      'Browse backups'
    );
    await action(wrapper, 'Back up now').trigger('click');
    await flushPromises();
    expect(runManagedBackup).toHaveBeenCalledOnce();
  });

  it('changes the recovery phrase for a configured backup', async () => {
    const value = unconfigured();
    value.configured = true;
    value.repositoryConfigured = true;
    value.repositoryInitialized = true;
    value.job = {
      id: 'connect-managed-flash-backup',
      name: 'Flash Backup',
      enabled: true,
      schedule: '0 3 * * *',
      lastRunAt: '2026-09-01T12:00:00.000Z',
      lastRunStatus: 'success',
    };
    vi.mocked(setupManagedBackup).mockResolvedValue(new Response());
    const wrapper = await render(value);

    await action(wrapper, 'Change recovery phrase').trigger('click');
    const phrase = wrapper.get('code').text();
    expect(phrase).toMatch(/^[a-f0-9]{4}(?:-[a-f0-9]{4}){7}$/);
    expect(wrapper.text()).toContain('the old phrase will not unlock the backup');
    expect(action(wrapper, 'Change recovery phrase').attributes('aria-disabled')).toBe('true');

    await wrapper.get('input[type="checkbox"]').setValue(true);
    expect(action(wrapper, 'Change recovery phrase').attributes('aria-disabled')).toBe('false');
    await action(wrapper, 'Change recovery phrase').trigger('click');
    await flushPromises();

    expect(setupManagedBackup).toHaveBeenCalledExactlyOnceWith(phrase);
    expect(wrapper.text()).not.toContain('the old phrase will not unlock the backup');
  });

  it('keeps the recovery phrase editor open when key rotation fails', async () => {
    const value = unconfigured();
    value.configured = true;
    value.repositoryConfigured = true;
    value.repositoryInitialized = true;
    value.job = {
      id: 'connect-managed-flash-backup',
      name: 'Flash Backup',
      enabled: true,
      schedule: '0 3 * * *',
      lastRunAt: '2026-09-01T12:00:00.000Z',
      lastRunStatus: 'success',
    };
    vi.mocked(setupManagedBackup).mockRejectedValue(new Error('request failed'));
    const wrapper = await render(value);

    await action(wrapper, 'Change recovery phrase').trigger('click');
    await wrapper.get('input[type="checkbox"]').setValue(true);
    await action(wrapper, 'Change recovery phrase').trigger('click');
    await flushPromises();

    expect(wrapper.get('[role="alert"]').text()).toContain('The current recovery phrase still works');
    expect(wrapper.text()).toContain('the old phrase will not unlock the backup');
  });

  it('shows an additive initializer when storage exists without a compatible flash job', async () => {
    const value = unconfigured();
    value.repositoryConfigured = true;
    vi.mocked(setupManagedBackup).mockResolvedValue(new Response());
    const wrapper = await render(value);

    expect(wrapper.text()).toContain('Flash backup is uninitialized');
    expect(wrapper.text()).toContain('without changing your existing backup targets or jobs');
    await action(wrapper, 'Initialize flash backup').trigger('click');
    await flushPromises();

    expect(setupManagedBackup).toHaveBeenCalledExactlyOnceWith();
  });

  it('keeps the legacy job running until managed setup succeeds', async () => {
    const value = unconfigured();
    value.legacyMigrationPending = true;
    const wrapper = await render(value);
    expect(wrapper.text()).toContain('Legacy flash backup found');
    expect(wrapper.text()).toContain('will keep running until this setup succeeds');
  });

  it('lists repository locks and removes stale locks through the safe action', async () => {
    const value = unconfigured();
    value.configured = true;
    value.job = {
      id: 'connect-managed-flash-backup',
      name: 'Flash Backup',
      enabled: true,
      schedule: '0 3 * * *',
      lastRunAt: '2026-09-01T12:00:00.000Z',
      lastRunStatus: 'failed',
    };
    vi.mocked(getManagedBackupLocks).mockResolvedValue({
      schemaVersion: 1,
      locks: [
        {
          id: 'a'.repeat(64),
          createdAt: '2026-09-01T12:00:00.000Z',
          hostname: 'DEVGEN',
          username: 'root',
          pid: 4242,
          exclusive: false,
        },
      ],
    });
    vi.mocked(unlockManagedBackup).mockResolvedValue({
      schemaVersion: 1,
      removedLocks: 1,
      remainingLocks: [],
    });
    const wrapper = await render(value);

    await action(wrapper, 'Repository locks').trigger('click');
    await flushPromises();
    expect(document.body.textContent).toContain('DEVGEN');
    expect(document.body.textContent).toContain('PID 4242');

    bodyButton('Remove stale locks').click();
    await flushPromises();

    expect(unlockManagedBackup).toHaveBeenCalledExactlyOnceWith(false);
    expect(document.body.textContent).toContain('Repository unlocked. 1 lock(s) removed.');
  });

  it('requires confirmation before force-removing all locks', async () => {
    const value = unconfigured();
    value.configured = true;
    value.job = {
      id: 'connect-managed-flash-backup',
      name: 'Flash Backup',
      enabled: true,
      schedule: '0 3 * * *',
      lastRunAt: null,
      lastRunStatus: 'failed',
    };
    vi.mocked(getManagedBackupLocks).mockResolvedValue({ schemaVersion: 1, locks: [] });
    vi.mocked(unlockManagedBackup).mockResolvedValue({
      schemaVersion: 1,
      removedLocks: 0,
      remainingLocks: [],
    });
    const wrapper = await render(value);

    await action(wrapper, 'Repository locks').trigger('click');
    await flushPromises();
    bodyButton('Force unlock').click();
    await flushPromises();

    expect(unlockManagedBackup).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('Force unlock repository?');
    bodyButton('Force unlock (remove all)').click();
    await flushPromises();

    expect(unlockManagedBackup).toHaveBeenCalledExactlyOnceWith(true);
  });
});
