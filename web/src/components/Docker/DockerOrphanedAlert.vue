<script setup lang="ts">
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';

import { stripLeadingSlash } from '@/utils/docker';
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
    docker {
      removeContainer(id: $id)
    }
  }
`;

const { mutate: removeContainer, loading: removing } = useMutation(REMOVE_CONTAINER);
const errorMessage = ref<string | null>(null);

async function handleRemove(container: DockerContainer) {
  const name = stripLeadingSlash(container.names[0]) || 'container';
  if (!confirm(`Are you sure you want to remove orphaned container "${name}"?`)) return;

  errorMessage.value = null;
  try {
    await removeContainer({ id: container.id }, { context: { noRetry: true } });
    emit('refresh');
  } catch (e) {
    console.error('Failed to remove container', e);
    const message = e instanceof Error ? e.message : 'Unknown error';
    errorMessage.value = `Failed to remove "${name}": ${message}`;
  }
}

function dismissError() {
  errorMessage.value = null;
}

function formatContainerName(container: DockerContainer): string {
  return stripLeadingSlash(container.names[0]) || 'Unknown';
}
</script>

<template>
  <div class="border-warning/30 bg-warning/10 rounded-lg border p-4 text-sm">
    <div class="flex items-start gap-3">
      <UIcon
        name="i-lucide-triangle-alert"
        class="text-warning mt-1 h-5 w-5 flex-shrink-0"
        aria-hidden="true"
      />
      <div class="w-full space-y-3">
        <div>
          <p class="text-foreground text-sm font-semibold">
            Orphaned containers detected ({{ orphanedContainers.length }})
          </p>
          <p class="text-muted-foreground text-xs">
            These containers do not have a corresponding template. You can remove them if they are no
            longer needed.
          </p>
        </div>
        <div
          v-if="errorMessage"
          class="bg-destructive/10 border-destructive/30 text-destructive flex items-start gap-2 rounded-md border p-2 text-xs"
        >
          <UIcon name="i-lucide-circle-x" class="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span class="flex-1">{{ errorMessage }}</span>
          <button
            type="button"
            class="hover:text-destructive/80 flex-shrink-0"
            title="Dismiss"
            @click="dismissError"
          >
            <UIcon name="i-lucide-x" class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div class="space-y-4">
          <div class="space-y-2">
            <div class="border-warning/30 bg-card/80 rounded-md border p-3">
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="container in orphanedContainers"
                  :key="container.id"
                  type="button"
                  class="border-warning/50 bg-warning/20 text-foreground hover:bg-warning/30 focus-visible:ring-warning/50 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition focus-visible:ring-2 focus-visible:outline-none"
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
