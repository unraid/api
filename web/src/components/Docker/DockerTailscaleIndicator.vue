<script setup lang="ts">
import { computed, ref, resolveComponent } from 'vue';
import { useLazyQuery } from '@vue/apollo-composable';

import { GET_CONTAINER_TAILSCALE_STATUS } from '@/components/Docker/docker-tailscale-status.query';
import { ContainerState } from '@/composables/gql/graphql';

import type { TailscaleStatus } from '@/composables/gql/graphql';

interface Props {
  containerId: string;
  containerState: ContainerState | string;
}

const props = defineProps<Props>();

const UPopover = resolveComponent('UPopover');
const UBadge = resolveComponent('UBadge');
const UIcon = resolveComponent('UIcon');
const USkeleton = resolveComponent('USkeleton');

const popoverOpen = ref(false);
const hasFetched = ref(false);

const { load, result, loading, error, refetch } = useLazyQuery(GET_CONTAINER_TAILSCALE_STATUS, {
  id: props.containerId,
});

const status = computed<TailscaleStatus | null | undefined>(
  () => result.value?.docker?.container?.tailscaleStatus
);

const isRunning = computed(() => props.containerState === ContainerState.RUNNING);
const isRefreshing = ref(false);

function handlePopoverOpen(open: boolean) {
  popoverOpen.value = open;
  if (open && !hasFetched.value && isRunning.value) {
    hasFetched.value = true;
    load();
  }
}

async function handleRefresh() {
  if (isRefreshing.value || loading.value) return;
  isRefreshing.value = true;
  try {
    await refetch({ id: props.containerId });
  } finally {
    isRefreshing.value = false;
  }
}

function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString();
}

function getOnlineStatusIcon(online: boolean | null | undefined): string {
  return online ? 'i-lucide-check-circle' : 'i-lucide-x-circle';
}

function getOnlineStatusColor(online: boolean | null | undefined): string {
  return online ? 'text-green-500' : 'text-red-500';
}
</script>

