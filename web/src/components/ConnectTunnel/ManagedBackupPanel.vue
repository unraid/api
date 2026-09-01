<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  KeyIcon,
} from '@heroicons/vue/24/outline';
import { Button, Input } from '@unraid/ui';

import type { ManagedBackupStatus } from '~/components/ConnectTunnel/managed-backup.api';

import {
  getManagedBackupStatus,
  runManagedBackup,
  setupManagedBackup,
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
const { copyWithNotification, copied } = useClipboardWithToast();
let poll: ReturnType<typeof setInterval> | undefined;

const recoveryPhrase = computed(() =>
  useCustomPhrase.value ? customPhrase.value : generatedPhrase.value
);
const phraseIsUsable = computed(
  () =>
    recoveryPhrase.value.length > 0 &&
    recoveryPhrase.value.length <= 256 &&
    recoveryPhrase.value === recoveryPhrase.value.trim()
);
const canSetUp = computed(
  () =>
    Boolean(status.value?.signedIn) &&
    status.value?.usage.state === 'current' &&
    !status.value.configured &&
    !status.value.setupPending &&
    phraseSaved.value &&
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

async function setUp() {
  if (!canSetUp.value) return;
  busy.value = true;
  error.value = '';
  try {
    await setupManagedBackup(recoveryPhrase.value);
    clearPhrase();
    await refresh();
  } catch {
    error.value = t('connectBackup.setupFailed');
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
        <p class="text-muted-foreground text-sm">
          {{ t(status.job?.enabled ? 'connectBackup.automatic' : 'connectBackup.automaticDisabled') }}
        </p>
      </div>
    </div>

    <div v-else-if="status?.setupPending" class="mt-5" role="status">
      <p class="font-medium">{{ t('connectBackup.setupPending.title') }}</p>
      <p class="text-muted-foreground mt-1 text-sm">{{ t('connectBackup.setupPending.description') }}</p>
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
</template>
