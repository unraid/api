<script lang="ts" setup>
import { OnClickOutside } from '@vueuse/components';
import { storeToRefs } from 'pinia';

import { WebguiUpdate } from '~/composables/services/webgui';

import { useServerStore } from '~/store/server';

import 'tailwindcss/tailwind.css';
import '~/assets/main.css';

export interface Props {
  current: string;
}
const props = defineProps<Props>();

const { csrf } = storeToRefs(useServerStore());

/**
 * Close dropdown when clicking outside
 * @note If in testing you have two variants of the component on a page the clickOutside will fire twice making it seem like it doesn't work
 */
const clickOutsideTarget = ref();
const clickOutsideIgnoreTarget = ref();
const outsideDropdown = () => {
  if (show.value) { show.value = false; }
};

const devModeEnabled = ref<boolean>(import.meta.env.VITE_ALLOW_CONSOLE_LOGS);
const show = ref<boolean>(false);
const themes = ref<string[]>(['azure', 'black', 'gray', 'white']);
const submitting = ref<boolean>(false);

const setTheme = (newTheme: string) => {
  if (newTheme === props.current) {
    console.debug('[ThemeSwitcher.setTheme] Theme is already set');
    return;
  }
  console.debug('[ThemeSwitcher.setTheme] Submitting form');
  submitting.value = true;
  try {
    WebguiUpdate
      .formUrl({
        csrf_token: csrf.value,
        '#file': 'dynamix/dynamix.cfg',
        '#section': 'display',
        theme: newTheme,
      })
      .post()
      .res(() => {
        console.log('[ThemeSwitcher.setTheme] Theme updated, reloading…');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      });
  } catch (error) {
    throw new Error('[ThemeSwitcher.setTheme] Failed to update theme');
  }
};
</script>

<template>
  <div v-if="devModeEnabled" class="relative float-left">
    <BrandButton
      ref="clickOutsideIgnoreTarget"
      btn-style="underline"
      :no-padding="true"
      size="12px"
      @click="show = !show">
      {{ props.current }}
    </BrandButton>
    <OnClickOutside
      v-if="show"
      class="absolute left-0 bottom-full text-sm pb-2"
      :options="{ ignore: [clickOutsideIgnoreTarget] }"
      @trigger="outsideDropdown"
    >
      <UiCardWrapper
        ref="clickOutsideTarget"
        name="theme"
        class="bg-black text-white gap-4px p-2"
        :padding="false"
      >
        <template v-if="!submitting">
          <h5>Click to set theme</h5>
          <BrandButton
            v-for="name in themes"
            :key="name"
            :disabled="current === name"
            size="12px"
            :title="current === name ? `Current theme: ${current}` : `Set theme: ${name}`"
            @click="setTheme(name)"
          >{{ name }}</BrandButton>
        </template>
        <template v-else>
          <h5>Updating…</h5>
          <BrandLoading class="mx-auto max-w-[100px]" />
        </template>
      </UiCardWrapper>
    </OnClickOutside>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;

.unraid_mark_2,
.unraid_mark_4 {
  animation: mark_2 1.5s ease infinite;
}
.unraid_mark_3 {
  animation: mark_3 1.5s ease infinite;
}
.unraid_mark_6,
.unraid_mark_8 {
  animation: mark_6 1.5s ease infinite;
}
.unraid_mark_7 {
  animation: mark_7 1.5s ease infinite;
}

@keyframes mark_2 {
  50% {
    transform: translateY(-40px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_3 {
  50% {
    transform: translateY(-62px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_6 {
  50% {
    transform: translateY(40px);
  }
  100% {
    transform: translateY(0);
  }
}
@keyframes mark_7 {
  50% {
    transform: translateY(62px);
  }
  100% {
    transform: translateY(0);
  }
}

@tailwind utilities;
</style>