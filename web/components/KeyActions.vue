<script lang="ts" setup>
import { storeToRefs } from 'pinia';

import { useServerStore } from '~/store/server';

defineProps<{
  t: any;
}>();

const { keyActions } = storeToRefs(useServerStore());
</script>

<template>
  <ul v-if="keyActions" class="flex flex-col gap-y-8px">
    <li v-for="action in keyActions" :key="action.name">
      <BrandButton
        class="w-full max-w-300px"
        :disabled="action?.disabled"
        :external="action?.external"
        :href="action?.href"
        :icon="action.icon"
        :text="t(action.text)"
        @click="action.click()"
      />
    </li>
  </ul>
</template>
