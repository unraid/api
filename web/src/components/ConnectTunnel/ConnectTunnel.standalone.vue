<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMutation, useQuery } from '@vue/apollo-composable';

import { Cog6ToothIcon, UserCircleIcon } from '@heroicons/vue/24/outline';
import { Button } from '@unraid/ui';

import type { ConnectGatewaySettingsInput, ConnectTunnelSettingsInput } from '~/composables/gql/graphql';

import Auth from '~/components/Auth.standalone.vue';
import BrandMark from '~/components/Brand/Mark.vue';
import ConnectServicesPanel from '~/components/ConnectTunnel/ConnectServicesPanel.vue';
import ConnectTunnelPanel from '~/components/ConnectTunnel/ConnectTunnelPanel.vue';
import { connectServiceTargetsQuery } from '~/components/ConnectTunnel/graphql/connect-service-targets.query';
import {
  migrateConnectCertificateMutation,
  updateConnectGatewayServicesMutation,
  updateConnectTunnelPageMutation,
} from '~/components/ConnectTunnel/graphql/connect-tunnel.mutation';
import { connectTunnelPageQuery } from '~/components/ConnectTunnel/graphql/connect-tunnel.query';

const { t } = useI18n();
const accountHeadingId = useId();
const { result, loading, error, refetch, query } = useQuery(connectTunnelPageQuery, null, {
  fetchPolicy: 'network-only',
  pollInterval: 5000,
});
const {
  result: serviceTargetsResult,
  loading: serviceTargetsLoading,
  error: serviceTargetsError,
  refetch: refetchServiceTargets,
} = useQuery(connectServiceTargetsQuery, { skipCache: false }, { fetchPolicy: 'cache-and-network' });
const { mutate } = useMutation(updateConnectTunnelPageMutation);
const { mutate: saveServices } = useMutation(updateConnectGatewayServicesMutation);
const servicesError = ref('');
const servicesSaved = ref(false);
const gatewayApplying = ref(false);
const gatewayApplyingRevision = ref<number | null>(null);
let gatewayApplyingTimeout: ReturnType<typeof setTimeout> | undefined;
const { mutate: migrateCertificate } = useMutation(migrateConnectCertificateMutation);
const saving = ref(false);
const state = computed(() => result.value?.connectTunnelSettings);
const saveError = ref('');
const saved = ref(false);

function stopGatewayLoader() {
  gatewayApplying.value = false;
  gatewayApplyingRevision.value = null;
  if (gatewayApplyingTimeout) clearTimeout(gatewayApplyingTimeout);
  gatewayApplyingTimeout = undefined;
}

watch(state, (value) => {
  if (!gatewayApplying.value || !value || gatewayApplyingRevision.value === null) return;
  if (value.gateway.revision < gatewayApplyingRevision.value) return;
  const ready =
    !value.tunnelRemoteAccessEnabled ||
    (!value.gateway.pending &&
      value.status.gateway === 'ready' &&
      value.status.routeState === 'ready' &&
      ['idle', 'connected', 'tunnel_idle'].includes(value.status.tunnel));
  if (ready) stopGatewayLoader();
});
onBeforeUnmount(stopGatewayLoader);

async function save(input: ConnectTunnelSettingsInput) {
  if (saving.value) return;
  saving.value = true;
  saved.value = false;
  saveError.value = '';
  query.value?.stopPolling();
  try {
    const response = await mutate({ input });
    if (!response?.data) throw new Error(t('connectTunnel.saveFailed'));
    await refetch();
    saved.value = true;
  } catch (failure) {
    saveError.value = failure instanceof Error ? failure.message : t('connectTunnel.saveFailed');
    // A multi-feature update can partially succeed. Reload the authoritative state on failure.
    await Promise.resolve(refetch()).catch(() => undefined);
  } finally {
    saving.value = false;
    query.value?.startPolling(5000);
  }
}

async function updateServices(input: ConnectGatewaySettingsInput) {
  if (saving.value) return;
  saving.value = true;
  gatewayApplying.value = true;
  gatewayApplyingRevision.value = input.expectedRevision + 1;
  if (gatewayApplyingTimeout) clearTimeout(gatewayApplyingTimeout);
  gatewayApplyingTimeout = setTimeout(stopGatewayLoader, 30_000);
  servicesSaved.value = false;
  servicesError.value = '';
  query.value?.stopPolling();
  try {
    const response = await saveServices({ input });
    if (!response?.data) throw new Error(t('connectTunnel.saveFailed'));
    servicesSaved.value = true;
  } catch (failure) {
    stopGatewayLoader();
    servicesError.value = failure instanceof Error ? failure.message : t('connectTunnel.saveFailed');
  } finally {
    await Promise.resolve(refetch()).catch(() => undefined);
    saving.value = false;
    query.value?.startPolling(5000);
  }
}

