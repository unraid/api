<script setup lang="ts">
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { useI18n } from '~/composables/useI18n';

import type { ServerStateDataAction } from '~/types/server';
import type { UserProfileLink } from '~/types/userProfile';

export interface Props {
  item: ServerStateDataAction | UserProfileLink;
  rounded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  rounded: true,
});

const { $t } = useI18n();
const showExternalIconOnHover = computed(() => props.item?.external && props.item.icon !== ArrowTopRightOnSquareIcon);
</script>

<template>
  <component
    :is="item?.click ? 'button' : 'a'"
    :disabled="item?.disabled"
    :href="item?.href ?? null"
    :target="item?.external ? '_blank' : null"
    :rel="item?.external ? 'noopener noreferrer' : null"
    class="text-left text-14px w-full flex flex-row items-center justify-between gap-x-8px px-8px py-8px cursor-pointer"
    :class="{
      'text-foreground bg-transparent hover:text-white hover:bg-gradient-to-r hover:from-unraid-red hover:to-orange focus:text-white focus:bg-gradient-to-r focus:from-unraid-red focus:to-orange focus:outline-none': !item?.emphasize,
      'text-white bg-gradient-to-r from-unraid-red to-orange hover:from-unraid-red/60 hover:to-orange/60 focus:from-unraid-red/60 focus:to-orange/60': item?.emphasize,
      'group': showExternalIconOnHover,
      'rounded-md': rounded,
      'disabled:opacity-50 disabled:hover:opacity-50 disabled:focus:opacity-50 disabled:cursor-not-allowed': item?.disabled,
    }"
    @click.stop="item?.click ? item?.click(item?.clickParams ?? []) : null"
  >
    <span class="leading-snug inline-flex flex-row items-center gap-x-8px">
      <component :is="item?.icon" class="flex-shrink-0 text-current w-16px h-16px" aria-hidden="true" />
      {{ $t(item?.text, item?.textParams ?? []) }}
    </span>
    <ArrowTopRightOnSquareIcon
      v-if="showExternalIconOnHover"
      class="text-white fill-current flex-shrink-0 w-16px h-16px ml-8px opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"
    />
  </component>
</template>
