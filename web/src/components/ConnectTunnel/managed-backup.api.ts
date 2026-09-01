import { request } from '~/composables/services/request';

export interface ManagedBackupJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: string | null;
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'failed' | 'running' | null;
}

export interface ManagedBackupUsage {
  schemaVersion: 1;
  tierId: string | null;
  quotaBytes: number;
  usedBytes: number;
  remainingBytes: number;
  objectCount: number;
  updatedAt: string;
}

export interface ManagedBackupStatus {
  schemaVersion: 1;
  signedIn: boolean;
  configured: boolean;
  setupPending: boolean;
  legacyMigrationPending: boolean;
  running: boolean;
  job: ManagedBackupJob | null;
  usage: { state: 'current'; value: ManagedBackupUsage } | { state: 'unavailable' };
}

export interface ManagedBackupLock {
  id: string;
  createdAt: string | null;
  hostname: string | null;
  username: string | null;
  pid: number | null;
  exclusive: boolean;
}

const endpoint = '/graphql/api/connect/managed-backup';

export const getManagedBackupStatus = () =>
  request.url(`${endpoint}/status`).get().json<ManagedBackupStatus>();

export const setupManagedBackup = (recoveryPhrase: string) =>
  request.url(`${endpoint}/setup`).json({ recoveryPhrase }).post().res();

export const runManagedBackup = () => request.url(`${endpoint}/run`).post().json<{ started: boolean }>();

export const getManagedBackupLocks = () =>
  request.url(`${endpoint}/locks`).get().json<{ schemaVersion: 1; locks: ManagedBackupLock[] }>();

export const unlockManagedBackup = (removeAll = false) =>
  request
    .url(`${endpoint}/unlock`)
    .json({ removeAll })
    .post()
    .json<{ schemaVersion: 1; removedLocks: number; remainingLocks: ManagedBackupLock[] }>();
