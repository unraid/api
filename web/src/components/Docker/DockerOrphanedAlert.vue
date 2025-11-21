<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable';

import gql from 'graphql-tag';

import type { DockerContainer } from '@/composables/gql/graphql';

interface Props {
  orphanedContainers: DockerContainer[];
}

withDefaults(defineProps<Props>(), {
  orphanedContainers: () => [],
});

const emit = defineEmits<{ (e: 'refresh'): void }>();

const REMOVE_CONTAINER = gql`
  mutation RemoveContainer($id: PrefixedID!) {
    removeContainer(id: $id)
  }
`;

const { mutate: removeContainer, loading: removing } = useMutation(REMOVE_CONTAINER);

async function handleRemove(container: DockerContainer) {
  const name = container.names[0]?.replace(/^\//, '') || 'container';
  if (!confirm(`Are you sure you want to remove orphaned container "${name}"?`)) return;

  try {
    await removeContainer({ id: container.id });
    emit('refresh');
  } catch (e) {
    console.error('Failed to remove container', e);
    // Simple alert for now, ideally use a toast notification service
    alert('Failed to remove container');
  }
}

function formatContainerName(container: DockerContainer): string {
  return container.names[0]?.replace(/^\//, '') || 'Unknown';
}
</script>

<template>
  <div
    class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/50 dark:bg-amber-400/10 dark:text-amber-100"
  >
    <div class="flex items-start gap-3">
      <UIcon
        name="i-lucide-triangle-alert"
        class="mt-1 h-5 w-5 flex-shrink-0 text-amber-500 dark:text-amber-300"
        aria-hidden="true"
      />
      <div class="w-full space-y-3">
        <div>
          <p class="text-sm font-semibold">
            Orphaned containers detected ({{ orphanedContainers.length }})
          </p>
          <p class="text-xs text-amber-900/80 dark:text-amber-100/80">
            These containers do not have a corresponding template. You can remove them if they are no
            longer needed.
          </p>
        </div>
        <div class="space-y-4">
          <div class="space-y-2">
            <div
              class="rounded-md border border-amber-200/70 bg-white/80 p-3 dark:border-amber-300/30 dark:bg-transparent"
            >
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="container in orphanedContainers"
                  :key="container.id"
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 transition hover:bg-amber-200 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none dark:border-amber-200/40 dark:bg-transparent dark:text-amber-100"
                  :title="`Remove ${formatContainerName(container)}`"
                  :disabled="removing"
                  @click="handleRemove(container)"
                >
                  <span>{{ formatContainerName(container) }}</span>
                  <UIcon name="i-lucide-trash-2" class="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
