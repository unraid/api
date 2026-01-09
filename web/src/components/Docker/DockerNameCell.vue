<script setup lang="ts">
import { computed } from 'vue';

import { stripLeadingSlash } from '@/utils/docker';

import type { DockerContainer } from '@/composables/gql/graphql';
import type { TreeRow } from '@/composables/useTreeData';

const props = defineProps<{
  row: TreeRow<DockerContainer>;
  depth: number;
  isUpdating: boolean;
  isBusy?: boolean;
  canExpand?: boolean;
  isExpanded?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle-expand'): void;
}>();

const treeRow = computed(() => props.row);

const displayName = computed(() => stripLeadingSlash(treeRow.value.name));

const hasUpdate = computed(() => {
  return (
    treeRow.value.type === 'container' &&
    (treeRow.value.meta?.isUpdateAvailable || treeRow.value.meta?.isRebuildReady)
  );
});

function handleToggleExpand(e: Event) {
  e.stopPropagation();
  emit('toggle-expand');
}
</script>

<template>
  <div class="flex items-center truncate" :data-row-id="treeRow.id">
    <span class="inline-block" :style="{ width: `calc(${depth} * 2.8rem)` }" />

    <UButton
      v-if="canExpand"
      color="neutral"
      size="md"
      variant="ghost"
      icon="i-lucide-chevron-down"
      square
      aria-label="Expand"
      class="flex-shrink-0 p-0"
      data-stop-row-click="true"
      :ui="{
        leadingIcon: [
          'transition-transform mt-0.5 -rotate-90',
          isExpanded ? 'duration-200 rotate-0' : '',
        ],
      }"
      @click="handleToggleExpand"
    />

    <img
      v-if="treeRow.icon"
      :src="treeRow.icon"
      :class="['mr-2 h-5 w-5 flex-shrink-0', canExpand ? 'ml-2' : '']"
      alt=""
      @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
    />
    <UIcon
      v-else
      :name="treeRow.type === 'folder' ? 'i-lucide-folder' : 'i-lucide-box'"
      :class="['mr-2 h-5 w-5 flex-shrink-0 text-gray-500', canExpand ? 'ml-2' : '']"
    />

    <span class="max-w-[40ch] truncate font-medium">{{ displayName }}</span>

    <UIcon
      v-if="isBusy || isUpdating"
      name="i-lucide-loader-2"
      class="text-primary-500 ml-2 h-4 w-4 flex-shrink-0 animate-spin"
    />

    <UIcon
      v-if="hasUpdate"
      name="i-lucide-circle-arrow-up"
      class="text-warning-500 ml-2 h-4 w-4 flex-shrink-0"
      title="Update available"
    />
  </div>
</template>
