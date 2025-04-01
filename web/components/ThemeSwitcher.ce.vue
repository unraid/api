<script lang="ts" setup>
/**
 * Add to webgui via DefaultPageLayout.php
 * Find the footer and the PHP that builds it. Search for `annotate('Footer');` for the start of the footer.
 * 
 * At the of the footer end replace this PHP
 * ```
 * echo "</span></div>";
 * ```
 * with the following PHP
 * ```
 * echo "</span>";
 * echo "<unraid-theme-switcher current='$theme'></unraid-theme-switcher>";
 * echo "</div>";
 * ```
 */
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { WebguiUpdate } from '~/composables/services/webgui';
import { useServerStore } from '~/store/server';

const props = defineProps<{
  current: string;
}>();

const { csrf } = storeToRefs(useServerStore());
const devModeEnabled = ref<boolean>(import.meta.env.VITE_ALLOW_CONSOLE_LOGS);
const themes = ref<string[]>(['azure', 'black', 'gray', 'white']);
const submitting = ref<boolean>(false);

const handleThemeChange = (event: Event) => {
  const newTheme = (event.target as HTMLSelectElement).value;
  
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
    console.error('[ThemeSwitcher.setTheme] Failed to update theme', error);
    throw new Error('[ThemeSwitcher.setTheme] Failed to update theme');
  }
};
</script>

<template>
  <select
    v-if="devModeEnabled"
    :disabled="submitting"
    :value="props.current"
    class="text-xs relative float-left mr-2 text-white bg-black"
    @change="handleThemeChange"
  >
    <option
      v-for="theme in themes"
      :key="theme"
      :value="theme"
    >
      {{ theme }}
    </option>
  </select>
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '~/assets/main.css';
</style>
