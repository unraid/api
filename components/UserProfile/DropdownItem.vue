<script setup lang="ts">
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import type { ServerStateDataAction } from '~/types/server';
import type { UserProfileLink } from '~/types/userProfile';

export interface Props {
  item: ServerStateDataAction | UserProfileLink;
}

const props = defineProps<Props>();

const showExternalIconOnHover = computed(() => props.item?.click || (props.item?.external && props.item.icon !== ArrowTopRightOnSquareIcon));
</script>

<template>
  <component
    :is="item?.click ? 'button' : 'a'"
    @click="item?.click ?? null"
    :href="item?.href ?? null"
    :title="item?.title ?? null"
    :target="item?.external ? '_blank' : null"
    :rel="item?.external ? 'noopener noreferrer' : null"
    class="DropdownItem"
    :class="{
      'DropdownItem--emphasize': item?.emphasize,
      'group': showExternalIconOnHover,
    }"
  >
    <span class="inline-flex flex-row items-center gap-x-8px">
      <component :is="item?.icon" class="flex-shrink-0 fill-current w-16px h-16px" aria-hidden="true" />
      {{ item?.text }}
    </span>
    <ArrowTopRightOnSquareIcon
      v-if="showExternalIconOnHover"
      class="text-white fill-current w-16px h-16px ml-8px opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"
    />
  </component>
</template>

<style lang="postcss" scoped>
.DropdownItem {
  @apply text-left text-14px text-beta;
  @apply w-full flex flex-row items-center justify-between;
  @apply gap-x-8px px-8px py-8px;
  @apply bg-transparent;
  @apply cursor-pointer rounded-md;

  &:hover,
  &:focus {
    @apply text-white;
    @apply bg-gradient-to-r from-red to-orange;
    @apply outline-none;
  }

  &--emphasize {
    @apply text-white bg-gradient-to-r from-red to-orange;

    &:hover,
    &:focus {
      @apply from-red/60 to-orange/60;
    }
  }
}
</style>
