<script lang="ts" setup>
import Input from '~/components/shadcn/input/Input.vue';
import Label from '~/components/shadcn/label/Label.vue';
import { defaultColors, useThemeStore, type Theme } from '~/store/theme';

const themeStore = useThemeStore();
const { darkMode, theme } = toRefs(themeStore);

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
    <Label for="header-primary-text">Header Primary Text Color</Label>
    <Input id="header-primary-text" v-model="textPrimary" />
    <Label for="header-secondary-text">Header Secondary Text Color</Label>
    <Input id="header-secondary-text" v-model="textSecondary" />
    <Label for="header-background">Header Background Color</Label>
    <Input id="header-background" v-model="bgColor" />
    <Label for="dark-mode">Dark Mode</Label>
    <Switch id="dark-mode" :checked="setDarkMode" @update:checked="toggleSwitch" />
    <Label for="gradient">Gradient</Label>
    <Switch id="gradient" :checked="setGradient" @update:checked="toggleGradient" />
    <Label for="description">Description</Label>
    <Switch id="description" :checked="setDescription" @update:checked="toggleDescription" />
    <Label for="banner">Banner</Label>
    <Switch id="banner" :checked="setBanner" @update:checked="toggleBanner" />
  </div>
</template>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
