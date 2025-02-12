<script lang="ts" setup>
import { Input, Label, Switch } from '@unraid/ui';

import type { Theme } from '~/store/theme';

import { defaultColors, useThemeStore } from '~/store/theme';

const themeStore = useThemeStore();
const { darkMode } = toRefs(themeStore);

const setDarkMode = ref<boolean>(false);
const setGradient = ref<boolean>(false);
const setDescription = ref<boolean>(true);
const setBanner = ref<boolean>(true);

const toggleSwitch = (value: boolean) => {
  setDarkMode.value = value;
};
const toggleGradient = (value: boolean) => {
  setGradient.value = value;
};
const toggleDescription = (value: boolean) => {
  setDescription.value = value;
};
const toggleBanner = (value: boolean) => {
  setBanner.value = value;
};

const textPrimary = ref<string>('');
const textSecondary = ref<string>('');
const bgColor = ref<string>('');

const textPrimaryToSet = computed(() => {
  if (textPrimary.value) {
    return textPrimary.value;
  }
  return darkMode.value ? defaultColors.dark.headerTextPrimary : defaultColors.light.headerTextPrimary;
});

const textSecondaryToSet = computed(() => {
  if (textSecondary.value) {
    return textSecondary.value;
  }
  return darkMode.value
    ? defaultColors.dark.headerTextSecondary
    : defaultColors.light.headerTextSecondary;
});

const bgColorToSet = computed(() => {
  if (bgColor.value) {
    return bgColor.value;
  }
  return darkMode.value
    ? defaultColors.dark.headerBackgroundColor
    : defaultColors.light.headerBackgroundColor;
});

watch([setDarkMode, bgColorToSet, textSecondaryToSet, textPrimaryToSet], (newVal) => {
  console.log(newVal);
  const themeToSet: Theme = {
    banner: setBanner.value,
    bannerGradient: setGradient.value,
    descriptionShow: setDescription.value,
    textColor: textPrimaryToSet.value,
    metaColor: textSecondaryToSet.value,
    bgColor: bgColorToSet.value,
    name: setDarkMode.value ? 'black' : 'light',
  };
  themeStore.setTheme(themeToSet);
});
</script>

<template>
  <div class="flex flex-col gap-2 border-solid border-2 p-2 border-r-2">
    <h1 class="text-lg">Color Theme Customization</h1>
    <Label for="primary-text-color">Header Primary Text Color</Label>
    <Input id="primary-text-color" v-model="textPrimary" />
    <Label for="primary-text-color">Header Secondary Text Color</Label>
    <Input id="primary-text-color" v-model="textSecondary" />
    <Label for="primary-text-color">Header Background Color</Label>
    <Input id="primary-text-color" v-model="bgColor" />
    <Label for="dark-mode">Dark Mode</Label>
    <Switch id="dark-mode" @update:checked="toggleSwitch" />
    <Label for="gradient">Gradient</Label>
    <Switch id="gradient" @update:checked="toggleGradient" />
    <Label for="description">Description</Label>
    <Switch id="description" @update:checked="toggleDescription" />
    <Label for="banner">Banner</Label>
    <Switch id="banner" @update:checked="toggleBanner" />
  </div>
</template>

<style lang="postcss">
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '../assets/main.css';
</style>
