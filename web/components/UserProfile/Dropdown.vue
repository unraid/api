<script lang="ts" setup>
import { ref } from 'vue';

import {
  DropdownMenuArrow,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'radix-vue';

import type { ComposerTranslation } from 'vue-i18n';

import useTeleport from '~/composables/useTeleport';
import { useServerStore } from '~/store/server';

defineProps<{ t: ComposerTranslation }>();

const { state } = storeToRefs(useServerStore());
const open = ref(false);
const { teleportTarget, determineTeleportTarget } = useTeleport();

const showLaunchpad = computed(() => state.value === 'ENOKEYFILE');

const onOpenChange = (newOpen: boolean) => {
  if (newOpen) {
    determineTeleportTarget();
  }
  open.value = newOpen;
};
</script>

<template>
  <div class="relative">
    <DropdownMenuRoot v-model:open="open" @update:open="onOpenChange">
      <DropdownMenuTrigger class="outline-none">
        <slot name="trigger" />
      </DropdownMenuTrigger>
      <DropdownMenuPortal :to="teleportTarget as HTMLElement">
        <DropdownMenuContent
          class="text-foreground bg-popover rounded-md shadow-lg min-w-[300px] max-w-[350px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          :side-offset="4"
          :align="'end'"
          :side="'bottom'"
        >
          <DropdownMenuArrow class="fill-popover text-popover-foreground w-5 h-3" />
          <UpcDropdownLaunchpad v-if="showLaunchpad" :t="t" />
          <UpcDropdownContent v-else :t="t" />
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  </div>
</template>
