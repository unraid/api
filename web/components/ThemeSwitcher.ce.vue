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
 * echo "</span>"; //
 * echo "<unraid-theme-switcher current='$theme' themes='".htmlspecialchars(json_encode(['azure', 'gray', 'black', 'white']), ENT_QUOTES, 'UTF-8')."'></unraid-theme-switcher>";
 * echo "</div>";
 * ```
 * 
 * @todo unraid-theme-switcher usage should pull theme files to determine what themes are available instead of being hardcoded.
 */
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { WebguiUpdate } from '~/composables/services/webgui';
import { useServerStore } from '~/store/server';

const props = defineProps<{
  current: string;
  themes?: string | string[]; // when string it'll be JSON encoded array that's been run thru htmlspecialchars in PHP
}>();

const computedThemes = computed(() => {
  if (props.themes) {
    return typeof props.themes === 'string' ? JSON.parse(props.themes) : props.themes;
  }
  return ['azure', 'black', 'gray', 'white'];
});

const { csrf } = storeToRefs(useServerStore());
const storageKey = 'enableThemeSwitcher';
const enableThemeSwitcher = sessionStorage.getItem(storageKey) === 'true' || localStorage.getItem(storageKey) === 'true';
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
        // without this timeout, the page refresh happens before emhttp has a chance to update the theme
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
  <div>
    <select
      v-if="enableThemeSwitcher"
      :disabled="submitting"
      :value="props.current"
      class="text-xs relative float-left mr-2 text-white bg-black"
      @change="handleThemeChange"
    >
      <option
        v-for="theme in computedThemes"
        :key="theme"
        :value="theme"
      >
        {{ theme }}
      </option>
    </select>
  </div>
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '~/assets/main.css';
</style>
