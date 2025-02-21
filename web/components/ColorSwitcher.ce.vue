<script lang="ts" setup>
import { Input, Label, Switch, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@unraid/ui';

import type { Theme } from '~/store/theme';

import { defaultColors, useThemeStore } from '~/store/theme';

const themeStore = useThemeStore();

const selectedTheme = ref('white');

const setGradient = ref<boolean>(false);
const setDescription = ref<boolean>(true);
const setBanner = ref<boolean>(true);

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

const textPrimaryToSet = computed<string>(() => {
  if (textPrimary.value) {
    return textPrimary.value;
  }
  return defaultColors[selectedTheme.value]['--header-text-primary']!;
});

const textSecondaryToSet = computed<string>(() => {
  if (textSecondary.value) {
    return textSecondary.value;
  }
  return defaultColors[selectedTheme.value]['--header-text-secondary']!;
});

const bgColorToSet = computed(() => {
  if (bgColor.value) {
    return bgColor.value;
  }
  return defaultColors[selectedTheme.value]['--header-background-color'];
});

watch([selectedTheme, bgColorToSet, textSecondaryToSet, textPrimaryToSet], (newVal) => {
  const themeToSet: Theme = {
    banner: setBanner.value,
    bannerGradient: setGradient.value,
    descriptionShow: setDescription.value,
    textColor: textPrimaryToSet.value,
    metaColor: textSecondaryToSet.value,
    bgColor: bgColorToSet.value ?? '',
    name: selectedTheme.value
  };
  console.log('New Theme', themeToSet);
  themeStore.setTheme(themeToSet);
});

const updateTheme = (value: string) => {
  selectedTheme.value = value;
};
</script>

<template>
  <div class="flex flex-col gap-2 border-solid border-2 p-2 border-r-2">
    <h1 class="text-lg">Color Theme Customization</h1>
    <Label for="theme-select">Theme</Label>
    <Select v-model="selectedTheme" @update:model-value="updateTheme">
      <SelectTrigger>
        <SelectValue placeholder="Select a theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="white">Light</SelectItem>
        <SelectItem value="black">Dark</SelectItem>
        <SelectItem value="azure">Azure</SelectItem>
        <SelectItem value="gray">Gray</SelectItem>
      </SelectContent>
    </Select>
    <Label for="primary-text-color">Header Primary Text Color</Label>
    <Input id="primary-text-color" v-model="textPrimary" />
    <Label for="primary-text-color">Header Secondary Text Color</Label>
    <Input id="primary-text-color" v-model="textSecondary" />
    <Label for="primary-text-color">Header Background Color</Label>
    <Input id="primary-text-color" v-model="bgColor" />
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
