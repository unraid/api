<script setup lang="ts">
import { computed } from 'vue';
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { Button } from '@unraid/ui';
import type { ComposerTranslation } from 'vue-i18n';

import type { ServerStateDataAction } from '~/types/server';
import type { UserProfileLink } from '~/types/userProfile';

export interface Props {
  item: ServerStateDataAction | UserProfileLink;
  rounded?: boolean;
  t: ComposerTranslation;
}

const props = withDefaults(defineProps<Props>(), {
  rounded: true,
});

const showExternalIconOnHover = computed(() => props.item?.external && props.item.icon !== ArrowTopRightOnSquareIcon);
</script>

<template>
  <Button
    :as="item?.click ? 'button' : 'a'"
    :disabled="item?.disabled"
    :href="item?.href ?? null"
    :target="item?.external ? '_blank' : null"
    :rel="item?.external ? 'noopener noreferrer' : null"
    variant="ghost"
    class="text-left text-sm w-full flex flex-row items-center justify-between gap-x-2 px-2 py-2 h-auto"
    :class="{
      'dropdown-item-hover': !item?.emphasize,
      'dropdown-item-emphasized': item?.emphasize,
      'group': showExternalIconOnHover,
      'rounded-md': rounded,
    }"
    @click.stop="item?.click ? item?.click(item?.clickParams ?? []) : null"
  >
    <span class="leading-snug inline-flex flex-row items-center gap-x-2">
      <component :is="item?.icon" class="shrink-0 text-current w-4 h-4" aria-hidden="true" />
      {{ t(item?.text, item?.textParams ?? []) }}
    </span>
    <ArrowTopRightOnSquareIcon
      v-if="showExternalIconOnHover"
      class="text-white fill-current shrink-0 w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"
    />
  </Button>
</template>

<style>
.dropdown-item-hover:hover,
.dropdown-item-hover:focus {
  background: linear-gradient(to right, #e22828, #ff8c2f);
}

.dropdown-item-emphasized:hover,
.dropdown-item-emphasized:focus {
  background: linear-gradient(to right, rgba(226, 40, 40, 0.6), rgba(255, 140, 47, 0.6));
}
</style>
