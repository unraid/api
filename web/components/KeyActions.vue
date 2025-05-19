<script lang="ts" setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { BrandButton, cn } from '@unraid/ui';

import type { ServerStateDataAction } from '~/types/server';
import { useI18n } from '~/composables/useI18n';

import { useServerStore } from '~/store/server';

const { $gettext } = useI18n();

const props = withDefaults(
  defineProps<{
    actions?: ServerStateDataAction[];
    filterBy?: string[] | undefined;
    filterOut?: string[] | undefined;
    maxWidth?: boolean;
  }>(),
  {
    actions: undefined,
    filterBy: undefined,
    filterOut: undefined,
    maxWidth: false,
  }
);

const { keyActions } = storeToRefs(useServerStore());

const computedActions = computed((): ServerStateDataAction[] | undefined =>
  props.actions ? props.actions : keyActions.value
);

const filteredKeyActions = computed((): ServerStateDataAction[] | undefined => {
  if (!computedActions.value || (!props.filterOut && !props.filterBy)) {
    return computedActions.value;
  }

  return computedActions.value.filter((action: { name: string }) => {
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
        :class="cn('w-full', props.maxWidth ? 'sm:max-w-300px' : '')"
        :disabled="action?.disabled"
        :external="action?.external"
        :href="action?.href"
        :icon="action.icon"
        :icon-right="ArrowTopRightOnSquareIcon"
        :icon-right-hover-display="true"
        :text="$gettext(action.text)"
        :title="action.title ? $gettext(action.title) : undefined"
        @click="action.click?.()"
      />
    </li>
  </ul>
</template>
