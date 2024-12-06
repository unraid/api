<script lang="ts" setup>
import Input from '~/components/shadcn/input/Input.vue';
import Label from '~/components/shadcn/label/Label.vue';
import { defaultColors, useThemeStore, type Theme } from '~/store/theme';

const themeStore = useThemeStore();
const { darkMode, theme } = toRefs(themeStore);

const setDarkMode = ref<boolean>(false);

const toggleSwitch= (value: boolean) => {
  setDarkMode.value = value;
}
const textPrimary = ref<string>("");
const textSecondary = ref<string>("");
const bgColor = ref<string>("");

const textPrimaryToSet = computed(() => {
  if (textPrimary.value) {
    return textPrimary.value;
  }
  return darkMode.value ? defaultColors.dark.headerTextPrimary : defaultColors.light.headerTextPrimary;
})

const textSecondaryToSet = computed(() => {
  if (textSecondary.value) {
    return textSecondary.value;
  }
  return darkMode.value ? defaultColors.dark.headerTextSecondary : defaultColors.light.headerTextSecondary;
})  

const bgColorToSet = computed(() => {
  if (bgColor.value) {
    return bgColor.value;
  }
  return darkMode.value ? defaultColors.dark.headerBackgroundColor : defaultColors.light.headerBackgroundColor;
})


watch([setDarkMode, bgColorToSet, textSecondaryToSet, textPrimaryToSet], (newVal) => {
  console.log(newVal);
  const themeToSet: Theme = {
    banner: true,
    bannerGradient: true,
    descriptionShow: true,
    textColor: textPrimaryToSet.value,
    metaColor: textSecondaryToSet.value,
    bgColor: bgColorToSet.value,
    name: setDarkMode.value ? 'black' : 'light',
  }
  themeStore.setTheme(themeToSet);
});
</script>

<template>

  <div class="flex flex-col gap-2 border-solid border-2 p-2 border-r-2">
    <h1 class="text-lg">Color Theme Customization</h1>
    <Label for="primary-text-color">Header Primary Text Color</label>
    <Input id="primary-text-color" v-model="textPrimary" />
    <Label for="primary-text-color">Header Secondary Text Color</label>
    <Input id="primary-text-color" v-model="textSecondary" />
    <Label for="primary-text-color">Header Background Color</label>
    <Input id="primary-text-color" v-model="bgColor" />
    <Label for="dark-mode">Dark Mode</Label>
    <Switch id="dark-mode" @update:checked="toggleSwitch"/>
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
