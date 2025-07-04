<script lang="ts" setup>
import { ref } from 'vue';

import { DropdownMenu, DropdownMenuArrow, DropdownMenuContent, DropdownMenuTrigger } from '@unraid/ui';
import DropdownContent from './DropdownContent.vue';

import type { ComposerTranslation } from 'vue-i18n';

defineProps<{ t: ComposerTranslation }>();

const open = ref(false);
</script>

<template>
  <DropdownMenu v-model:open="open">
    <DropdownMenuTrigger>
      <slot name="trigger" />
    </DropdownMenuTrigger>
    <DropdownMenuContent :side-offset="4" :align="'end'" :side="'bottom'" class="w-[350px]">
      <DropdownContent :t="t" />
      <DropdownMenuArrow :rounded="true" class="fill-popover" :height="10" :width="16" />
    </DropdownMenuContent>
  </DropdownMenu>
</template>