async function migrate(confirmationToken: string) {
  if (saving.value || state.value?.certificateMigration.status === 'running') return;
  saving.value = true;
  saved.value = false;
  saveError.value = '';
  try {
    const response = await migrateCertificate({ confirmationToken });
    if (!response?.data) throw new Error(t('connectTunnel.migration.requestFailed'));
  } catch (failure) {
    saveError.value =
      failure instanceof Error ? failure.message : t('connectTunnel.migration.requestFailed');
  } finally {
    // A lost response does not mean the command failed. Refresh status without resending it.
    await Promise.resolve(refetch()).catch(() => undefined);
    saving.value = false;
  }
}
</script>

<template>
  <div class="connect-tunnel-page mx-auto max-w-4xl space-y-8 p-4 text-base">
    <header class="flex items-start gap-4">
      <figure
        class="from-unraid-red to-orange mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-r"
        aria-hidden="true"
      >
        <BrandMark gradient-start="#fff" gradient-stop="#fff" class="h-9 w-9 p-[6px]" />
      </figure>
      <div class="min-w-0 space-y-2">
        <h1 class="text-2xl font-semibold">{{ t('connectTunnel.title') }}</h1>
        <p class="text-muted-foreground max-w-2xl">{{ t('connectTunnel.description') }}</p>
        <a class="text-primary inline-flex items-center gap-1.5 underline" href="/Settings/Connect">
          <Cog6ToothIcon class="h-4 w-4" aria-hidden="true" />
          {{ t('connectTunnel.apiSettings') }}
        </a>
      </div>
    </header>
    <UAlert
      v-if="state?.previewMode"
      color="warning"
      variant="subtle"
      icon="i-lucide-flask-conical"
      :description="t('connectTunnel.previewMode')"
      role="status"
    />
    <section
      class="border-border bg-muted/10 flex items-start gap-4 rounded-xl border p-5"
      :aria-labelledby="accountHeadingId"
    >
      <div class="bg-primary/10 text-primary rounded-lg p-2.5" aria-hidden="true">
        <UserCircleIcon class="h-6 w-6" />
      </div>
      <div class="min-w-0 flex-1 space-y-3">
        <h2 :id="accountHeadingId" class="text-lg font-semibold">
          {{ t('connectSettings.accountStatusLabel') }}
        </h2>
        <Auth allow-sign-out />
      </div>
    </section>
    <p v-if="loading && !state" role="status">{{ t('connectTunnel.loading') }}</p>
    <div v-if="error" role="alert" class="mb-6 space-y-3">
      <p>{{ t('connectTunnel.loadFailed') }}</p>
      <Button variant="outline" @click="refetch()">{{ t('connectTunnel.retry') }}</Button>
    </div>
    <ConnectTunnelPanel
      v-if="state"
      :state="state"
      :saving="saving"
      :unavailable="Boolean(error)"
      :error="saveError"
      :saved="saved"
      @save="save"
      @migrate="migrate"
    >
      <template #services>
        <ConnectServicesPanel
          :state="state"
          :providers="result?.oidcProviders ?? []"
          :service-targets="serviceTargetsResult?.docker?.containers ?? []"
          :service-targets-loading="serviceTargetsLoading"
          :service-targets-error="Boolean(serviceTargetsError)"
          :saving="saving"
          :applying="gatewayApplying"
          :unavailable="Boolean(error)"
          :error="servicesError"
          :saved="servicesSaved"
          @save="updateServices"
          @refresh-targets="refetchServiceTargets({ skipCache: true })"
        />
      </template>
    </ConnectTunnelPanel>
  </div>
</template>

<style scoped>
.connect-tunnel-page :deep(p),
.connect-tunnel-page :deep(label),
.connect-tunnel-page :deep(summary),
.connect-tunnel-page :deep(code),
.connect-tunnel-page :deep(h1),
.connect-tunnel-page :deep(h2),
.connect-tunnel-page :deep(h3),
.connect-tunnel-page :deep(h4),
.connect-tunnel-page :deep(h5) {
  text-align: start;
  text-align-last: auto;
  word-spacing: normal;
}
</style>
