<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMutation, useQuery } from '@vue/apollo-composable';

import ContainerOverviewCard from '@/components/Docker/ContainerOverviewCard.vue';
import ContainerSizesModal from '@/components/Docker/ContainerSizesModal.vue';
import { GET_DOCKER_CONTAINERS } from '@/components/Docker/docker-containers.query';
import { RESET_DOCKER_TEMPLATE_MAPPINGS } from '@/components/Docker/docker-reset-template-mappings.mutation';
import DockerAutostartSettings from '@/components/Docker/DockerAutostartSettings.vue';
import DockerConsoleViewer from '@/components/Docker/DockerConsoleViewer.vue';
import DockerContainersTable from '@/components/Docker/DockerContainersTable.vue';
import DockerOrphanedAlert from '@/components/Docker/DockerOrphanedAlert.vue';
import DockerPortConflictsAlert from '@/components/Docker/DockerPortConflictsAlert.vue';
import DockerSidebarTree from '@/components/Docker/DockerSidebarTree.vue';
import DockerEdit from '@/components/Docker/Edit.vue';
import DockerOverview from '@/components/Docker/Overview.vue';
import DockerPreview from '@/components/Docker/Preview.vue';
import SingleDockerLogViewer from '@/components/Docker/SingleDockerLogViewer.vue';
import LogViewerToolbar from '@/components/Logs/LogViewerToolbar.vue';
import { useDockerConsoleSessions } from '@/composables/useDockerConsoleSessions';
import { useDockerEditNavigation } from '@/composables/useDockerEditNavigation';
import { stripLeadingSlash } from '@/utils/docker';
import { useAutoAnimate } from '@formkit/auto-animate/vue';

import type {
  DockerPortConflictsResult,
  LanPortConflict,
  PortConflictContainer,
} from '@/components/Docker/docker-port-conflicts.types';
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
const showSizesModal = ref(false);

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

const { result, loading, error, refetch } = useQuery<{
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
    portConflicts: DockerPortConflictsResult;
  };
}>(GET_DOCKER_CONTAINERS, {
  fetchPolicy: 'cache-and-network',
  variables: { skipCache: true },
});

const flatEntries = computed<FlatOrganizerEntry[]>(
  () => result.value?.docker?.organizer?.views?.[0]?.flatEntries || []
);
const rootFolderId = computed(() => result.value?.docker?.organizer?.views?.[0]?.rootId || 'root');
const viewPrefs = computed(() => result.value?.docker?.organizer?.views?.[0]?.prefs || null);

const containers = computed<DockerContainer[]>(() => result.value?.docker?.containers || []);

const orphanedContainers = computed<DockerContainer[]>(() =>
  containers.value.filter((c) => c.isOrphaned)
);

const portConflicts = computed<DockerPortConflictsResult | null>(() => {
  const dockerData = result.value?.docker;
  return dockerData?.portConflicts ?? null;
});

const lanPortConflicts = computed<LanPortConflict[]>(() => portConflicts.value?.lanPorts ?? []);

const { getLegacyEditUrl, shouldUseLegacyEditPage } = useDockerEditNavigation();
const { hasActiveSession } = useDockerConsoleSessions();

function getOrganizerEntryIdByContainerId(containerId: string): string | null {
  const entry = flatEntries.value.find(
    (candidate) =>
      candidate.type === 'container' &&
      (candidate.meta as DockerContainer | undefined)?.id === containerId
  );
  return entry?.id ?? null;
}

function focusContainerFromConflict(containerId: string) {
  const entryId = getOrganizerEntryIdByContainerId(containerId);
  if (!entryId) return;
  setActiveContainer(entryId);
}

function handleConflictContainerAction(conflictContainer: PortConflictContainer) {
  focusContainerFromConflict(conflictContainer.id);
}

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

const { mutate: resetTemplateMappings, loading: resettingMappings } = useMutation(
  RESET_DOCKER_TEMPLATE_MAPPINGS
);

async function handleResetAndRetry() {
  try {
    await resetTemplateMappings();
    await refetch({ skipCache: true });
  } catch (e) {
    console.error('Failed to reset Docker template mappings:', e);
  }
}

