<script setup lang="ts">
import { Button } from '@unraid/ui';

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
</script>

<template>
  <Button
    :disabled="disabled"
    :variant="(provider.buttonVariant as any) || 'outline'"
    class="sso-button"
    :style="provider.buttonStyle || ''"
    @click="handleClick"
  >
    <img 
      v-if="provider.buttonIcon" 
      :src="provider.buttonIcon" 
      class="w-5 h-5 mr-2" 
      :alt="provider.name"
    >
    {{ provider.buttonText || `Sign in with ${provider.name}` }}
  </Button>
</template>

<style scoped>
.sso-button {
  font-size: 0.875rem !important;
  font-weight: 600 !important;
  line-height: 1 !important;
  text-transform: uppercase !important;
  letter-spacing: 2px !important;
  padding: 0.75rem 1.5rem !important;
  border-radius: 0.125rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
</style>
