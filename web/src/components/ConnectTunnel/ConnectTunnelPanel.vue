<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  ChartBarIcon,
  ChartBarSquareIcon,
  CloudIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SignalIcon,
} from '@heroicons/vue/24/outline';
import { Button, Switch } from '@unraid/ui';

import type { ConnectTunnelPageQuery, ConnectTunnelSettingsInput } from '~/composables/gql/graphql';

const {
  state,
  saving = false,
  unavailable = false,
  error = '',
  saved = false,
} = defineProps<{
  state: ConnectTunnelPageQuery['connectTunnelSettings'];
  saving?: boolean;
  unavailable?: boolean;
  error?: string;
  saved?: boolean;
}>();
const emit = defineEmits<{
  save: [input: ConnectTunnelSettingsInput];
  migrate: [confirmationToken: string];
}>();
const { t } = useI18n();
const id = useId();
const editable = (value: typeof state): ConnectTunnelSettingsInput => ({
  certificateManagementEnabled: value.certificateManagementEnabled,
  tunnelRemoteAccessEnabled: value.tunnelRemoteAccessEnabled,
  serverDataReportingEnabled: value.serverDataReportingEnabled,
});
const baseline = ref(editable(state));
const draft = ref(editable(state));
const dirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(baseline.value));
const disabled = computed(
  () => saving || unavailable || !state.signedIn || state.certificateMigration.status === 'running'
);
const confirmation = ref<typeof state.certificateMigration | null>(null);
watch(
  () => state.certificateMigration.confirmationToken,
  () => {
    confirmation.value = null;
  }
);
function confirmMigration() {
  const token = confirmation.value?.confirmationToken;
  if (
    !disabled.value &&
    !dirty.value &&
    token &&
    token === state.certificateMigration.confirmationToken
  ) {
    confirmation.value = null;
    emit('migrate', token);
  }
}
watch(
  () => state,
  (value) => {
    const next = editable(value);
    if (!dirty.value || !value.signedIn || JSON.stringify(next) === JSON.stringify(draft.value)) {
      draft.value = next;
      baseline.value = { ...next };
    }
  }
);
const features = [
  'certificateManagementEnabled',
  'serverDataReportingEnabled',
  'tunnelRemoteAccessEnabled',
] as const;
const featureIcons = {
  certificateManagementEnabled: LockClosedIcon,
  tunnelRemoteAccessEnabled: CloudIcon,
  serverDataReportingEnabled: ChartBarSquareIcon,
};
const featureStatus = (key: (typeof features)[number]) =>
  key === 'certificateManagementEnabled'
    ? state.status.certificate
    : key === 'tunnelRemoteAccessEnabled'
      ? !state.tunnelRemoteAccessEnabled
        ? 'disabled'
        : state.status.entitlementState === 'current' && state.status.entitlement?.reason
          ? 'tunnel_blocked'
          : state.status.tunnel
      : state.serverDataReportingEnabled
        ? state.status.presence
        : 'disabled';
const statusLabel = (status: string) => {
  const key = `connectTunnel.status.${status}`;
  const label = t(key);
  return label === key ? t('connectTunnel.status.unknown') : label;
};
const blocked = (key: (typeof features)[number]) =>
  disabled.value ||
  (key === 'certificateManagementEnabled' && draft.value.tunnelRemoteAccessEnabled) ||
  (key === 'tunnelRemoteAccessEnabled' && !draft.value.certificateManagementEnabled);
function reset() {
  baseline.value = editable(state);
  draft.value = { ...baseline.value };
}
function submit() {
  if (!disabled.value && dirty.value) emit('save', { ...draft.value });
}
const usage = computed(() => state.status.entitlement);
const usageBytes = (bytes: number) =>
  t('connectTunnel.usage.gb', {
    amount: new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(bytes / 1_000_000_000),
  });
