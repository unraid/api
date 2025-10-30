<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';

import { Button } from '@unraid/ui';
import { GET_DOCKER_CONTAINERS } from '@/components/Docker/docker-containers.query';
import DockerContainersTable from '@/components/Docker/DockerContainersTable.vue';
import { RefreshCwIcon } from 'lucide-vue-next';

import type { DockerContainer, FlatOrganizerEntry } from '@/composables/gql/graphql';

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
  };
}>(GET_DOCKER_CONTAINERS, {
  fetchPolicy: 'cache-and-network',
});

const containers = computed<DockerContainer[]>(() => []);
const flatEntries = computed(() => result.value?.docker?.organizer?.views?.[0]?.flatEntries || []);
const rootFolderId = computed(() => result.value?.docker?.organizer?.views?.[0]?.rootId || 'root');
const viewPrefs = computed(() => result.value?.docker?.organizer?.views?.[0]?.prefs || null);

const handleRefresh = async () => {
  await refetch({ skipCache: true });
};
</script>

<template>
  <div class="docker-container-overview rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-900">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-semibold">Docker Containers</h2>
      <Button variant="outline" size="sm" @click="handleRefresh" :disabled="loading">
        <RefreshCwIcon class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
        Refresh
      </Button>
    </div>

    <div v-if="error" class="text-red-500">Error loading container data: {{ error.message }}</div>

    <DockerContainersTable
      :containers="containers"
      :flat-entries="flatEntries"
      :root-folder-id="rootFolderId"
      :view-prefs="viewPrefs"
      :loading="loading"
      @created-folder="handleRefresh"
    />
  </div>
</template>

<style scoped>
.docker-container-overview {
  min-height: 400px;
}
</style>
