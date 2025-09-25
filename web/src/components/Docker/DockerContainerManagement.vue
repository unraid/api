<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';

import { GET_DOCKER_CONTAINERS } from '@/components/Docker/docker-containers.query';
import DockerContainersTable from '@/components/Docker/DockerContainersTable.vue';
import DockerSidebarTree from '@/components/Docker/DockerSidebarTree.vue';
import DockerEdit from '@/components/Docker/Edit.vue';
import DockerLogs from '@/components/Docker/Logs.vue';
import DockerOverview from '@/components/Docker/Overview.vue';
import DockerPreview from '@/components/Docker/Preview.vue';

import type {
  DockerContainer,
  OrganizerContainerResource,
  ResolvedOrganizerEntry,
  ResolvedOrganizerFolder,
} from '@/composables/gql/graphql';

interface Props {
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const selectedIds = ref<string[]>([]);
const activeId = ref<string | null>(null);
const isSwitching = ref(false);

const { result, loading, refetch } = useQuery<{
  docker: {
    id: string;
    organizer: {
      views: Array<{
        id: string;
        name: string;
        root: ResolvedOrganizerEntry;
      }>;
    };
    containers: DockerContainer[];
  };
}>(GET_DOCKER_CONTAINERS, {
  fetchPolicy: 'cache-and-network',
  variables: { skipCache: true },
});

const organizerRoot = computed(
  () => result.value?.docker?.organizer?.views?.[0]?.root as ResolvedOrganizerFolder | undefined
);

const containers = computed<DockerContainer[]>(() => result.value?.docker?.containers || []);

function findContainerResourceById(
  entry: ResolvedOrganizerEntry | undefined,
  id: string
): ResolvedOrganizerEntry | undefined {
  if (!entry) return undefined;
  if (entry.__typename === 'OrganizerContainerResource' && entry.id === id) return entry;
  if (entry.__typename === 'ResolvedOrganizerFolder') {
    for (const child of entry.children as ResolvedOrganizerEntry[]) {
      const found = findContainerResourceById(child, id);
      if (found) return found;
    }
  }
  return undefined;
}

function handleTableRowClick(payload: {
  id: string;
  type: 'container' | 'folder';
  name: string;
  containerId?: string;
}) {
  if (payload.type !== 'container') return;
  if (activeId.value === payload.id) return;
  isSwitching.value = true;
  activeId.value = payload.id;
  setTimeout(() => {
    isSwitching.value = false;
  }, 150);
}

function handleUpdateSelectedIds(ids: string[]) {
  selectedIds.value = ids;
}

function goBackToOverview() {
  activeId.value = null;
}

function handleSidebarClick(item: { id: string }) {
  if (activeId.value === item.id) return;
  isSwitching.value = true;
  activeId.value = item.id;
  // simulate fetch delay; real details queries will naturally set loading
  setTimeout(() => {
    isSwitching.value = false;
  }, 150);
}

function handleSidebarSelect(item: { id: string; selected: boolean }) {
  const set = new Set(selectedIds.value);
  if (item.selected) set.add(item.id);
  else set.delete(item.id);
  selectedIds.value = Array.from(set);
}

const activeContainer = computed<DockerContainer | undefined>(() => {
  if (!activeId.value) return undefined;
  const resource = findContainerResourceById(
    organizerRoot.value,
    activeId.value
  ) as OrganizerContainerResource;
  return resource?.meta as DockerContainer | undefined;
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
      <div class="mb-4 flex items-center justify-between">
        <div class="text-base font-medium">Docker Containers</div>
        <UButton
          size="xs"
          variant="ghost"
          icon="i-lucide-refresh-cw"
          :loading="loading"
          @click="refetch({ skipCache: true })"
        />
      </div>
      <DockerContainersTable
        :containers="containers"
        :organizer-root="organizerRoot"
        :loading="loading"
        :active-id="activeId"
        :selected-ids="selectedIds"
        @created-folder="() => refetch({ skipCache: true })"
        @row:click="handleTableRowClick"
        @update:selectedIds="handleUpdateSelectedIds"
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
              @click="refetch({ skipCache: true })"
            />
          </div>
        </template>
        <USkeleton v-if="loading && !organizerRoot" class="h-6 w-full" :ui="{ rounded: 'rounded' }" />
        <DockerSidebarTree
          v-else
          :root="organizerRoot"
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
