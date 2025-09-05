<script setup lang="ts">
import { computed } from 'vue';

import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { Button } from '@unraid/ui';

import type { ServerStateDataAction } from '~/types/server';
import type { UserProfileLink } from '~/types/userProfile';
import type { ComposerTranslation } from 'vue-i18n';

export interface Props {
  item: ServerStateDataAction | UserProfileLink;
  rounded?: boolean;
  t: ComposerTranslation;
}

const props = withDefaults(defineProps<Props>(), {
  rounded: true,
});

const showExternalIconOnHover = computed(
  () => props.item?.external && props.item.icon !== ArrowTopRightOnSquareIcon
);

const buttonClass = computed(() => {
  const classes = [
    'block',
    'text-left',
    'text-sm',
    'w-full',
    'flex',
    'flex-row',
    'items-center',
    'justify-between',
    'gap-x-2',
    'px-2',
    'py-2',
    'h-auto',
    'font-medium',
    'ring-offset-background',
    'transition-colors',
    'focus-visible:outline-hidden',
    'focus-visible:ring-2',
    'focus-visible:ring-ring',
    'focus-visible:ring-offset-2',
    'hover:bg-accent',
    'hover:text-accent-foreground',
    'no-underline',
    'text-current',
  ];

  if (!props.item?.emphasize) {
    classes.push('dropdown-item-hover');
  }
  if (props.item?.emphasize) {
    classes.push('dropdown-item-emphasized');
  }
  if (showExternalIconOnHover.value) {
    classes.push('group');
  }
  if (props.rounded) {
    classes.push('rounded-md');
  }
  if (props.item?.disabled) {
    classes.push('pointer-events-none', 'opacity-50');
  }

  return classes.join(' ');
});
</script>

<template>
  <a
    v-if="item?.href && !item?.click"
    :href="item.href"
    :target="item?.external ? '_blank' : null"
    :rel="item?.external ? 'noopener noreferrer' : null"
    :class="buttonClass"
  >
    <span class="inline-flex flex-row items-center gap-x-2 leading-snug">
      <component :is="item?.icon" class="h-4 w-4 shrink-0 text-current" aria-hidden="true" />
      {{ t(item?.text, item?.textParams ?? []) }}
    </span>
    <ArrowTopRightOnSquareIcon
      v-if="showExternalIconOnHover"
      class="ml-2 h-4 w-4 shrink-0 fill-current text-white opacity-0 transition-opacity duration-200 ease-in-out group-hover:opacity-100"
    />
  </a>
  <Button
    v-else
    :disabled="item?.disabled"
    variant="ghost"
    :class="buttonClass"
    @click.stop="item?.click ? item?.click(item?.clickParams ?? []) : null"
  >
    <span class="inline-flex flex-row items-center gap-x-2 leading-snug">
      <component :is="item?.icon" class="h-4 w-4 shrink-0 text-current" aria-hidden="true" />
      {{ t(item?.text, item?.textParams ?? []) }}
    </span>
    <ArrowTopRightOnSquareIcon
      v-if="showExternalIconOnHover"
      class="ml-2 h-4 w-4 shrink-0 fill-current text-white opacity-0 transition-opacity duration-200 ease-in-out group-hover:opacity-100"
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
