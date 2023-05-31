<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ArrowRightOnRectangleIcon, ArrowTopRightOnSquareIcon, CogIcon } from '@heroicons/vue/24/solid';

import { ACCOUNT, CONNECT_DASHBOARD, PLUGIN_SETTINGS } from '~/helpers/urls';
import { useServerStore } from '~/store/server';

export interface Props {
  show?: boolean;
}

withDefaults(defineProps<Props>(), {
  show: false,
});

const myServersEnv = ref<string>('Staging');
const devEnv = ref<boolean>(true);

const serverStore = useServerStore();
const { stateData } = storeToRefs(serverStore);

interface Link {
  emphasize?: boolean;
  external?: boolean;
  href: string;
  icon?: typeof CogIcon;
  text: string;
  title?: string;
}

const links = computed(():Link[] => {
  return [
    {
      emphasize: true,
      external: true,
      href: CONNECT_DASHBOARD,
      icon: ArrowTopRightOnSquareIcon,
      text: 'Go to Connect',
      title: 'Opens Connect in new tab',
    },
    {
      external: true,
      href: ACCOUNT,
      icon: ArrowTopRightOnSquareIcon,
      text: 'Manage Unraid.net Account',
      title: 'Manage Unraid.net Account in new tab',
    },
    {
      href: PLUGIN_SETTINGS,
      icon: CogIcon,
      text: 'Settings',
      title: 'Go to Connect plugin settings',
    },
  ];
})
</script>

<template>
  <nav v-show="show" class="Dropdown absolute z-30 right-0 flex flex-col gap-y-8px p-8px bg-alpha border rounded-lg min-w-310px max-w-350px">
    <header class="flex flex-row items-start justify-between mt-8px mx-8px">
      <h3 class="text-18px leading-none inline-flex flex-row gap-x-8px items-center">
        <span class="font-semibold">Connect</span>
        <upc-beta />
        <span v-if="myServersEnv" :title="`API • ${myServersEnv}`">⚙️</span>
        <span v-if="devEnv" :title="devEnv">⚠️</span>
      </h3>
    </header>
    <ul class="list-reset flex flex-col gap-y-4px p-0">
      <template v-if="stateData.actions">
        <li v-for="action in stateData.actions" :key="action.name">
          <button @click="action.click" class="Dropdown_link">
            <component :is="action.icon" class="Dropdown_linkIcon" aria-hidden="true" />
            {{ action.text }}
          </button>
        </li>
      </template>

      <li class="my-8px mx-12px">
        <upc-keyline />
      </li>

      <template v-if="links">
        <li v-for="(link, index) in links" :key="`link_${index}`">
          <a
            :href="link.href"
            :title="link.title"
            :target="link.external ? '_blank' : ''"
            :rel="link.external ? 'noopener noreferrer' : ''"
            class="Dropdown_link"
            :class="{
              'Dropdown_link--emphasize': link.emphasize
            }"
          >
            <component :is="link.icon" class="Dropdown_linkIcon" aria-hidden="true" />
            {{ link.text }}
          </a>
        </li>
      </template>
    </ul>
  </nav>
</template>

<style lang="postcss" scoped>
.Dropdown {
  @apply text-beta;

  top: 95%;
  box-shadow: var(--ring-offset-shadow), var(--ring-shadow), var(--shadow-beta);

  &::before {
    @apply absolute z-20 block;

    content: '';
    width: 0;
    height: 0;
    top: -10px;
    right: 32px;
    border-right: 11px solid transparent;
    border-bottom: 11px solid var(--color-alpha);
    border-left: 11px solid transparent;
  }
}

.Dropdown_link {
  @apply text-left text-14px text-beta;
  @apply w-full flex flex-row items-center;
  @apply gap-x-8px px-16px py-8px;
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

.Dropdown_linkIcon {
  @apply flex-shrink-0 fill-current w-16px h-16px;
}
</style>