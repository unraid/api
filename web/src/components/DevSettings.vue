<script lang="ts" setup>
import { CogIcon } from '@heroicons/vue/24/solid';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@unraid/ui';

import DummyServerSwitcher from '~/components/DummyServerSwitcher.vue';
import LocaleSwitcher from '~/components/LocaleSwitcher.vue';
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button type="button" size="icon" class="fixed right-4 bottom-4 z-50 rounded-full bg-teal-500"
        ><CogIcon class="size-6"
      /></Button>
    </PopoverTrigger>
    <PopoverContent class="w-80">
      <div class="space-y-4">
        <LocaleSwitcher />
        <DummyServerSwitcher />
      </div>
    </PopoverContent>
  </Popover>
</template>
