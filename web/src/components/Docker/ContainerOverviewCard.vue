<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useLazyQuery } from '@vue/apollo-composable';

import { GET_CONTAINER_TAILSCALE_STATUS } from '@/components/Docker/docker-tailscale-status.query';
import {
  formatContainerIp,
  formatExternalPorts,
  formatImage,
  formatInternalPorts,
  formatNetwork,
  formatUptime,
  formatVolumes,
  getWebUiUrl,
  openLanIpInNewTab,
  stripLeadingSlash,
} from '@/utils/docker';

import type { DockerContainer, TailscaleStatus } from '@/composables/gql/graphql';

interface Props {
  container: DockerContainer | null | undefined;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const containerName = computed(() => stripLeadingSlash(props.container?.names?.[0]) || 'Unknown');

const stateColor = computed(() => {
  const state = props.container?.state;
  if (state === 'RUNNING') return 'success';
  if (state === 'PAUSED') return 'warning';
  if (state === 'EXITED') return 'error';
  return 'neutral';
});

const stateLabel = computed(() => {
  const state = props.container?.state;
  if (!state) return 'Unknown';
  return state.charAt(0).toUpperCase() + state.slice(1);
});

const imageVersion = computed(() => formatImage(props.container));
const networkMode = computed(() => formatNetwork(props.container));
const containerIps = computed(() => formatContainerIp(props.container));
const internalPorts = computed(() => formatInternalPorts(props.container));
const externalPorts = computed(() => formatExternalPorts(props.container));
const volumeMounts = computed(() => formatVolumes(props.container));
const uptime = computed(() => formatUptime(props.container));

const createdDate = computed(() => {
  if (!props.container?.created) return null;
  return new Date(props.container.created * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const shortId = computed(() => {
  if (!props.container?.id) return null;
  const id = props.container.id;
  const colonIndex = id.indexOf(':');
  const rawId = colonIndex > -1 ? id.slice(colonIndex + 1) : id;
  return rawId.slice(0, 12);
});

const hasUpdateAvailable = computed(() => Boolean(props.container?.isUpdateAvailable));
const hasRebuildReady = computed(() => Boolean(props.container?.isRebuildReady));

const projectUrl = computed(() => props.container?.projectUrl || null);
const registryUrl = computed(() => props.container?.registryUrl || null);
const supportUrl = computed(() => props.container?.supportUrl || null);

const webUiAddress = computed(() => getWebUiUrl(props.container));

const isTailscaleEnabled = computed(() => Boolean(props.container?.tailscaleEnabled));
const isContainerRunning = computed(() => props.container?.state === 'RUNNING');

const {
  load: loadTailscaleStatus,
  result: tailscaleResult,
  loading: tailscaleLoading,
  refetch: refetchTailscale,
} = useLazyQuery(GET_CONTAINER_TAILSCALE_STATUS, () => ({
  id: props.container?.id,
}));

const tailscaleStatus = computed<TailscaleStatus | null | undefined>(
  () => tailscaleResult.value?.docker?.container?.tailscaleStatus
);

const tailscaleFetched = ref(false);
const tailscaleRefreshing = ref(false);

watch(
  () => props.container?.id,
  (newId, oldId) => {
    if (newId && newId !== oldId && isTailscaleEnabled.value && isContainerRunning.value) {
      tailscaleFetched.value = false;
      loadTailscaleStatus();
      tailscaleFetched.value = true;
    }
  },
  { immediate: true }
);

async function handleRefreshTailscale() {
  if (tailscaleRefreshing.value || tailscaleLoading.value) return;
  tailscaleRefreshing.value = true;
  try {
    await refetchTailscale({ id: props.container?.id });
  } finally {
    tailscaleRefreshing.value = false;
  }
}

function formatTailscaleDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString();
}

function handleOpenWebUI() {
  if (webUiAddress.value) {
    openLanIpInNewTab(webUiAddress.value);
  }
}

function handleOpenTailscaleWebUI() {
  if (tailscaleStatus.value?.webUiUrl) {
    window.open(tailscaleStatus.value.webUiUrl, '_blank');
  }
}

function handleOpenTailscaleAuth() {
  if (tailscaleStatus.value?.authUrl) {
    window.open(tailscaleStatus.value.authUrl, '_blank');
  }
}
</script>

<template>
  <div v-if="loading" class="space-y-4">
    <UCard variant="subtle">
      <div class="flex items-start gap-4">
        <USkeleton class="h-16 w-16 shrink-0 rounded-lg" />
        <div class="min-w-0 flex-1 space-y-2">
          <USkeleton class="h-6 w-48" />
          <USkeleton class="h-4 w-32" />
          <USkeleton class="h-4 w-24" />
        </div>
      </div>
    </UCard>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UCard v-for="i in 3" :key="i">
        <template #header>
          <USkeleton class="h-4 w-24" />
        </template>
        <div class="space-y-2">
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-3/4" />
        </div>
      </UCard>
    </div>
  </div>
  <div v-else class="space-y-4">
    <!-- Header Card -->
    <UCard variant="subtle">
      <div class="flex items-start gap-4">
        <div
          v-if="container?.iconUrl"
          class="bg-muted flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg"
        >
          <img :src="container.iconUrl" :alt="containerName" class="h-12 w-12 object-contain" />
        </div>
        <div v-else class="bg-muted flex h-16 w-16 shrink-0 items-center justify-center rounded-lg">
          <UIcon name="i-lucide-box" class="h-8 w-8 text-gray-400" />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="truncate text-lg font-semibold">{{ containerName }}</h3>
            <UBadge :color="stateColor" variant="subtle" size="sm">
              {{ stateLabel }}
            </UBadge>
            <UBadge v-if="hasUpdateAvailable" color="info" variant="soft" size="sm">
              Update Available
            </UBadge>
            <UBadge v-if="hasRebuildReady" color="warning" variant="soft" size="sm">
              Rebuild Ready
            </UBadge>
          </div>
          <p v-if="imageVersion" class="text-muted-foreground mt-1 text-sm">
            Version: {{ imageVersion }}
          </p>
          <p v-if="uptime" class="text-muted-foreground text-sm">Uptime: {{ uptime }}</p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <UButton
            v-if="webUiAddress"
            size="sm"
            variant="soft"
            color="primary"
            icon="i-lucide-external-link"
            @click="handleOpenWebUI"
          >
            WebUI
          </UButton>
          <UButton
            v-if="tailscaleStatus?.webUiUrl"
            size="sm"
            variant="soft"
            color="primary"
            icon="i-lucide-external-link"
            @click="handleOpenTailscaleWebUI"
          >
            WebUI (Tailscale)
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Stats Grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <!-- Network Card -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-network" class="h-4 w-4 text-gray-500" />
            <span class="text-sm font-medium">Network</span>
          </div>
        </template>
        <div class="space-y-2">
          <div>
            <p class="text-muted-foreground text-xs">Mode</p>
            <p class="font-mono text-sm">{{ networkMode || '—' }}</p>
          </div>
          <div v-if="containerIps.length">
            <p class="text-muted-foreground text-xs">Container IP</p>
            <p v-for="ip in containerIps" :key="ip" class="font-mono text-sm">{{ ip }}</p>
          </div>
        </div>
      </UCard>

      <!-- Ports Card -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-plug" class="h-4 w-4 text-gray-500" />
            <span class="text-sm font-medium">Ports</span>
          </div>
        </template>
        <div class="space-y-2">
          <div v-if="externalPorts.length">
            <p class="text-muted-foreground text-xs">External</p>
            <div class="flex flex-wrap gap-1">
              <UBadge
                v-for="port in externalPorts.slice(0, 5)"
                :key="port"
                :label="port"
                color="neutral"
                variant="subtle"
                size="xs"
              />
              <UBadge
                v-if="externalPorts.length > 5"
                :label="`+${externalPorts.length - 5}`"
                color="neutral"
                variant="soft"
                size="xs"
              />
            </div>
          </div>
          <div v-if="internalPorts.length">
            <p class="text-muted-foreground text-xs">Internal</p>
            <div class="flex flex-wrap gap-1">
              <UBadge
                v-for="port in internalPorts.slice(0, 5)"
                :key="port"
                :label="port"
                color="neutral"
                variant="subtle"
                size="xs"
              />
              <UBadge
                v-if="internalPorts.length > 5"
                :label="`+${internalPorts.length - 5}`"
                color="neutral"
                variant="soft"
                size="xs"
              />
            </div>
          </div>
          <p v-if="!externalPorts.length && !internalPorts.length" class="text-muted-foreground text-sm">
            No ports exposed
          </p>
        </div>
      </UCard>

      <!-- Container Info Card -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-info" class="h-4 w-4 text-gray-500" />
            <span class="text-sm font-medium">Container Info</span>
          </div>
        </template>
        <div class="space-y-2">
          <div v-if="shortId">
            <p class="text-muted-foreground text-xs">ID</p>
            <p class="font-mono text-sm">{{ shortId }}</p>
          </div>
          <div v-if="createdDate">
            <p class="text-muted-foreground text-xs">Created</p>
            <p class="text-sm">{{ createdDate }}</p>
          </div>
          <div>
            <p class="text-muted-foreground text-xs">Auto Start</p>
            <UBadge
              :label="container?.autoStart ? 'Enabled' : 'Disabled'"
              :color="container?.autoStart ? 'success' : 'neutral'"
              variant="subtle"
              size="xs"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Volumes Card (if any) -->
    <UCard v-if="volumeMounts.length">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-hard-drive" class="h-4 w-4 text-gray-500" />
          <span class="text-sm font-medium">Volume Mounts</span>
          <UBadge :label="String(volumeMounts.length)" color="neutral" variant="subtle" size="xs" />
        </div>
      </template>
      <div class="max-h-48 space-y-2 overflow-y-auto">
        <div v-for="(mount, index) in volumeMounts" :key="index" class="bg-muted/50 rounded-md p-2">
          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-folder" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
            <div class="min-w-0 flex-1 space-y-1">
              <p class="text-foreground truncate font-mono text-xs" :title="mount.split(' → ')[0]">
                {{ mount.split(' → ')[0] }}
              </p>
              <div class="flex items-center gap-1">
                <UIcon name="i-lucide-arrow-right" class="h-3 w-3 shrink-0 text-gray-400" />
                <p
                  class="text-muted-foreground truncate font-mono text-xs"
                  :title="mount.split(' → ')[1]"
                >
                  {{ mount.split(' → ')[1] }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Tailscale Card -->
    <UCard v-if="isTailscaleEnabled">
      <template #header>
        <div class="flex items-center gap-2">
          <svg class="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="6" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="12" r="3" />
            <circle cx="12" cy="18" r="3" />
          </svg>
          <span class="flex-1 text-sm font-medium">Tailscale</span>
          <button
            v-if="tailscaleFetched"
            class="hover:bg-muted rounded p-1"
            :disabled="tailscaleLoading || tailscaleRefreshing"
            title="Refresh Tailscale status"
            @click="handleRefreshTailscale"
          >
            <UIcon
              name="i-lucide-refresh-cw"
              :class="['h-3.5 w-3.5', { 'animate-spin': tailscaleLoading || tailscaleRefreshing }]"
            />
          </button>
        </div>
      </template>

      <!-- Not running state -->
      <div v-if="!isContainerRunning" class="text-sm text-gray-500">Container is not running</div>

      <!-- Loading state -->
      <div v-else-if="tailscaleLoading && !tailscaleStatus" class="space-y-2">
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-3/4" />
        <USkeleton class="h-4 w-1/2" />
      </div>

      <!-- Tailscale status -->
      <div v-else-if="tailscaleStatus" class="space-y-3">
        <!-- Needs Login Warning -->
        <div v-if="tailscaleStatus.backendState === 'NeedsLogin'" class="bg-warning/10 rounded p-2">
          <div class="text-warning flex items-center gap-1 text-sm font-medium">
            <UIcon name="i-lucide-alert-triangle" class="h-4 w-4" />
            Authentication Required
          </div>
          <p class="text-warning mt-1 text-xs">Tailscale needs to be authenticated in this container.</p>
          <UButton
            v-if="tailscaleStatus.authUrl"
            size="xs"
            variant="soft"
            color="warning"
            class="mt-2"
            @click="handleOpenTailscaleAuth"
          >
            Authenticate
            <UIcon name="i-lucide-external-link" class="ml-1 h-3 w-3" />
          </UButton>
        </div>

        <!-- Status info -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground text-xs">Status</span>
            <UBadge
              :label="tailscaleStatus.online ? 'Online' : 'Offline'"
              :color="tailscaleStatus.online ? 'success' : 'error'"
              variant="subtle"
              size="xs"
            />
          </div>

          <div v-if="tailscaleStatus.version" class="flex items-center justify-between">
            <span class="text-muted-foreground text-xs">Version</span>
            <span class="flex items-center gap-1 text-sm">
              v{{ tailscaleStatus.version }}
              <UBadge
                v-if="tailscaleStatus.updateAvailable"
                label="Update"
                color="warning"
                variant="soft"
                size="xs"
              />
            </span>
          </div>

          <div v-if="tailscaleStatus.hostname" class="flex items-center justify-between">
            <span class="text-muted-foreground text-xs">Hostname</span>
            <span class="max-w-[140px] truncate text-sm" :title="tailscaleStatus.hostname">
              {{ tailscaleStatus.hostname }}
            </span>
          </div>

          <div v-if="tailscaleStatus.dnsName" class="flex items-center justify-between">
            <span class="text-muted-foreground text-xs">DNS Name</span>
            <span class="max-w-[140px] truncate text-sm" :title="tailscaleStatus.dnsName">
              {{ tailscaleStatus.dnsName }}
            </span>
          </div>

          <div
            v-if="tailscaleStatus.relayName || tailscaleStatus.relay"
            class="flex items-center justify-between"
          >
            <span class="text-muted-foreground text-xs">DERP Relay</span>
            <span class="text-sm">{{ tailscaleStatus.relayName || tailscaleStatus.relay }}</span>
          </div>

          <div v-if="tailscaleStatus.tailscaleIps?.length" class="flex items-start justify-between">
            <span class="text-muted-foreground text-xs">IP Addresses</span>
            <div class="text-right">
              <p v-for="ip in tailscaleStatus.tailscaleIps" :key="ip" class="font-mono text-xs">
                {{ ip }}
              </p>
            </div>
          </div>

          <div v-if="tailscaleStatus.primaryRoutes?.length" class="flex items-start justify-between">
            <span class="text-muted-foreground text-xs">Routes</span>
            <div class="text-right">
              <p v-for="route in tailscaleStatus.primaryRoutes" :key="route" class="font-mono text-xs">
                {{ route }}
              </p>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-muted-foreground text-xs">Exit Node</span>
            <span v-if="tailscaleStatus.isExitNode" class="text-sm text-green-500"
              >This is an exit node</span
            >
            <span v-else-if="tailscaleStatus.exitNodeStatus" class="text-sm">
              {{ tailscaleStatus.exitNodeStatus.online ? 'Connected' : 'Offline' }}
            </span>
            <span v-else class="text-sm text-gray-400">Not configured</span>
          </div>

          <div v-if="tailscaleStatus.keyExpiry" class="flex items-center justify-between">
            <span class="text-muted-foreground text-xs">Key Expiry</span>
            <span :class="['text-sm', tailscaleStatus.keyExpired ? 'text-red-500' : '']">
              {{ formatTailscaleDate(tailscaleStatus.keyExpiry) }}
              <span v-if="tailscaleStatus.keyExpired" class="text-red-500">(Expired)</span>
              <span
                v-else-if="
                  tailscaleStatus.keyExpiryDays !== null && tailscaleStatus.keyExpiryDays !== undefined
                "
                class="text-gray-400"
              >
                ({{ tailscaleStatus.keyExpiryDays }}d)
              </span>
            </span>
          </div>
        </div>

        <!-- WebUI Button -->
        <UButton
          v-if="tailscaleStatus.webUiUrl"
          size="xs"
          variant="soft"
          color="primary"
          class="w-full"
          @click="handleOpenTailscaleWebUI"
        >
          <UIcon name="i-lucide-external-link" class="mr-1 h-3 w-3" />
          Open Tailscale WebUI
        </UButton>
      </div>

      <!-- No data -->
      <div v-else class="text-sm text-gray-500">No Tailscale data available</div>
    </UCard>

    <!-- Quick Links -->
    <UCard v-if="projectUrl || registryUrl || supportUrl">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-link" class="h-4 w-4 text-gray-500" />
          <span class="text-sm font-medium">Links</span>
        </div>
      </template>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-if="projectUrl"
          :to="projectUrl"
          target="_blank"
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-home"
          external
        >
          Project
        </UButton>
        <UButton
          v-if="registryUrl"
          :to="registryUrl"
          target="_blank"
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-package"
          external
        >
          Registry
        </UButton>
        <UButton
          v-if="supportUrl"
          :to="supportUrl"
          target="_blank"
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-life-buoy"
          external
        >
          Support
        </UButton>
      </div>
    </UCard>
  </div>
</template>
