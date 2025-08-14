<script setup lang="ts">
import { Button } from '@unraid/ui';
import { computed } from 'vue';

interface Provider {
  id: string;
  name: string;
  buttonText?: string | null;
  buttonIcon?: string | null;
  buttonVariant?: string | null;
  buttonStyle?: string | null;
}

interface Props {
  provider: Provider;
  disabled?: boolean;
  onClick: (providerId: string) => void;
}

const props = defineProps<Props>();

const handleClick = () => {
  props.onClick(props.provider.id);
};

// Extract SVG content from data URI for inline rendering
const inlineSvgContent = computed(() => {
  if (!props.provider.buttonIcon?.includes('data:image/svg+xml;base64,')) {
    return null;
  }
  
  try {
    const base64Data = props.provider.buttonIcon.replace('data:image/svg+xml;base64,', '');
    const svgContent = atob(base64Data);
    return svgContent;
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error('Error parsing SVG content:', e.message);
    } else {
      console.error('Error parsing SVG content:', e);
    }
    return null;
  }
});
</script>

<template>
  <Button
    :disabled="disabled"
    :variant="(provider.buttonVariant as any) || 'outline'"
    class="sso-provider-button"
    :style="provider.buttonStyle || ''"
    @click="handleClick"
  >
    <div 
      v-if="inlineSvgContent"
      class="w-6 h-6 mr-2 sso-button-icon-svg flex-shrink-0"
      v-html="inlineSvgContent"
    />
    <img 
      v-else-if="provider.buttonIcon" 
      :src="provider.buttonIcon" 
      class="w-6 h-6 mr-2 sso-button-icon" 
      :alt="provider.name"
    >
    {{ provider.buttonText || `Sign in with ${provider.name}` }}
  </Button>
</template>

<style scoped>
.sso-button-icon {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@supports (image-rendering: -webkit-optimize-contrast) {
  .sso-button-icon {
    image-rendering: -webkit-optimize-contrast;
  }
}

@supports (image-rendering: crisp-edges) {
  .sso-button-icon {
    image-rendering: crisp-edges;
  }
}

/* For SVG specifically, prefer smooth rendering */
.sso-button-icon[src*="svg"] {
  image-rendering: auto;
  image-rendering: smooth;
}

/* Inline SVG rendering for perfect quality */
.sso-button-icon-svg {
  display: flex;
  align-items: center;
  justify-content: center;
}

.sso-button-icon-svg svg {
  width: 100% !important;
  height: 100% !important;
  /* Enhanced antialiasing for crisp rendering */
  shape-rendering: geometricPrecision;
  text-rendering: geometricPrecision;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: optimize-contrast;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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

