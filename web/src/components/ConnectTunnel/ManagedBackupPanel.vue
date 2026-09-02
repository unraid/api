<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  CloudArrowUpIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  LockClosedIcon,
  LockOpenIcon,
  ServerIcon,
  UserIcon,
} from '@heroicons/vue/24/outline';
import {
  Button,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  Input,
} from '@unraid/ui';

import type {
  ManagedBackupLock,
  ManagedBackupStatus,
} from '~/components/ConnectTunnel/managed-backup.api';

import {
  getManagedBackupLocks,
  getManagedBackupStatus,
  runManagedBackup,
  setupManagedBackup,
  unlockManagedBackup,
} from '~/components/ConnectTunnel/managed-backup.api';
import { useClipboardWithToast } from '~/composables/useClipboardWithToast';

const { t } = useI18n();
const id = useId();
const status = ref<ManagedBackupStatus>();
const loading = ref(true);
const busy = ref(false);
const error = ref('');
const useCustomPhrase = ref(false);
const generatedPhrase = ref('');
const customPhrase = ref('');
const phraseSaved = ref(false);
const locksOpen = ref(false);
const forceUnlockOpen = ref(false);
const locksLoading = ref(false);
const locksBusy = ref(false);
const locksError = ref('');
const locksMessage = ref('');
const locks = ref<ManagedBackupLock[]>([]);
const { copyWithNotification, copied } = useClipboardWithToast();
let poll: ReturnType<typeof setInterval> | undefined;

const recoveryPhrase = computed(() => {
  if (status.value?.repositoryInitialized && !status.value.configured) return customPhrase.value;
  return useCustomPhrase.value ? customPhrase.value : generatedPhrase.value;
});
const phraseIsUsable = computed(
  () =>
    recoveryPhrase.value.length > 0 &&
    recoveryPhrase.value.length <= 256 &&
    recoveryPhrase.value === recoveryPhrase.value.trim()
);
const needsRepositoryUnlock = computed(() =>
  Boolean(status.value?.repositoryInitialized && !status.value.configured)
);
const canSetUp = computed(
  () =>
    Boolean(status.value?.signedIn) &&
    status.value?.usage.state === 'current' &&
    !status.value.configured &&
    !status.value.setupPending &&
    (needsRepositoryUnlock.value || phraseSaved.value) &&
    phraseIsUsable.value &&
    !busy.value
);
const currentUsage = computed(() =>
  status.value?.usage.state === 'current' ? status.value.usage.value : null
);
const backupStatus = computed(() => {
  if (status.value?.running || status.value?.job?.lastRunStatus === 'running') return 'running';
  return status.value?.job?.lastRunStatus ?? 'never';
});

watch(recoveryPhrase, () => {
  phraseSaved.value = false;
});

function generateRecoveryPhrase() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  generatedPhrase.value = hex.match(/.{1,4}/g)?.join('-') ?? hex;
  phraseSaved.value = false;
}

function clearPhrase() {
  generatedPhrase.value = '';
  customPhrase.value = '';
  phraseSaved.value = false;
}

function switchPhraseMode(custom: boolean) {
  useCustomPhrase.value = custom;
  phraseSaved.value = false;
  if (!custom && !generatedPhrase.value) generateRecoveryPhrase();
}

async function refresh() {
  error.value = '';
  try {
    status.value = await getManagedBackupStatus();
  } catch {
    error.value = t('connectBackup.loadFailed');
  } finally {
    loading.value = false;
  }
}

async function initializeFlashJob() {
  busy.value = true;
  error.value = '';
  try {
    await setupManagedBackup();
    await refresh();
  } catch {
    error.value = t('connectBackup.initializeFailed');
  } finally {
    busy.value = false;
  }
}

async function setUp() {
  if (!canSetUp.value) return;
  busy.value = true;
  error.value = '';
  try {
    await setupManagedBackup(recoveryPhrase.value);
    clearPhrase();
    await refresh();
  } catch {
    error.value = t(
      needsRepositoryUnlock.value ? 'connectBackup.unlock.failed' : 'connectBackup.setupFailed'
    );
  } finally {
    busy.value = false;
  }
}

