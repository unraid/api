<script lang="ts" setup>
import { ref } from 'vue';

import { DropdownMenu, DropdownMenuArrow, DropdownMenuContent, DropdownMenuTrigger } from '@unraid/ui';
import useTeleport from '@/composables/useTeleport';

import type { ComposerTranslation } from 'vue-i18n';

defineProps<{ t: ComposerTranslation }>();

const { teleportTarget } = useTeleport();
const open = ref(false);
</script>

<template>
  <DropdownMenu v-model:open="open" :modal="false">
    <DropdownMenuTrigger>
      <slot name="trigger" />
    </DropdownMenuTrigger>
    <DropdownMenuContent
      :to="teleportTarget as HTMLElement"
      :side-offset="4"
      :align="'end'"
      :side="'bottom'"
      class="min-w-[300px] max-w-[300px] md:max-w-[350px]"
    >
      <UpcDropdownContent :t="t" />
      <DropdownMenuArrow :rounded="true" class="fill-popover" :height="10" :width="16" />
    </DropdownMenuContent>
  </DropdownMenu>
</template>
