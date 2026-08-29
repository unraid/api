<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';

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
  'tunnelRemoteAccessEnabled',
  'serverDataReportingEnabled',
] as const;
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
  <form class="space-y-8" :aria-busy="saving" @submit.prevent="submit">
    <p v-if="!state.signedIn" role="status">{{ t('connectTunnel.signIn') }}</p>
    <section
      v-for="key in features"
      :key="key"
      class="border-border border-t pt-6"
      :aria-labelledby="`${id}-${key}-label`"
    >
      <div class="flex items-start justify-between gap-6">
        <div class="min-w-0 space-y-2">
          <h2 :id="`${id}-${key}-label`" class="text-lg font-semibold">
            {{ t(`connectTunnel.features.${key}.title`) }}
          </h2>
          <p :id="`${id}-${key}-description`" class="text-muted-foreground max-w-prose">
            {{ t(`connectTunnel.features.${key}.description`) }}
          </p>
        </div>
        <Switch
          v-model="draft[key]"
          :disabled="blocked(key)"
          :aria-disabled="blocked(key)"
          :aria-labelledby="`${id}-${key}-label`"
          :aria-describedby="`${id}-${key}-description`"
        />
      </div>
      <p class="mt-3 text-sm" role="status">
        {{ t('connectTunnel.currentStatus', { status: statusLabel(featureStatus(key)) }) }}
      </p>
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
      <div v-if="key === 'tunnelRemoteAccessEnabled'" class="mt-3 space-y-2 text-sm">
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
        <template v-if="usage">
          <p class="font-medium tabular-nums">
            {{
              t('connectTunnel.usage.used', {
                used: usageBytes(usage.bytesUsed),
                allowance:
                  usage.quotaBytes === 0
                    ? t('connectTunnel.usage.unlimited')
                    : usageBytes(usage.quotaBytes),
              })
            }}
          </p>
          <p>
            {{ t('connectTunnel.usage.speed') }}:
            <span class="font-medium tabular-nums">
              {{
                usage.rateMode === 'unlimited'
                  ? t('connectTunnel.usage.unlimitedSpeed')
                  : t('connectTunnel.usage.speedValue', {
                      speed: (usage.rateBytesPerSecond * 8) / 1_000_000,
                    })
              }}
            </span>
          </p>
          <p v-if="usage.status === 'unknown'">{{ t('connectTunnel.usage.unknownPolicy') }}</p>
          <details>
            <summary
              class="focus-visible:outline-ring cursor-pointer rounded-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {{ t('connectTunnel.usage.details') }}
            </summary>
            <div class="mt-3 space-y-2">
              <p v-if="typeof usage.bytesRemaining === 'number'">
                {{ t('connectTunnel.usage.remaining', { remaining: usageBytes(usage.bytesRemaining) }) }}
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
        <p>{{ t('connectTunnel.security.encrypted') }}</p>
        <a
          v-if="state.tunnelUrl"
          class="text-primary inline-block underline"
          :href="state.tunnelUrl"
          target="_blank"
          rel="noopener noreferrer"
          >{{ t('connectTunnel.openRemoteAccess') }}</a
        >
        <details>
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
  </form>
</template>
