<script setup lang="ts">
import { Button } from '@unraid/ui';
import type { PublicOidcProvider } from '~/composables/gql/graphql';

interface Props {
  provider: PublicOidcProvider;
  disabled?: boolean;
  onClick: (providerId: string) => void;
}

const props = defineProps<Props>();

const handleClick = () => {
  props.onClick(props.provider.id);
};
</script>

<template>
  <Button
    :disabled="props.disabled"
    :variant="(props.provider.buttonVariant as any) || 'outline'"
    class="sso-provider-button w-full min-h-[2.5rem] h-auto py-2 px-4"
    :style="props.provider.buttonStyle || ''"
    @click="handleClick"
  >
    <div class="flex items-center justify-center gap-2 w-full">
      <img 
        v-if="props.provider.buttonIcon" 
        :src="props.provider.buttonIcon" 
        class="w-4 h-4 sso-button-icon flex-shrink-0" 
        alt=""
        aria-hidden="true"
      >
      <span class="text-center whitespace-normal">
        {{ props.provider.buttonText || `Sign in with ${props.provider.name}` }}
      </span>
    </div>
  </Button>
</template>

<style scoped>
/* For SVG images, prefer smooth rendering */
.sso-button-icon[src*="svg"],
.sso-button-icon[src*="data:image/svg"] {
  image-rendering: auto;
  image-rendering: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* For raster images, use crisp rendering */
.sso-button-icon:not([src*="svg"]):not([src*="data:image/svg"]) {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

/* Automatic hover effects for buttons with custom background colors */
.sso-provider-button[style*="background-color"]:hover:not(:disabled) {
  filter: brightness(0.9) !important;
}

.sso-provider-button[style*="background-color"]:active:not(:disabled) {
  filter: brightness(0.8) !important;
  transform: translateY(1px) !important;
}
</style>