<template>
  <component :is="UPopover" :open="popoverOpen" @update:open="handlePopoverOpen">
    <template #default>
      <button
        data-stop-row-click="true"
        class="inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
        :title="isRunning ? 'Click for Tailscale details' : 'Container not running'"
        @click.stop
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="6" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="12" r="3" />
          <circle cx="12" cy="18" r="3" />
          <circle cx="6" cy="6" r="1.5" opacity="0.5" />
          <circle cx="18" cy="6" r="1.5" opacity="0.5" />
          <circle cx="6" cy="18" r="1.5" opacity="0.5" />
          <circle cx="18" cy="18" r="1.5" opacity="0.5" />
        </svg>
        <component :is="UBadge" v-if="isRunning" color="success" variant="subtle" size="xs">
          Enabled
        </component>
        <component :is="UBadge" v-else color="neutral" variant="subtle" size="xs"> Offline </component>
      </button>
    </template>

    <template #content>
      <div class="max-w-sm min-w-[280px] p-3" data-stop-row-click="true" @click.stop>
        <div class="mb-2 flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="6" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="12" r="3" />
            <circle cx="12" cy="18" r="3" />
          </svg>
          <span class="flex-1 font-medium">Tailscale Status</span>
          <button
            v-if="isRunning && hasFetched"
            class="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            :disabled="loading || isRefreshing"
            title="Refresh status"
            @click.stop="handleRefresh"
          >
            <component
              :is="UIcon"
              name="i-lucide-refresh-cw"
              :class="['h-4 w-4', { 'animate-spin': loading || isRefreshing }]"
            />
          </button>
        </div>

        <div v-if="!isRunning" class="text-sm text-gray-500">Container is not running</div>

        <div v-else-if="loading" class="space-y-2">
          <component :is="USkeleton" class="h-4 w-full" />
          <component :is="USkeleton" class="h-4 w-3/4" />
          <component :is="USkeleton" class="h-4 w-1/2" />
        </div>

        <div v-else-if="error" class="text-sm text-red-500">Failed to fetch Tailscale status</div>

        <div v-else-if="status" class="space-y-1.5 text-sm">
          <!-- Needs Login Warning -->
          <div
            v-if="status.backendState === 'NeedsLogin'"
            class="mb-2 rounded bg-amber-50 p-2 dark:bg-amber-900/20"
          >
            <div class="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
              <component :is="UIcon" name="i-lucide-alert-triangle" class="h-4 w-4" />
              Authentication Required
            </div>
            <p class="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Tailscale needs to be authenticated in this container.
            </p>
            <a
              v-if="status.authUrl"
              :href="status.authUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-1 inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
              @click.stop
            >
              Click here to authenticate
              <component :is="UIcon" name="i-lucide-external-link" class="h-3 w-3" />
            </a>
          </div>

          <!-- Backend State (if not Running) -->
          <div
            v-if="
              status.backendState &&
              status.backendState !== 'Running' &&
              status.backendState !== 'NeedsLogin'
            "
            class="flex items-center justify-between"
          >
            <span class="text-gray-500">State</span>
            <component :is="UBadge" color="warning" variant="subtle" size="xs">
              {{ status.backendState }}
            </component>
          </div>

          <!-- Online Status -->
          <div class="flex items-center justify-between">
            <span class="text-gray-500">Online</span>
            <span class="flex items-center gap-1">
              <component
                :is="UIcon"
                :name="getOnlineStatusIcon(status.online)"
                :class="['h-4 w-4', getOnlineStatusColor(status.online)]"
              />
              <span>{{ status.online ? 'Yes' : 'No' }}</span>
            </span>
          </div>

          <!-- Version -->
          <div v-if="status.version" class="flex items-center justify-between">
            <span class="text-gray-500">Version</span>
            <span class="flex items-center gap-1">
              v{{ status.version }}
              <component
                :is="UBadge"
                v-if="status.updateAvailable"
                color="warning"
                variant="subtle"
                size="xs"
              >
                Update available
              </component>
            </span>
          </div>

          <!-- Hostname -->
          <div v-if="status.hostname" class="flex items-center justify-between">
            <span class="text-gray-500">Hostname</span>
            <span class="max-w-[160px] truncate" :title="status.hostname">
              {{ status.hostname }}
            </span>
          </div>

          <!-- DNS Name (if different from hostname) -->
          <div
            v-if="status.dnsName && status.dnsName.split('.')[0] !== status.hostname"
            class="flex items-center justify-between"
          >
            <span class="text-gray-500">DNS Name</span>
            <span class="max-w-[160px] truncate text-orange-500" :title="status.dnsName">
              {{ status.dnsName }}
            </span>
          </div>

          <!-- DERP Relay -->
          <div v-if="status.relayName || status.relay" class="flex items-center justify-between">
            <span class="text-gray-500">DERP Relay</span>
            <span>{{ status.relayName || status.relay }}</span>
          </div>

          <!-- Tailscale IPs -->
          <div v-if="status.tailscaleIps?.length" class="flex items-start justify-between">
            <span class="text-gray-500">Addresses</span>
            <div class="text-right">
              <div v-for="ip in status.tailscaleIps" :key="ip" class="font-mono text-xs">
                {{ ip }}
              </div>
            </div>
          </div>

          <!-- Routes -->
          <div v-if="status.primaryRoutes?.length" class="flex items-start justify-between">
            <span class="text-gray-500">Routes</span>
            <div class="text-right">
              <div v-for="route in status.primaryRoutes" :key="route" class="font-mono text-xs">
                {{ route }}
              </div>
            </div>
          </div>

          <!-- Exit Node Status -->
          <div class="flex items-center justify-between">
            <span class="text-gray-500">Exit Node</span>
            <span v-if="status.isExitNode" class="text-green-500">This is an exit node</span>
            <span v-else-if="status.exitNodeStatus">
              <component
                :is="UIcon"
                :name="getOnlineStatusIcon(status.exitNodeStatus.online)"
                :class="['h-4 w-4', getOnlineStatusColor(status.exitNodeStatus.online)]"
              />
              {{ status.exitNodeStatus.tailscaleIps?.[0]?.split('/')[0] || 'Connected' }}
            </span>
            <span v-else class="text-gray-400">Not configured</span>
          </div>

          <!-- WebUI URL -->
          <div v-if="status.webUiUrl" class="flex items-center justify-between">
            <span class="text-gray-500">WebUI</span>
            <a
              :href="status.webUiUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1 text-blue-500 hover:underline"
              @click.stop
            >
              Open
              <component :is="UIcon" name="i-lucide-external-link" class="h-3 w-3" />
            </a>
          </div>

          <!-- Key Expiry -->
          <div v-if="status.keyExpiry" class="flex items-center justify-between">
            <span class="text-gray-500">Key Expiry</span>
            <span :class="status.keyExpired ? 'text-red-500' : ''">
              {{ formatDate(status.keyExpiry) }}
              <template v-if="status.keyExpiryDays !== null && status.keyExpiryDays !== undefined">
                <span v-if="status.keyExpired" class="text-red-500">(Expired!)</span>
                <span v-else class="text-gray-400">({{ status.keyExpiryDays }} days)</span>
              </template>
            </span>
          </div>
        </div>

        <div v-else class="text-sm text-gray-500">No Tailscale data available</div>
      </div>
    </template>
  </component>
</template>
