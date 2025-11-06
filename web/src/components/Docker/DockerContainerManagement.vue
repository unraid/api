<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuery } from '@vue/apollo-composable';

import { GET_DOCKER_CONTAINERS } from '@/components/Docker/docker-containers.query';
import DockerAutostartSettings from '@/components/Docker/DockerAutostartSettings.vue';
import DockerContainersTable from '@/components/Docker/DockerContainersTable.vue';
import DockerSidebarTree from '@/components/Docker/DockerSidebarTree.vue';
import DockerEdit from '@/components/Docker/Edit.vue';
import DockerLogs from '@/components/Docker/Logs.vue';
import DockerOverview from '@/components/Docker/Overview.vue';
import DockerPreview from '@/components/Docker/Preview.vue';
import { useDockerEditNavigation } from '@/composables/useDockerEditNavigation';

import type { DockerContainer, FlatOrganizerEntry } from '@/composables/gql/graphql';
import type { LocationQueryRaw } from 'vue-router';

interface Props {
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

function tryUseRoute(): ReturnType<typeof useRoute> | null {
  try {
    const maybeRoute = useRoute();
    return maybeRoute ?? null;
  } catch (_err) {
    return null;
  }
}

function tryUseRouter(): ReturnType<typeof useRouter> | null {
  try {
    const maybeRouter = useRouter();
    return maybeRouter ?? null;
  } catch (_err) {
    return null;
  }
}

const route = tryUseRoute();
const router = tryUseRouter();
const hasRouter = Boolean(route && router);

const selectedIds = ref<string[]>([]);
const activeId = ref<string | null>(null);
const isSwitching = ref(false);
const viewMode = ref<'overview' | 'autostart'>('overview');

const ROUTE_QUERY_KEY = 'container';
const SWITCH_DELAY_MS = 150;
let switchTimeout: ReturnType<typeof setTimeout> | null = null;
let syncingFromRoute = false;
let removePopstateListener: (() => void) | null = null;

function normalizeContainerQuery(value: unknown): string | null {
  if (Array.isArray(value))
    return value.find((entry) => typeof entry === 'string' && entry.length) || null;
  return typeof value === 'string' && value.length ? value : null;
}

function setActiveContainer(id: string | null) {
  if (activeId.value === id) return;

  if (switchTimeout) {
    clearTimeout(switchTimeout);
    switchTimeout = null;
  }

  if (id) {
    isSwitching.value = true;
    switchTimeout = setTimeout(() => {
      isSwitching.value = false;
      switchTimeout = null;
    }, SWITCH_DELAY_MS);
  } else {
    isSwitching.value = false;
  }

  activeId.value = id;
}

if (hasRouter) {
  watch(
    () => normalizeContainerQuery(route!.query[ROUTE_QUERY_KEY]),
    (routeId) => {
      if (routeId === activeId.value) return;
      syncingFromRoute = true;
      setActiveContainer(routeId);
      syncingFromRoute = false;
    },
    { immediate: true }
  );

  watch(activeId, (nextId) => {
    if (syncingFromRoute) return;
    const currentRouteId = normalizeContainerQuery(route!.query[ROUTE_QUERY_KEY]);
    if (nextId === currentRouteId) return;

    const nextQuery: LocationQueryRaw = { ...route!.query };
    if (nextId) nextQuery[ROUTE_QUERY_KEY] = nextId;
    else delete nextQuery[ROUTE_QUERY_KEY];

    router!.push({ path: route!.path, query: nextQuery, hash: route!.hash }).catch(() => {
      /* ignore redundant navigation */
    });
  });
} else if (typeof window !== 'undefined') {
  const readLocationQuery = () => {
    const params = new URLSearchParams(window.location.search);
    return normalizeContainerQuery(params.get(ROUTE_QUERY_KEY));
  };

  const initialId = readLocationQuery();
  if (initialId) {
    syncingFromRoute = true;
    setActiveContainer(initialId);
    syncingFromRoute = false;
  }

  const handlePopstate = () => {
    const idFromLocation = readLocationQuery();
    if (idFromLocation === activeId.value) return;
    syncingFromRoute = true;
    setActiveContainer(idFromLocation);
    syncingFromRoute = false;
  };

  window.addEventListener('popstate', handlePopstate);
  removePopstateListener = () => window.removeEventListener('popstate', handlePopstate);

  watch(activeId, (nextId) => {
    if (syncingFromRoute) return;
    const current = readLocationQuery();
    if (nextId === current) return;

    const url = new URL(window.location.href);
    if (nextId) url.searchParams.set(ROUTE_QUERY_KEY, nextId);
    else url.searchParams.delete(ROUTE_QUERY_KEY);
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
  });
}

onBeforeUnmount(() => {
  if (switchTimeout) {
    clearTimeout(switchTimeout);
    switchTimeout = null;
  }
  if (removePopstateListener) {
    removePopstateListener();
    removePopstateListener = null;
  }
});

const { result, loading, refetch } = useQuery<{
  docker: {
    id: string;
    organizer: {
      views: Array<{
        id: string;
        name: string;
        rootId: string;
        prefs?: Record<string, unknown> | null;
        flatEntries: FlatOrganizerEntry[];
      }>;
    };
    containers: DockerContainer[];
  };
}>(GET_DOCKER_CONTAINERS, {
  fetchPolicy: 'cache-and-network',
  variables: { skipCache: true },
});

const flatEntries = computed(() => result.value?.docker?.organizer?.views?.[0]?.flatEntries || []);
const rootFolderId = computed(() => result.value?.docker?.organizer?.views?.[0]?.rootId || 'root');
const viewPrefs = computed(() => result.value?.docker?.organizer?.views?.[0]?.prefs || null);

const containers = computed<DockerContainer[]>(() => result.value?.docker?.containers || []);

const { navigateToEditPage } = useDockerEditNavigation();

watch(activeId, (id) => {
  if (id && viewMode.value === 'autostart') {
    viewMode.value = 'overview';
  }
});

function openAutostartSettings() {
  if (props.disabled) return;
  viewMode.value = 'autostart';
}

function closeAutostartSettings() {
  viewMode.value = 'overview';
}

function handleAddContainerClick() {
  if (props.disabled) return;
  if (typeof window === 'undefined') return;

  const basePathFromRoute = hasRouter && route ? route.path : null;
  const rawPath =
    basePathFromRoute && basePathFromRoute !== '/' ? basePathFromRoute : window.location.pathname;
  const sanitizedPath = rawPath.replace(/\?.*$/, '').replace(/\/+$/, '');
  const withoutAdd = sanitizedPath.replace(/\/AddContainer$/i, '');
  const targetPath = withoutAdd ? `${withoutAdd}/AddContainer` : '/AddContainer';
  window.location.assign(targetPath);
}

async function refreshContainers() {
  await refetch({ skipCache: true });
}

function handleTableRowClick(payload: {
  id: string;
  type: 'container' | 'folder';
  name: string;
  containerId?: string;
}) {
  if (payload.type !== 'container') return;

  const entry = flatEntries.value.find((e) => e.id === payload.id && e.type === 'container');
  const container = entry?.meta as DockerContainer | undefined;

  if (navigateToEditPage(container)) {
    return;
  }

  setActiveContainer(payload.id);
}

function handleUpdateSelectedIds(ids: string[]) {
  selectedIds.value = ids;
}

function goBackToOverview() {
  setActiveContainer(null);
}

function handleSidebarClick(item: { id: string }) {
  setActiveContainer(item.id);
}

function handleSidebarSelect(item: { id: string; selected: boolean }) {
  const set = new Set(selectedIds.value);
  if (item.selected) set.add(item.id);
  else set.delete(item.id);
  selectedIds.value = Array.from(set);
}

const activeContainer = computed<DockerContainer | undefined>(() => {
  if (!activeId.value) return undefined;
  const entry = flatEntries.value.find((e) => e.id === activeId.value && e.type === 'container');
  return entry?.meta as DockerContainer | undefined;
});

// Details data (mix of real and placeholder until specific queries exist)
const detailsItem = computed(() => {
  const name = (activeContainer.value?.names?.[0] || '').replace(/^\//, '') || 'Unknown';
  return {
    id: activeContainer.value?.id || 'unknown',
    label: name,
    icon: 'i-lucide-box',
  };
});

const details = computed(() => {
  const c = activeContainer.value;
  if (!c) return undefined;
  const network = c.hostConfig?.networkMode || 'bridge';
  const publicPort = c.ports?.find((p) => p.publicPort)?.publicPort;
  return {
    network,
    lanIpPort: publicPort ? `127.0.0.1:${publicPort}` : '—',
    containerIp: c.networkSettings?.IPAddress || '—',
    uptime: '—',
    containerPort: c.ports?.[0]?.privatePort?.toString?.() || '—',
    creationDate: new Date((c.created || 0) * 1000).toISOString(),
    containerId: c.id,
    maintainer: c.labels?.maintainer || '—',
  };
});

const isDetailsLoading = computed(() => loading.value || isSwitching.value);
const isDetailsDisabled = computed(() => props.disabled || isSwitching.value);
</script>

<template>
  <div>
    <div v-if="!activeId">
      <template v-if="viewMode === 'overview'">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div class="text-base font-medium">Docker Containers</div>
          <div class="flex items-center gap-2">
            <UButton
              size="xs"
              variant="ghost"
              icon="i-lucide-refresh-cw"
              :loading="loading"
              @click="refreshContainers"
            />
            <UButton
              size="xs"
              color="primary"
              variant="solid"
              icon="i-lucide-plus"
              :disabled="props.disabled"
              @click="handleAddContainerClick"
            >
              Add Container
            </UButton>
            <UButton
              size="xs"
              variant="outline"
              icon="i-lucide-list-checks"
              :disabled="loading"
              @click="openAutostartSettings"
            >
              Customize Start Order
            </UButton>
          </div>
        </div>
        <DockerContainersTable
          :containers="containers"
          :flat-entries="flatEntries"
          :root-folder-id="rootFolderId"
          :view-prefs="viewPrefs"
          :loading="loading"
          :active-id="activeId"
          :selected-ids="selectedIds"
          @created-folder="refreshContainers"
          @row:click="handleTableRowClick"
          @update:selectedIds="handleUpdateSelectedIds"
        />
      </template>
      <DockerAutostartSettings
        v-else
        :containers="containers"
        :loading="loading"
        :refresh="refreshContainers"
        @close="closeAutostartSettings"
      />
    </div>

    <div v-else class="grid gap-6 md:grid-cols-[280px_1fr]">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="font-medium">Containers</div>
            <UButton
              size="xs"
              variant="ghost"
              icon="i-lucide-refresh-cw"
              :loading="loading"
              @click="refreshContainers"
            />
          </div>
        </template>
        <USkeleton v-if="loading" class="h-6 w-full" :ui="{ rounded: 'rounded' }" />
        <DockerSidebarTree
          v-else
          :containers="containers"
          :flat-entries="flatEntries"
          :root-folder-id="rootFolderId"
          :selected-ids="selectedIds"
          :active-id="activeId"
          :disabled="props.disabled || loading"
          @item:click="handleSidebarClick"
          @item:select="handleSidebarSelect"
        />
      </UCard>

      <div>
        <UCard class="mb-4">
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <UButton
                  size="xs"
                  variant="ghost"
                  icon="i-lucide-arrow-left"
                  @click="goBackToOverview"
                />
                <div class="font-medium">Overview</div>
              </div>
              <UBadge
                v-if="activeContainer?.state"
                :label="activeContainer.state"
                color="primary"
                variant="subtle"
              />
            </div>
          </template>
          <div class="relative">
            <div v-if="isDetailsLoading" class="pointer-events-none opacity-50">
              <DockerOverview :item="detailsItem" :details="details" />
            </div>
            <DockerOverview v-else :item="detailsItem" :details="details" />
            <div v-if="isDetailsLoading" class="absolute inset-0 grid place-items-center">
              <USkeleton class="h-6 w-6" />
            </div>
          </div>
        </UCard>

        <div class="3xl:grid-cols-2 grid gap-4">
          <UCard>
            <template #header>
              <div class="font-medium">Preview</div>
            </template>
            <div :class="{ 'pointer-events-none opacity-50': isDetailsDisabled }">
              <DockerPreview :item="detailsItem" :port="details?.containerPort || undefined" />
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="font-medium">Edit</div>
            </template>
            <div :class="{ 'pointer-events-none opacity-50': isDetailsDisabled }">
              <DockerEdit :item="detailsItem" />
            </div>
          </UCard>
        </div>

        <UCard class="mt-4">
          <template #header>
            <div class="font-medium">Logs</div>
          </template>
          <div :class="{ 'pointer-events-none opacity-50': isDetailsDisabled }">
            <DockerLogs :item="detailsItem" />
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
