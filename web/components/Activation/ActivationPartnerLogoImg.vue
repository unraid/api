<script lang="ts" setup>
/**
 * The actual image should be full black filled #000000.
 * This allows us to use the `invert` class to change the color to white when displayed in dark mode.
 */
import { storeToRefs } from "pinia";

import { useActivationCodeStore } from "~/components/Activation/store/activationCodeModal";
import { useThemeStore } from "~/store/theme";

const { partnerLogo } = storeToRefs(useActivationCodeStore());
const { darkMode } = storeToRefs(useThemeStore());
</script>

<template>
  <img v-if="partnerLogo" :src="partnerLogo" class="w-72" :class="{ 'invert': darkMode }" />
</template>