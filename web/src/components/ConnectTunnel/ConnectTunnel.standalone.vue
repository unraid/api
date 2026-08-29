<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMutation, useQuery } from '@vue/apollo-composable';

import { Button } from '@unraid/ui';

import type { ConnectGatewaySettingsInput, ConnectTunnelSettingsInput } from '~/composables/gql/graphql';

import Auth from '~/components/Auth.standalone.vue';
import ConnectServicesPanel from '~/components/ConnectTunnel/ConnectServicesPanel.vue';
import ConnectTunnelPanel from '~/components/ConnectTunnel/ConnectTunnelPanel.vue';
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
const { mutate } = useMutation(updateConnectTunnelPageMutation);
const { mutate: saveServices } = useMutation(updateConnectGatewayServicesMutation);
const servicesError = ref('');
const servicesSaved = ref(false);
const { mutate: migrateCertificate } = useMutation(migrateConnectCertificateMutation);
const saving = ref(false);
const state = computed(() => result.value?.connectTunnelSettings);
const saveError = ref('');
const saved = ref(false);

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
  servicesSaved.value = false;
  servicesError.value = '';
  query.value?.stopPolling();
  try {
    const response = await saveServices({ input });
    if (!response?.data) throw new Error(t('connectTunnel.saveFailed'));
    servicesSaved.value = true;
  } catch (failure) {
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
  <div class="mx-auto max-w-4xl space-y-8 p-4 text-base">
    <header class="space-y-2">
      <h1 class="text-2xl font-semibold">{{ t('connectTunnel.title') }}</h1>
      <p class="text-muted-foreground">{{ t('connectTunnel.description') }}</p>
      <a class="text-primary underline" href="/Settings/Connect">{{ t('connectTunnel.apiSettings') }}</a>
    </header>
    <section class="space-y-3" :aria-labelledby="accountHeadingId">
      <h2 :id="accountHeadingId" class="text-lg font-semibold">
        {{ t('connectSettings.accountStatusLabel') }}
      </h2>
      <Auth allow-sign-out />
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
    />
    <ConnectServicesPanel
      :providers="result?.oidcProviders ?? []"
      v-if="state"
      :state="state"
      :saving="saving"
      :unavailable="Boolean(error)"
      :error="servicesError"
      :saved="servicesSaved"
      @save="updateServices"
    />
  </div>
</template>
