<script lang="ts" setup>
import { ref } from 'vue';

import { DropdownMenu, DropdownMenuArrow, DropdownMenuContent, DropdownMenuTrigger } from '@unraid/ui';

const open = ref(false);
</script>

<template>
  <DropdownMenu v-model:open="open">
    <DropdownMenuTrigger>
      <slot name="trigger" />
    </DropdownMenuTrigger>
    <DropdownMenuContent :side-offset="4" :align="'end'" :side="'bottom'" class="w-[350px]">
      <UpcDropdownContent />
      <DropdownMenuArrow :rounded="true" class="fill-popover" :height="10" :width="16" />
    </DropdownMenuContent>
  </DropdownMenu>
</template>
