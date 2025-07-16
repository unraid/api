<script lang="ts" setup>
import { reactive, watch } from 'vue';

import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@unraid/ui';
import { defaultColors } from '~/themes/default';

import type { Theme } from '~/themes/types';

import { useThemeStore } from '~/store/theme';

const themeStore = useThemeStore();

// Form state
const form = reactive({
  selectedTheme: 'white',
  gradient: false,
  description: true,
  banner: true,
  textPrimary: '',
  textSecondary: '',
  bgColor: '',
});

// Watch for changes and update theme
watch([form], () => {
  // Enable gradient if banner is enabled
  if (form.banner && !form.gradient) {
    form.gradient = true;
  }

  const themeToSet: Theme = {
    banner: form.banner,
    bannerGradient: form.gradient,
    descriptionShow: form.description,
    textColor: form.textPrimary ?? defaultColors[form.selectedTheme]['--header-text-primary']!,
    metaColor: form.textSecondary ?? defaultColors[form.selectedTheme]['--header-text-secondary']!,
    bgColor: form.bgColor ?? defaultColors[form.selectedTheme]['--header-background-color']!,
    name: form.selectedTheme,
  };
  themeStore.setTheme(themeToSet);
});
</script>

<template>
  <div class="flex flex-col gap-2 border-solid border-2 p-2 border-r-2">
    <h1 class="text-lg">Color Theme Customization</h1>

    <Label for="theme-select">Theme</Label>
    <Select v-model="form.selectedTheme">
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
    <Input id="primary-text-color" v-model="form.textPrimary" />

    <Label for="secondary-text-color">Header Secondary Text Color</Label>
    <Input id="secondary-text-color" v-model="form.textSecondary" />

    <Label for="background-color">Header Background Color</Label>
    <Input id="background-color" v-model="form.bgColor" />

    <Label for="gradient">Gradient</Label>
    <Switch id="gradient" v-model:checked="form.gradient" />

    <Label for="description">Description</Label>
    <Switch id="description" v-model:checked="form.description" />

    <Label for="banner">Banner</Label>
    <Switch id="banner" v-model:checked="form.banner" />
  </div>
</template>

<style >
/* Import unraid-ui globals first */
@import '@unraid/ui/styles';
@import '~/assets/main.css';
</style>
