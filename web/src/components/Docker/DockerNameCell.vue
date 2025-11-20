<script setup lang="ts">
import { computed } from 'vue';

import { ContainerState } from '@/composables/gql/graphql';
import { getFirstLanIp, openLanIpInNewTab } from '@/utils/docker';

import type { DockerContainer } from '@/composables/gql/graphql';
import type { TreeRow } from '@/composables/useTreeData';

const props = defineProps<{
  row: TreeRow<DockerContainer>;
  depth: number;
  isUpdating: boolean;
  isPopoverOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:isPopoverOpen', value: boolean): void;
  (e: 'update-container'): void;
}>();

const treeRow = computed(() => props.row);

const hasUpdate = computed(() => {
  return (
    treeRow.value.type === 'container' &&
    (treeRow.value.meta?.isUpdateAvailable || treeRow.value.meta?.isRebuildReady)
  );
});

const firstLanIp = computed(() =>
  treeRow.value.type === 'container' ? getFirstLanIp(treeRow.value.meta) : null
);

const canOpenLanIp = computed(
  () => Boolean(firstLanIp.value) && treeRow.value.meta?.state === ContainerState.RUNNING
);

function handleOpenLanIp(event: Event) {
  event.stopPropagation();
  if (firstLanIp.value) {
    openLanIpInNewTab(firstLanIp.value);
  }
}

function handleOpenLanIpKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  event.stopPropagation();
  if (firstLanIp.value) {
    openLanIpInNewTab(firstLanIp.value);
  }
}

function handleUpdateConfirm(e: Event) {
  e.stopPropagation();
  if (props.isUpdating) return;
  emit('update:isPopoverOpen', false);
  emit('update-container');
}

function handleUpdateCancel(e: Event) {
  e.stopPropagation();
  emit('update:isPopoverOpen', false);
}

function handlePopoverUpdate(value: boolean) {
  emit('update:isPopoverOpen', value);
}
</script>

<template>
  <div class="flex items-center truncate" :data-row-id="treeRow.id">
    <span class="inline-block" :style="{ width: `calc(${depth} * 1rem)` }" />

    <img
      v-if="treeRow.icon"
      :src="treeRow.icon"
      class="mr-2 h-5 w-5 flex-shrink-0"
      alt=""
      @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
    />
    <UIcon
      v-else
      :name="treeRow.type === 'folder' ? 'i-lucide-folder' : 'i-lucide-box'"
      class="mr-2 h-5 w-5 flex-shrink-0 text-gray-500"
    />

    <span class="max-w-[40ch] truncate font-medium">{{ treeRow.name }}</span>

    <UBadge
      v-if="canOpenLanIp && firstLanIp"
      color="primary"
      variant="subtle"
      size="sm"
      class="ml-2 cursor-pointer select-none"
      role="button"
      tabindex="0"
      data-stop-row-click="true"
      @click="handleOpenLanIp"
      @keydown="handleOpenLanIpKeydown"
    >
      Open
    </UBadge>

    <UPopover
      v-if="hasUpdate"
      data-stop-row-click="true"
      :open="isPopoverOpen"
      @update:open="handlePopoverUpdate"
    >
      <UBadge
        color="warning"
        variant="subtle"
        size="sm"
        class="ml-2 cursor-pointer"
        :class="isUpdating ? 'pointer-events-none opacity-60' : ''"
        data-stop-row-click="true"
      >
        Update
      </UBadge>

      <template #content>
        <div class="space-y-3 p-3">
          <p class="text-sm">
            {{
              treeRow.meta?.isUpdateAvailable
                ? 'Update available. Update container?'
                : 'Rebuild ready. Update container?'
            }}
          </p>
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="outline" size="sm" @click="handleUpdateCancel">
              Cancel
            </UButton>
            <UButton size="sm" :loading="isUpdating" :disabled="isUpdating" @click="handleUpdateConfirm">
              Confirm
            </UButton>
          </div>
        </div>
      </template>
    </UPopover>

    <UIcon
      v-if="isUpdating"
      name="i-lucide-loader-2"
      class="text-primary-500 ml-2 h-4 w-4 animate-spin"
    />
  </div>
</template>