const usageDate = (seconds: number) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(seconds * 1000));
const tunnelExplanation = computed(() => {
  const reason =
    (state.status.entitlementState === 'current' && state.status.entitlement?.reason) ||
    state.status.tunnelReason;
  const key = `connectTunnel.reason.${reason}`;
  const label = t(key);
  return reason && label !== key ? label : '';
});
const overview = computed(() => JSON.stringify(state.overview, null, 2));
</script>

<template>
  <div class="space-y-5" :aria-busy="saving">
    <p v-if="!state.signedIn" role="status">{{ t('connectTunnel.signIn') }}</p>
    <div class="@container grid gap-5 @3xl:grid-cols-2">
      <section
        v-for="key in features"
        :key="key"
        class="border-border bg-muted/10 @container rounded-xl border p-5 @md:p-6"
        :class="key === 'tunnelRemoteAccessEnabled' ? '@3xl:col-span-2' : ''"
        :aria-labelledby="`${id}-${key}-label`"
      >
        <div class="flex items-start justify-between gap-6">
          <div class="flex min-w-0 items-start gap-4">
            <div class="bg-primary/10 text-primary mt-0.5 rounded-lg p-2.5" aria-hidden="true">
              <component :is="featureIcons[key]" class="h-6 w-6" />
            </div>
            <div class="min-w-0 space-y-1.5">
              <h2 :id="`${id}-${key}-label`" class="text-lg font-semibold">
                {{ t(`connectTunnel.features.${key}.title`) }}
              </h2>
              <p :id="`${id}-${key}-description`" class="text-muted-foreground max-w-prose">
                {{ t(`connectTunnel.features.${key}.description`) }}
              </p>
            </div>
          </div>
          <Switch
            v-model="draft[key]"
            :disabled="blocked(key)"
            :aria-disabled="blocked(key)"
            :aria-labelledby="`${id}-${key}-label`"
            :aria-describedby="`${id}-${key}-description`"
          />
        </div>
        <div
          v-if="key !== 'tunnelRemoteAccessEnabled'"
          class="mt-4 flex items-center gap-2 text-sm"
          role="status"
        >
          <span class="bg-primary h-2 w-2 rounded-full" aria-hidden="true" />
          <span>{{
            t('connectTunnel.currentStatus', { status: statusLabel(featureStatus(key)) })
          }}</span>
        </div>
        <div v-if="key === 'certificateManagementEnabled'" class="mt-4 space-y-3">
          <p v-if="state.certificateMigration.status !== 'idle'" role="status" class="text-sm">
            {{ t(`connectTunnel.migration.${state.certificateMigration.status}`) }}
            <span v-if="state.certificateMigration.reason">
              {{
                state.certificateMigration.reason === 'domain_changed'
                  ? t('connectTunnel.migration.domainChanged')
                  : `(${state.certificateMigration.reason})`
              }}
            </span>
          </p>
          <details>
            <summary
              class="focus-visible:outline-ring cursor-pointer rounded-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {{ t('connectTunnel.certificateDetails') }}
            </summary>
            <div class="mt-3 space-y-3 text-sm">
              <p v-if="state.certificateMigration.managed">
                {{ t('connectTunnel.migration.managed') }}
              </p>
              <p v-if="state.certificateMigration.domain" class="break-all">
                {{ t('connectTunnel.certificateDomain', { domain: state.certificateMigration.domain }) }}
              </p>
              <p v-if="state.certificateMigration.fingerprint" class="text-muted-foreground break-all">
                {{
                  t('connectTunnel.migration.fingerprint', {
                    fingerprint: state.certificateMigration.fingerprint,
                  })
                }}
              </p>
              <template v-if="confirmation">
                <p>{{ t('connectTunnel.migration.confirmDescription') }}</p>
                <div class="flex flex-wrap gap-3">
                  <Button :disabled="disabled || dirty" @click="confirmMigration">{{
                    t('connectTunnel.migration.confirm')
                  }}</Button>
                  <Button variant="outline" @click="confirmation = null">{{
                    t('connectTunnel.migration.cancel')
                  }}</Button>
                </div>
              </template>
              <Button
                v-else-if="state.certificateMigration.confirmationToken"
                variant="outline"
                :disabled="disabled || dirty"
                @click="confirmation = { ...state.certificateMigration }"
                >{{ t('connectTunnel.migration.action') }}</Button
              >
            </div>
          </details>
        </div>
        <p
          v-if="key === 'certificateManagementEnabled' && draft.tunnelRemoteAccessEnabled"
          class="text-muted-foreground mt-2 text-sm"
        >
          {{ t('connectTunnel.certificateRequired') }}
        </p>
        <p
          v-if="key === 'tunnelRemoteAccessEnabled' && !draft.certificateManagementEnabled"
          class="text-muted-foreground mt-2 text-sm"
        >
          {{ t('connectTunnel.enableCertificate') }}
        </p>
        <div v-if="key === 'tunnelRemoteAccessEnabled'" class="mt-5 space-y-4 text-sm">
          <p v-if="state.tunnelRemoteAccessEnabled && tunnelExplanation" role="status">
            {{ tunnelExplanation }}
          </p>
          <p
            v-if="
              state.status.entitlementState !== 'current' &&
              (state.tunnelRemoteAccessEnabled || state.serverDataReportingEnabled)
            "
            role="status"
          >
            {{ t(usage ? 'connectTunnel.usage.stale' : 'connectTunnel.usage.unavailable') }}
          </p>
          <div class="grid gap-3 @md:grid-cols-3">
            <div class="border-border bg-background/60 rounded-lg border p-4">
              <div class="text-muted-foreground flex items-center gap-2">
                <SignalIcon class="h-4 w-4" aria-hidden="true" />
                <span>{{ t('connectTunnel.summary.connection') }}</span>
              </div>
              <p class="mt-2 flex items-center gap-2 text-base font-semibold" role="status">
                <span class="bg-primary h-2 w-2 rounded-full" aria-hidden="true" />
                {{ statusLabel(featureStatus(key)) }}
              </p>
            </div>
            <div class="border-border bg-background/60 rounded-lg border p-4">
              <div class="text-muted-foreground flex items-center gap-2">
                <ChartBarIcon class="h-4 w-4" aria-hidden="true" />
                <span>{{ t('connectTunnel.summary.usage') }}</span>
              </div>
              <p class="mt-2 text-base font-semibold tabular-nums">
                {{
                  usage
                    ? t('connectTunnel.usage.used', {
                        used: usageBytes(usage.bytesUsed),
                        allowance:
                          usage.quotaBytes === 0
                            ? t('connectTunnel.usage.unlimited')
                            : usageBytes(usage.quotaBytes),
                      })
                    : t('connectTunnel.summary.unavailable')
                }}
              </p>
            </div>
            <div class="border-border bg-background/60 rounded-lg border p-4">
              <div class="text-muted-foreground flex items-center gap-2">
                <BoltIcon class="h-4 w-4" aria-hidden="true" />
                <span>{{ t('connectTunnel.usage.speed') }}</span>
              </div>
              <p class="mt-2 text-base font-semibold tabular-nums">
                {{
                  usage
                    ? usage.rateMode === 'unlimited'
                      ? t('connectTunnel.usage.unlimitedSpeed')
                      : t('connectTunnel.usage.speedValue', {
                          speed: (usage.rateBytesPerSecond * 8) / 1_000_000,
                        })
                    : t('connectTunnel.summary.unavailable')
                }}
              </p>
            </div>
          </div>
          <template v-if="usage">
            <p v-if="usage.status === 'unknown'">{{ t('connectTunnel.usage.unknownPolicy') }}</p>
            <details class="border-border rounded-lg border px-4 py-3">
              <summary
                class="focus-visible:outline-ring cursor-pointer rounded-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                {{ t('connectTunnel.usage.details') }}
              </summary>
              <div class="mt-3 space-y-2">
                <p v-if="typeof usage.bytesRemaining === 'number'">
                  {{
                    t('connectTunnel.usage.remaining', { remaining: usageBytes(usage.bytesRemaining) })
                  }}
                </p>
                <p>
                  {{
                    t('connectTunnel.usage.period', {
                      start: usageDate(usage.periodStart),
                      end: usageDate(usage.periodEnd),
                    })
                  }}
                </p>
                <p class="text-muted-foreground">{{ t('connectTunnel.usage.delay') }}</p>
              </div>
            </details>
          </template>
        </div>
        <div v-if="key === 'tunnelRemoteAccessEnabled'" class="mt-4 space-y-3 text-sm">
          <div
            class="border-primary/30 bg-primary/5 flex flex-col gap-4 rounded-lg border p-4 @md:flex-row @md:items-center @md:justify-between"
          >
            <div class="flex min-w-0 items-start gap-3">
              <ShieldCheckIcon class="text-primary h-6 w-6 shrink-0" aria-hidden="true" />
              <div class="space-y-1">
                <p class="font-semibold">{{ t('connectTunnel.security.encryptedTitle') }}</p>
                <p class="text-muted-foreground max-w-prose">
                  {{ t('connectTunnel.security.encrypted') }}
                </p>
              </div>
            </div>
            <a
              v-if="state.tunnelUrl"
              class="bg-primary text-primary-foreground focus-visible:outline-ring inline-flex shrink-0 items-center justify-center gap-2 rounded-md px-4 py-2 font-medium hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
              :href="state.tunnelUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ t('connectTunnel.openRemoteAccess') }}
              <ArrowTopRightOnSquareIcon class="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <details class="px-1">
            <summary
              class="focus-visible:outline-ring cursor-pointer rounded-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {{ t('connectTunnel.security.details') }}
            </summary>
            <div class="mt-3 max-w-prose space-y-3">
              <p>{{ t('connectTunnel.security.relay') }}</p>
              <p>{{ t('connectTunnel.security.metadata') }}</p>
              <p>{{ t('connectTunnel.security.authentication') }}</p>
              <p>{{ t('connectTunnel.security.requirements') }}</p>
              <p v-if="state.tunnelUrl" class="break-all">
                {{ t('connectTunnel.remoteAddress', { url: state.tunnelUrl }) }}
              </p>
            </div>
          </details>
        </div>
        <slot v-if="key === 'tunnelRemoteAccessEnabled'" name="services" />
        <template v-if="key === 'serverDataReportingEnabled'">
          <p v-if="state.overviewCleanupPending" class="mt-2 text-sm">
            {{ t('connectTunnel.cleanupPending') }}
          </p>
          <details class="mt-4">
            <summary
              class="focus-visible:outline-ring cursor-pointer rounded-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {{ t('connectTunnel.previewData') }}
            </summary>
            <p class="text-muted-foreground my-3 text-sm">{{ t('connectTunnel.previewDescription') }}</p>
            <pre
              class="bg-muted max-h-96 overflow-auto rounded-md p-4 text-xs break-all whitespace-pre-wrap"
              >{{ overview }}</pre
            >
          </details>
        </template>
      </section>
    </div>
    <p v-if="state.status.reason" role="status" class="text-sm">
      {{ t('connectTunnel.connectorReason', { reason: state.status.reason }) }}
    </p>
    <p v-if="error" role="alert" class="text-destructive">{{ error }}</p>
    <p v-else-if="saved && !dirty" role="status">{{ t('connectTunnel.saved') }}</p>
    <div class="flex flex-wrap items-center gap-3">
      <Button :disabled="disabled || !dirty" @click="submit">{{
        t(saving ? 'connectTunnel.saving' : 'connectTunnel.apply')
      }}</Button>
      <Button variant="outline" :disabled="saving || !dirty" @click="reset">{{
        t('connectTunnel.cancel')
      }}</Button>
    </div>
  </div>
</template>
