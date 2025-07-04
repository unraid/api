<script lang="ts" setup>
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
} from '@unraid/ui';

import DummyServerSwitcher from '~/components/DummyServerSwitcher.vue';

import { CogIcon } from '@heroicons/vue/24/solid';
</script>

<template>
    <Popover>
    <PopoverTrigger as-child>
      <Button type="button" size="icon" class="fixed bottom-4 right-4 rounded-full bg-teal-500 z-50"><CogIcon class="size-6" /></Button>
    </PopoverTrigger>
    <PopoverContent>
        <DummyServerSwitcher />
    </PopoverContent>
  </Popover>

  
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '~/assets/main.css';
</style>
