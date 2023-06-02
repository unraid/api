<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { ExclamationTriangleIcon } from '@heroicons/vue/24/solid';
import { useServerStore } from '~/store/server';
import type { ServerStateDataAction } from '~/types/server';
import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

export interface Props {
  phpRegistered?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  phpRegistered: false,
});

const serverStore = useServerStore();
const { registered, stateData } = storeToRefs(serverStore);

// rely on prop before the pinia state kicks in
const computedRegistered = computed(() => registered.value === undefined ? !!props.phpRegistered : registered.value);

// Intended to retrieve sign in and sign out from actions
const accountAction = computed((): ServerStateDataAction | undefined => {
  const allowed = ['signIn', 'signOut'];
  if (!stateData.value.actions) return;
  return stateData.value.actions.find(action => allowed.includes(action.name));
});
// @todo use callback url
const stateDataErrorAction = computed(() => {
  return {
    click: () => { console.debug('accountServerPayload') },
    external: true,
    icon: ExclamationTriangleIcon,
    name: 'accountServer',
    text: 'Fix Error',
  }
});

const button = computed(() => {
  if (stateData.value.error) return stateDataErrorAction.value;
  return accountAction.value;
});
</script>

<template>
  <div class="whitespace-normal flex flex-col gap-y-16px">
    <span v-if="stateData.error" class="text-red font-semibold leading-8 max-w-3xl">
      {{ stateData.error.heading }}
      <br />
      {{ stateData.error.message }}
    </span>
    <span>
      <component
        v-if="button"
        :is="button.click ? 'button' : 'a'"
        @click="button.click()"
        rel="noopener noreferrer"
        class="text-white text-14px text-center w-full flex-none flex flex-row items-center justify-center gap-x-8px px-8px py-8px cursor-pointer rounded-md bg-gradient-to-r from-red to-orange hover:from-red/60 hover:to-orange/60 focus:from-red/60 focus:to-orange/60"
        target="_blank"
        download
      >
        <component v-if="button.icon" :is="button.icon" class="flex-shrink-0 w-14px" />
        {{ button.text }}
      </component>
    </span>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