function handleTableRowClick(payload: {
  id: string;
  type: 'container' | 'folder';
  name: string;
  containerId?: string;
  tab?: 'overview' | 'settings' | 'logs' | 'console';
}) {
  if (payload.type !== 'container') return;
  if (payload.tab) {
    if (activeId.value === payload.id) {
      legacyPaneTab.value = payload.tab;
    } else {
      pendingTab.value = payload.tab;
    }
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

const legacyEditUrl = computed(() => getLegacyEditUrl(activeContainer.value));

// Details data (mix of real and placeholder until specific queries exist)
const detailsItem = computed(() => {
  const name = stripLeadingSlash(activeContainer.value?.names?.[0]) || 'Unknown';
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
  const lanIpPort = Array.isArray(c.lanIpPorts) && c.lanIpPorts.length ? c.lanIpPorts.join(', ') : '—';
  const ports = c.ports?.length ? c.ports : c.templatePorts;
  return {
    network,
    lanIpPort,
    containerIp: c.networkSettings?.IPAddress || '—',
    uptime: '—',
    containerPort: ports?.[0]?.privatePort?.toString?.() || '—',
    creationDate: new Date((c.created || 0) * 1000).toISOString(),
    containerId: c.id,
    maintainer: c.labels?.maintainer || '—',
  };
});

const isDetailsLoading = computed(() => loading.value || isSwitching.value);
const isDetailsDisabled = computed(() => props.disabled || isSwitching.value);

const legacyPaneTab = ref<'overview' | 'settings' | 'logs' | 'console'>('overview');
const pendingTab = ref<'overview' | 'settings' | 'logs' | 'console' | null>(null);
const logFilterText = ref('');
const logAutoScroll = ref(true);
const logViewerRef = ref<InstanceType<typeof SingleDockerLogViewer> | null>(null);

watch(activeId, (newId, oldId) => {
  if (pendingTab.value) {
    legacyPaneTab.value = pendingTab.value;
    pendingTab.value = null;
  } else if (!oldId && newId) {
    // Only reset to 'overview' when opening details from overview (no previous container)
    legacyPaneTab.value = 'overview';
  }
  // Otherwise keep the current tab when switching between containers
  logFilterText.value = '';
});

const activeContainerName = computed(() => {
  return stripLeadingSlash(activeContainer.value?.names?.[0]);
});

const hasActiveConsoleSession = computed(() => {
  const name = activeContainerName.value;
  return name ? hasActiveSession(name) : false;
});

const legacyPaneTabs = computed(() => [
  { label: 'Overview', value: 'overview' as const },
  { label: 'Settings', value: 'settings' as const },
  { label: 'Logs', value: 'logs' as const },
  {
    label: 'Console',
    value: 'console' as const,
    badge: hasActiveConsoleSession.value
      ? { color: 'success' as const, variant: 'solid' as const, class: 'w-2 h-2 p-0 min-w-0' }
      : undefined,
  },
]);

function handleLogRefresh() {
  logViewerRef.value?.refreshLogContent();
}

const [_transitionContainerRef] = useAutoAnimate({
  duration: 200,
  easing: 'ease-in-out',
});
</script>

<template>
  <div ref="_transitionContainerRef">
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
              color="neutral"
              variant="outline"
              icon="i-lucide-list-checks"
              :disabled="loading"
              @click="openAutostartSettings"
            >
              Customize Start Order
            </UButton>
            <UButton
              size="xs"
              color="neutral"
              variant="outline"
              icon="i-lucide-hard-drive"
              :disabled="props.disabled"
              @click="showSizesModal = true"
            >
              Container Size
            </UButton>
          </div>
        </div>
        <div v-if="orphanedContainers.length" class="mb-4">
          <DockerOrphanedAlert :orphaned-containers="orphanedContainers" @refresh="refreshContainers" />
        </div>
        <div v-if="lanPortConflicts.length" class="mb-4">
          <DockerPortConflictsAlert
            :lan-conflicts="lanPortConflicts"
            @container:select="handleConflictContainerAction"
          />
        </div>
        <UAlert
          v-if="error"
          color="error"
          title="Failed to load Docker containers"
          :description="error.message"
          icon="i-lucide-alert-circle"
          class="mb-4"
        >
          <template #actions>
            <div class="flex gap-2">
              <UButton size="xs" variant="soft" :loading="loading" @click="refetch({ skipCache: true })"
                >Retry</UButton
              >
              <UButton
                size="xs"
                variant="outline"
                :loading="resettingMappings"
                @click="handleResetAndRetry"
                >Reset &amp; Retry</UButton
              >
            </div>
          </template>
        </UAlert>
        <div>
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
        </div>
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
      <UCard :ui="{ body: 'p-4 sm:px-0 sm:py-4' }">
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

      <div v-if="shouldUseLegacyEditPage">
        <UCard class="flex min-h-[60vh] flex-col">
          <template #header>
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <UButton
                    size="xs"
                    variant="ghost"
                    icon="i-lucide-arrow-left"
                    @click="goBackToOverview"
                  />
                  <div class="font-medium">
                    {{ stripLeadingSlash(activeContainer?.names?.[0]) || 'Container' }}
                  </div>
                </div>
                <UBadge
                  v-if="activeContainer?.state"
                  :label="activeContainer.state"
                  color="primary"
                  variant="subtle"
                />
              </div>
              <UTabs
                v-model="legacyPaneTab"
                :items="legacyPaneTabs"
                variant="link"
                color="primary"
                size="md"
                :ui="{ list: 'gap-1' }"
              />
            </div>
          </template>
          <div
            v-show="legacyPaneTab === 'overview'"
            :class="['relative', { 'pointer-events-none opacity-50': isDetailsDisabled }]"
          >
            <ContainerOverviewCard :container="activeContainer" :loading="isDetailsLoading" />
          </div>
          <div
            v-show="legacyPaneTab === 'settings'"
            :class="['relative min-h-[60vh]', { 'pointer-events-none opacity-50': isDetailsDisabled }]"
          >
            <iframe
              v-if="legacyEditUrl"
              :key="legacyEditUrl"
              :src="legacyEditUrl"
              class="h-[70vh] w-full border-0"
              loading="lazy"
            />
            <div v-else class="flex h-[70vh] items-center justify-center text-sm text-neutral-500">
              Unable to load container settings for this entry.
            </div>
            <div v-if="isDetailsLoading" class="bg-card/60 absolute inset-0 grid place-items-center">
              <USkeleton class="h-6 w-6" />
            </div>
          </div>
          <div
            v-show="legacyPaneTab === 'logs'"
            :class="['flex h-[70vh] flex-col', { 'pointer-events-none opacity-50': isDetailsDisabled }]"
          >
            <LogViewerToolbar
              v-model:filter-text="logFilterText"
              :show-refresh="false"
              @refresh="handleLogRefresh"
            />
            <SingleDockerLogViewer
              v-if="activeContainer"
              ref="logViewerRef"
              :container-name="stripLeadingSlash(activeContainer.names?.[0])"
              :auto-scroll="logAutoScroll"
              :client-filter="logFilterText"
              class="h-full flex-1"
            />
          </div>
          <div
            v-show="legacyPaneTab === 'console'"
            :class="['h-[70vh]', { 'pointer-events-none opacity-50': isDetailsDisabled }]"
          >
            <DockerConsoleViewer
              v-if="activeContainer"
              :container-name="activeContainerName"
              :shell="activeContainer.shell ?? 'sh'"
              class="h-full"
            />
          </div>
        </UCard>
      </div>

      <div v-else>
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
          <div :class="['h-96', { 'pointer-events-none opacity-50': isDetailsDisabled }]">
            <SingleDockerLogViewer
              v-if="activeContainer"
              :container-name="stripLeadingSlash(activeContainer.names?.[0])"
              :auto-scroll="true"
              class="h-full"
            />
          </div>
        </UCard>
      </div>
    </div>
    <ContainerSizesModal v-model:open="showSizesModal" />
  </div>
</template>
