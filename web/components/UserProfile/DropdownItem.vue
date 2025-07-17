<script setup lang="ts">
import { computed } from 'vue';
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
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
  <component
    :is="item?.click ? 'button' : 'a'"
    :disabled="item?.disabled"
    :href="item?.href ?? null"
    :target="item?.external ? '_blank' : null"
    :rel="item?.external ? 'noopener noreferrer' : null"
    class="text-left text-sm w-full flex flex-row items-center justify-between gap-x-2 px-2 py-2 cursor-pointer"
    :class="{
      'text-foreground bg-transparent hover:text-white hover:bg-linear-to-r hover:from-unraid-red hover:to-orange focus:text-white focus:bg-linear-to-r focus:from-unraid-red focus:to-orange focus:outline-hidden': !item?.emphasize,
      'text-white bg-linear-to-r from-unraid-red to-orange hover:from-unraid-red/60 hover:to-orange/60 focus:from-unraid-red/60 focus:to-orange/60': item?.emphasize,
      'group': showExternalIconOnHover,
      'rounded-md': rounded,
      'disabled:opacity-50 disabled:hover:opacity-50 disabled:focus:opacity-50 disabled:cursor-not-allowed': item?.disabled,
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
  </component>
</template>
