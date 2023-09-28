<script lang="ts" setup>
import { storeToRefs } from 'pinia';

import { useServerStore } from '~/store/server';

const props = defineProps<{
  filterBy?: string[] | undefined;
  filterOut?: string[] | undefined;
  t: any;
}>();

const { keyActions } = storeToRefs(useServerStore());

const filteredKeyActions = computed(() => {
  if (!keyActions.value || (!props.filterOut && !props.filterBy)) return keyActions.value;

  return keyActions.value.filter((action: { name: string; }) => {
    return props.filterOut
      ? !props.filterOut?.includes(action.name)
      : props.filterBy?.includes(action.name);
  });
});
</script>

<template>
  <ul v-if="filteredKeyActions" class="flex flex-col gap-y-8px">
    <li v-for="action in filteredKeyActions" :key="action.name">
      <BrandButton
        class="w-full sm:max-w-300px"
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