async function runNow() {
  if (busy.value || status.value?.running) return;
  busy.value = true;
  error.value = '';
  try {
    await runManagedBackup();
    await refresh();
  } catch {
    error.value = t('connectBackup.runFailed');
  } finally {
    busy.value = false;
  }
}

async function loadLocks() {
  locksLoading.value = true;
  locksError.value = '';
  locksMessage.value = '';
  try {
    locks.value = (await getManagedBackupLocks()).locks;
  } catch {
    locksError.value = t('connectBackup.locks.loadFailed');
  } finally {
    locksLoading.value = false;
  }
}

function openLocks() {
  locksOpen.value = true;
  void loadLocks();
}

async function unlock(removeAll: boolean) {
  if (locksBusy.value || status.value?.running) return;
  locksBusy.value = true;
  locksError.value = '';
  locksMessage.value = '';
  try {
    const result = await unlockManagedBackup(removeAll);
    locks.value = result.remainingLocks;
    locksMessage.value = t('connectBackup.locks.unlocked', { count: result.removedLocks });
    forceUnlockOpen.value = false;
  } catch {
    locksError.value = t('connectBackup.locks.unlockFailed');
  } finally {
    locksBusy.value = false;
  }
}

async function copyPhrase() {
  if (!recoveryPhrase.value) return;
  await copyWithNotification(recoveryPhrase.value, t('connectBackup.copied'));
}

const formatBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit += 1;
  }
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)} ${units[unit]}`;
};
const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );
const shortLockId = (value: string) => value.slice(0, 8);

onMounted(() => {
  generateRecoveryPhrase();
  void refresh();
  poll = setInterval(() => void refresh(), 5000);
});
onBeforeUnmount(() => {
  if (poll) clearInterval(poll);
  clearPhrase();
});
</script>

<template>
  <section
    class="border-border bg-muted/10 @container rounded-xl border p-5 @md:p-6"
    :aria-labelledby="`${id}-title`"
    :aria-busy="loading || busy || status?.setupPending"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="flex min-w-0 items-start gap-3">
        <div class="bg-primary/10 text-primary rounded-lg p-2" aria-hidden="true">
          <CloudArrowUpIcon class="h-5 w-5" />
        </div>
        <div>
          <h2 :id="`${id}-title`" class="text-lg font-semibold">
            {{ t('connectBackup.title') }}
          </h2>
          <p class="text-muted-foreground mt-1 max-w-prose text-sm leading-6">
            {{ t('connectBackup.description') }}
          </p>
        </div>
      </div>
      <Button
        v-if="status || error"
        variant="outline"
        size="icon"
        :disabled="loading || busy"
        :aria-label="t('connectBackup.refresh')"
        @click="refresh"
      >
        <ArrowPathIcon class="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>

    <p v-if="loading && !status" class="mt-5" role="status">
      {{ t('connectBackup.loading') }}
    </p>
    <div
      v-if="error"
      class="border-destructive/40 bg-destructive/5 mt-5 rounded-lg border p-4"
      role="alert"
    >
      <p>{{ error }}</p>
    </div>

    <div
      v-if="status?.legacyMigrationPending"
      class="border-warning/50 bg-warning/5 mt-5 flex gap-3 rounded-lg border p-4"
      role="status"
    >
      <ExclamationTriangleIcon class="text-warning mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div>
        <p class="font-medium">{{ t('connectBackup.legacy.title') }}</p>
        <p class="text-muted-foreground mt-1 text-sm leading-6">
          {{ t('connectBackup.legacy.description') }}
        </p>
      </div>
    </div>

    <p v-if="status && !status.signedIn" class="mt-5" role="status">
      {{ t('connectBackup.signIn') }}
    </p>

    <div v-else-if="status?.configured" class="mt-5 space-y-5">
      <div class="grid gap-3 @md:grid-cols-3">
        <div class="border-border bg-background/60 rounded-lg border p-4">
          <p class="text-muted-foreground text-sm">{{ t('connectBackup.summary.status') }}</p>
          <p class="mt-2 flex items-center gap-2 font-semibold" role="status">
            <span class="bg-primary h-2 w-2 rounded-full" aria-hidden="true" />
            {{ t(`connectBackup.status.${backupStatus}`) }}
          </p>
          <p v-if="status.job?.lastRunAt" class="text-muted-foreground mt-1 text-xs">
            {{ formatDate(status.job.lastRunAt) }}
          </p>
        </div>
        <div class="border-border bg-background/60 rounded-lg border p-4">
          <p class="text-muted-foreground text-sm">{{ t('connectBackup.summary.used') }}</p>
          <p class="mt-2 font-semibold tabular-nums">
            {{ currentUsage ? formatBytes(currentUsage.usedBytes) : t('connectBackup.unavailable') }}
          </p>
        </div>
        <div class="border-border bg-background/60 rounded-lg border p-4">
          <p class="text-muted-foreground text-sm">{{ t('connectBackup.summary.remaining') }}</p>
          <p class="mt-2 font-semibold tabular-nums">
            {{
              currentUsage
                ? t('connectBackup.usage.remaining', {
                    remaining: formatBytes(currentUsage.remainingBytes),
                    total: formatBytes(currentUsage.quotaBytes),
                  })
                : t('connectBackup.unavailable')
            }}
          </p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <Button :disabled="busy || status.running" @click="runNow">
          {{ t(status.running ? 'connectBackup.running' : 'connectBackup.runNow') }}
        </Button>
        <Button variant="outline" :disabled="busy || status.running" @click="openLocks">
          <LockClosedIcon class="mr-2 h-4 w-4" aria-hidden="true" />
          {{ t('connectBackup.locks.action') }}
        </Button>
        <Button
          v-if="status.browseUrl"
          as="a"
          variant="outline"
          :href="status.browseUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('connectBackup.browse') }}
          <ArrowTopRightOnSquareIcon class="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
        <p class="text-muted-foreground text-sm">
          {{ t(status.job?.enabled ? 'connectBackup.automatic' : 'connectBackup.automaticDisabled') }}
        </p>
      </div>
    </div>

    <div v-else-if="status?.setupPending" class="mt-5" role="status">
      <p class="font-medium">{{ t('connectBackup.setupPending.title') }}</p>
      <p class="text-muted-foreground mt-1 text-sm">{{ t('connectBackup.setupPending.description') }}</p>
    </div>

    <div v-else-if="status?.signedIn && needsRepositoryUnlock" class="mt-5 space-y-5">
      <div class="border-warning/50 bg-warning/5 flex gap-3 rounded-lg border p-4" role="status">
        <LockClosedIcon class="text-warning mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p class="font-semibold">{{ t('connectBackup.unlock.title') }}</p>
          <p class="text-muted-foreground mt-1 text-sm leading-6">
            {{ t('connectBackup.unlock.description') }}
          </p>
        </div>
      </div>

      <div class="space-y-2">
        <label :for="`${id}-unlock-phrase`" class="font-medium">
          {{ t('connectBackup.recovery.label') }}
        </label>
        <Input
          :id="`${id}-unlock-phrase`"
          v-model="customPhrase"
          type="password"
          maxlength="256"
          autocomplete="current-password"
          :disabled="busy"
          :aria-describedby="`${id}-unlock-help`"
        />
        <p :id="`${id}-unlock-help`" class="text-muted-foreground text-sm">
          {{ t('connectBackup.unlock.help') }}
        </p>
      </div>

      <p v-if="customPhrase && !phraseIsUsable" class="text-destructive text-sm" role="alert">
        {{ t('connectBackup.recovery.invalid') }}
      </p>
      <Button :disabled="!canSetUp" @click="setUp">
        {{ t(busy ? 'connectBackup.unlock.unlocking' : 'connectBackup.unlock.action') }}
      </Button>
    </div>

    <div v-else-if="status?.signedIn && status.repositoryConfigured" class="mt-5 space-y-4">
      <div class="border-warning/50 bg-warning/5 rounded-lg border p-4" role="status">
        <p class="font-medium">{{ t('connectBackup.uninitialized.title') }}</p>
        <p class="text-muted-foreground mt-1 text-sm leading-6">
          {{ t('connectBackup.uninitialized.description') }}
        </p>
      </div>
      <Button :disabled="busy" @click="initializeFlashJob">
        {{ t(busy ? 'connectBackup.initializing' : 'connectBackup.initialize') }}
      </Button>
    </div>

    <div v-else-if="status?.signedIn && status.usage.state === 'unavailable'" class="mt-5" role="status">
      <p>{{ t('connectBackup.storageUnavailable') }}</p>
    </div>

    <div v-else-if="status?.signedIn" class="mt-5 space-y-5">
      <div class="border-warning/50 bg-warning/5 flex gap-3 rounded-lg border p-4">
        <KeyIcon class="text-warning mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p class="font-semibold">{{ t('connectBackup.recovery.title') }}</p>
          <p class="mt-1 text-sm leading-6">{{ t('connectBackup.recovery.warning') }}</p>
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <Button
            :variant="useCustomPhrase ? 'outline' : 'primary'"
            :disabled="busy"
            @click="switchPhraseMode(false)"
          >
            {{ t('connectBackup.recovery.generated') }}
          </Button>
          <Button
            :variant="useCustomPhrase ? 'primary' : 'outline'"
            :disabled="busy"
            @click="switchPhraseMode(true)"
          >
            {{ t('connectBackup.recovery.custom') }}
          </Button>
        </div>

        <div v-if="useCustomPhrase" class="space-y-2">
          <label :for="`${id}-phrase`" class="font-medium">{{
            t('connectBackup.recovery.label')
          }}</label>
          <Input
            :id="`${id}-phrase`"
            v-model="customPhrase"
            type="password"
            maxlength="256"
            autocomplete="new-password"
            :disabled="busy"
            :aria-describedby="`${id}-phrase-help`"
          />
          <p :id="`${id}-phrase-help`" class="text-muted-foreground text-sm">
            {{ t('connectBackup.recovery.customHelp') }}
          </p>
        </div>
        <div v-else class="space-y-2">
          <p class="font-medium">{{ t('connectBackup.recovery.generatedLabel') }}</p>
          <div class="flex items-start gap-2">
            <code
              class="bg-background border-border min-w-0 flex-1 rounded-lg border px-3 py-2 font-mono text-sm break-all select-all"
            >
              {{ generatedPhrase }}
            </code>
            <Button
              variant="outline"
              size="icon"
              :aria-label="t('connectBackup.recovery.copy')"
              @click="copyPhrase"
            >
              <ClipboardDocumentIcon class="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <p v-if="copied" class="text-muted-foreground flex items-center gap-1 text-sm" role="status">
            <CheckCircleIcon class="h-4 w-4" aria-hidden="true" />
            {{ t('connectBackup.copied') }}
          </p>
        </div>
      </div>

      <div class="flex items-start gap-3">
        <input
          :id="`${id}-saved`"
          v-model="phraseSaved"
          type="checkbox"
          class="accent-primary mt-0.5 h-4 w-4 rounded"
          :disabled="busy || !phraseIsUsable"
        />
        <label :for="`${id}-saved`" class="max-w-prose text-sm">
          {{ t('connectBackup.recovery.saved') }}
        </label>
      </div>
      <p v-if="recoveryPhrase && !phraseIsUsable" class="text-destructive text-sm" role="alert">
        {{ t('connectBackup.recovery.invalid') }}
      </p>
      <Button :disabled="!canSetUp" @click="setUp">
        {{ t(busy ? 'connectBackup.settingUp' : 'connectBackup.setUp') }}
      </Button>
    </div>
  </section>

  <DialogRoot v-model:open="locksOpen">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <LockClosedIcon class="text-warning h-5 w-5" aria-hidden="true" />
          {{ t('connectBackup.locks.title') }}
        </DialogTitle>
        <DialogDescription>
          {{ t('connectBackup.locks.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <p v-if="locksLoading" role="status">{{ t('connectBackup.locks.loading') }}</p>
        <p v-else-if="locksError" class="text-destructive" role="alert">{{ locksError }}</p>
        <p v-if="locksMessage" class="text-success flex items-center gap-2" role="status">
          <LockOpenIcon class="h-5 w-5" aria-hidden="true" />
          {{ locksMessage }}
        </p>
        <p
          v-if="!locksLoading && !locksError && locks.length === 0 && !locksMessage"
          class="text-muted-foreground flex items-center gap-2"
          role="status"
        >
          <LockOpenIcon class="text-success h-5 w-5" aria-hidden="true" />
          {{ t('connectBackup.locks.empty') }}
        </p>

        <ul v-if="locks.length" class="space-y-2" :aria-label="t('connectBackup.locks.active')">
          <li v-for="lock in locks" :key="lock.id" class="bg-muted/40 space-y-2 rounded-lg p-3 text-sm">
            <div class="flex flex-wrap items-center gap-2">
              <code class="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                {{ shortLockId(lock.id) }}
              </code>
              <span v-if="lock.exclusive" class="text-warning font-medium">
                {{ t('connectBackup.locks.exclusive') }}
              </span>
            </div>
            <div class="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
              <span v-if="lock.createdAt">{{ formatDate(lock.createdAt) }}</span>
              <span class="inline-flex items-center gap-1">
                <ServerIcon class="h-4 w-4" aria-hidden="true" />
                {{ lock.hostname || t('connectBackup.locks.unknown') }}
              </span>
              <span class="inline-flex items-center gap-1">
                <UserIcon class="h-4 w-4" aria-hidden="true" />
                {{ lock.username || t('connectBackup.locks.unknown') }}
              </span>
              <span class="inline-flex items-center gap-1">
                <CpuChipIcon class="h-4 w-4" aria-hidden="true" />
                {{ t('connectBackup.locks.pid', { pid: lock.pid ?? '—' }) }}
              </span>
            </div>
          </li>
        </ul>

        <p class="text-warning flex items-start gap-2 text-sm">
          <ExclamationTriangleIcon class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {{ t('connectBackup.locks.warning') }}
        </p>
      </div>

      <DialogFooter>
        <div class="flex w-full flex-wrap justify-end gap-2">
          <Button variant="secondary" :disabled="locksBusy" @click="locksOpen = false">
            {{ t('connectBackup.locks.close') }}
          </Button>
          <Button
            variant="outline"
            :disabled="locksLoading || locksBusy || status?.running"
            @click="unlock(false)"
          >
            <LockOpenIcon class="mr-2 h-4 w-4" aria-hidden="true" />
            {{ t(locksBusy ? 'connectBackup.locks.removing' : 'connectBackup.locks.removeStale') }}
          </Button>
          <Button
            variant="destructive"
            :disabled="locksLoading || locksBusy || status?.running"
            @click="forceUnlockOpen = true"
          >
            {{ t('connectBackup.locks.force') }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </DialogRoot>

  <DialogRoot v-model:open="forceUnlockOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('connectBackup.locks.forceTitle') }}</DialogTitle>
        <DialogDescription>{{ t('connectBackup.locks.forceDescription') }}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <div class="flex w-full justify-end gap-2">
          <Button variant="outline" :disabled="locksBusy" @click="forceUnlockOpen = false">
            {{ t('connectBackup.locks.cancel') }}
          </Button>
          <Button variant="destructive" :disabled="locksBusy" @click="unlock(true)">
            {{ t(locksBusy ? 'connectBackup.locks.unlocking' : 'connectBackup.locks.forceConfirm') }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </DialogRoot>
</template>
