import { reactive } from 'vue';
import { useSubscription } from '@vue/apollo-composable';

import { DOCKER_STATS_SUBSCRIPTION } from '@/components/Docker/docker-stats.subscription';

import type { DockerContainerStats } from '@/composables/gql/graphql';

export function useDockerContainerStats() {
  const containerStats = reactive(new Map<string, DockerContainerStats>());

  const { onResult: onStatsResult } = useSubscription(DOCKER_STATS_SUBSCRIPTION, null, () => ({
    fetchPolicy: 'network-only',
  }));

  onStatsResult((result) => {
    const stat = result.data?.dockerContainerStats as DockerContainerStats | undefined;
    if (stat && stat.id) {
      containerStats.set(stat.id, stat);
    }
  });

  function getStats(containerId: string): DockerContainerStats | undefined {
    return containerStats.get(containerId);
  }

  function clearStats() {
    containerStats.clear();
  }

  return {
    containerStats,
    getStats,
    clearStats,
  };
}
