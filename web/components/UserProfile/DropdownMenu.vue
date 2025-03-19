<script lang="ts" setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';

import { DropdownMenu, DropdownMenuArrow, DropdownMenuContent, DropdownMenuTrigger } from '@unraid/ui';
import useTeleport from '@/composables/useTeleport';

import type { ComposerTranslation } from 'vue-i18n';

import { useServerStore } from '~/store/server';

defineProps<{ t: ComposerTranslation }>();

const { teleportTarget } = useTeleport();
const { state } = storeToRefs(useServerStore());
const open = ref(false);

const showLaunchpad = computed(() => state.value === 'ENOKEYFILE');
</script>

<template>
  <DropdownMenu v-model:open="open">
    <DropdownMenuTrigger>
      <slot name="trigger" />
    </DropdownMenuTrigger>
    <DropdownMenuContent
      :to="teleportTarget as HTMLElement"
      :side-offset="4"
      :align="'end'"
      :side="'bottom'"
      class="w-[350px]"
    >
      <UpcDropdownLaunchpad v-if="showLaunchpad" :t="t" />
      <UpcDropdownContent v-else :t="t" />
      <DropdownMenuArrow :rounded="true" :width="16" :height="12" class="fill-popover" />
    </DropdownMenuContent>
  </DropdownMenu>
</template>
