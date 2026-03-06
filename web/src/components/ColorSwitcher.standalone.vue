<script lang="ts" setup>
import { reactive, watch } from 'vue';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Input,
  Label,
  Select,
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

const items = [
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'azure', label: 'Azure' },
  { value: 'gray', label: 'Gray' },
];
</script>

<template>
  <Accordion>
    <AccordionItem value="color-theme-customization">
      <AccordionTrigger>Color Theme Customization</AccordionTrigger>
      <AccordionContent>
        <div class="border-muted flex flex-col gap-2 border-2 border-solid p-2">
          <h1 class="text-lg">Color Theme Customization</h1>

          <Label for="theme-select">Theme</Label>
          <Select v-model="form.selectedTheme" :items="items" placeholder="Select a theme" />

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
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</template>
