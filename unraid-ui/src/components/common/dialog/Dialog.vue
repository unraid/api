<script setup lang="ts">
import Button from '@/components/common/button/Button.vue';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogScrollContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'vue';

export interface DialogProps {
  description?: string;
  title?: string;
  triggerText?: string;
  modelValue?: boolean;
  showFooter?: boolean;
  closeButtonText?: string;
  primaryButtonText?: string;
  primaryButtonLoading?: boolean;
  primaryButtonLoadingText?: string;
  primaryButtonDisabled?: boolean;
  scrollable?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  to?: string | HTMLElement;
  class?: HTMLAttributes['class'];
}

const props = defineProps<DialogProps>();

// ... (rest of props destructuring or use `props` directly)

const {
  description,
  title,
  triggerText,
  modelValue,
  showFooter = true,
  closeButtonText = 'Close',
  primaryButtonText,
  primaryButtonLoading = false,
  primaryButtonLoadingText,
  primaryButtonDisabled = false,
  scrollable = false,
  size = 'md',
  showCloseButton = true,
  to,
  // class is not destructured to avoid conflict/ensure usage via props.class
} = props;

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'primary-click': [];
}>();

const handleOpenChange = (open: boolean) => {
  emit('update:modelValue', open);
};

const handlePrimaryClick = () => {
  emit('primary-click');
};

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'w-full max-w-full h-full min-h-screen',
};
</script>

<template>
  <DialogRoot :open="modelValue" @update:open="handleOpenChange">
    <DialogTrigger v-if="triggerText || $slots.trigger">
      <slot name="trigger">
        <Button>{{ triggerText }}</Button>
      </slot>
    </DialogTrigger>

    <component
      :is="scrollable ? DialogScrollContent : DialogContent"
      :class="
        cn(
          sizeClasses[size],
          size === 'full'
            ? 'fixed inset-0 max-w-none translate-x-0 translate-y-0 rounded-none border-0'
            : '',
          props.class
        )
      "
      :show-close-button="showCloseButton"
      :to="to"
    >
      <DialogHeader v-if="title || description || $slots.header">
        <slot name="header">
          <DialogTitle v-if="title">{{ title }}</DialogTitle>
          <DialogDescription v-if="description">
            {{ description }}
          </DialogDescription>
        </slot>
      </DialogHeader>

      <slot />

      <DialogFooter v-if="$slots.footer || showFooter">
        <slot name="footer">
          <div class="flex justify-end gap-2">
            <DialogClose as-child>
              <Button variant="secondary">{{ closeButtonText }}</Button>
            </DialogClose>
            <Button
              v-if="primaryButtonText"
              variant="primary"
              :disabled="primaryButtonDisabled || primaryButtonLoading"
              @click="handlePrimaryClick"
            >
              <span v-if="primaryButtonLoading && primaryButtonLoadingText">
                {{ primaryButtonLoadingText }}
              </span>
              <span v-else>{{ primaryButtonText }}</span>
            </Button>
          </div>
        </slot>
      </DialogFooter>
    </component>
  </DialogRoot>
</template>
