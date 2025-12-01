<script setup lang="ts">
import { computed } from 'vue';

import {
  formatContainerIp,
  formatExternalPorts,
  formatImage,
  formatInternalPorts,
  formatNetwork,
  formatUptime,
  formatVolumes,
  getFirstLanIp,
  openLanIpInNewTab,
  stripLeadingSlash,
} from '@/utils/docker';

import type { DockerContainer } from '@/composables/gql/graphql';

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

const lanIpAddress = computed(() => getFirstLanIp(props.container));

function handleOpenWebUI() {
  if (lanIpAddress.value) {
    openLanIpInNewTab(lanIpAddress.value);
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
          class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
        >
          <img :src="container.iconUrl" :alt="containerName" class="h-12 w-12 object-contain" />
        </div>
        <div
          v-else
          class="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800"
        >
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
          <p v-if="imageVersion" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Version: {{ imageVersion }}
          </p>
          <p v-if="uptime" class="text-sm text-gray-500 dark:text-gray-400">Uptime: {{ uptime }}</p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <UButton
            v-if="lanIpAddress"
            size="sm"
            variant="soft"
            color="primary"
            icon="i-lucide-external-link"
            @click="handleOpenWebUI"
          >
            Web UI
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
            <p class="text-xs text-gray-500 dark:text-gray-400">Mode</p>
            <p class="font-mono text-sm">{{ networkMode || '—' }}</p>
          </div>
          <div v-if="containerIps.length">
            <p class="text-xs text-gray-500 dark:text-gray-400">Container IP</p>
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
            <p class="text-xs text-gray-500 dark:text-gray-400">External</p>
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
            <p class="text-xs text-gray-500 dark:text-gray-400">Internal</p>
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
          <p
            v-if="!externalPorts.length && !internalPorts.length"
            class="text-sm text-gray-500 dark:text-gray-400"
          >
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
            <p class="text-xs text-gray-500 dark:text-gray-400">ID</p>
            <p class="font-mono text-sm">{{ shortId }}</p>
          </div>
          <div v-if="createdDate">
            <p class="text-xs text-gray-500 dark:text-gray-400">Created</p>
            <p class="text-sm">{{ createdDate }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Auto Start</p>
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
    <UCard v-if="volumeMounts">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-hard-drive" class="h-4 w-4 text-gray-500" />
          <span class="text-sm font-medium">Volume Mounts</span>
        </div>
      </template>
      <div class="max-h-32 overflow-y-auto">
        <p class="font-mono text-xs break-all text-gray-600 dark:text-gray-300">
          {{ volumeMounts }}
        </p>
      </div>
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
