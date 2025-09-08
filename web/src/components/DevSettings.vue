<script lang="ts" setup>
import { CogIcon } from '@heroicons/vue/24/solid';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@unraid/ui';

import DummyServerSwitcher from '~/components/DummyServerSwitcher.vue';
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button type="button" size="icon" class="fixed right-4 bottom-4 z-50 rounded-full bg-teal-500"
        ><CogIcon class="size-6"
      /></Button>
    </PopoverTrigger>
    <PopoverContent>
      <DummyServerSwitcher />
    </PopoverContent>
  </Popover>
</template>
