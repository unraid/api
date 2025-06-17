<script setup lang="ts">
import Button from '@/components/common/button/Button.vue';
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '@/components/common/dialog';

interface DialogProps {
  description?: string;
  title?: string;
  triggerText?: string;
  modelValue?: boolean;
  showFooter?: boolean;
  closeButtonText?: string;
  primaryButtonText?: string;
}

const {
  description,
  title,
  triggerText,
  modelValue,
  showFooter = true,
  closeButtonText = 'Close',
  primaryButtonText,
} = defineProps<DialogProps>();

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
</script>

<template>
  <DialogRoot :open="modelValue" @update:open="handleOpenChange">
    <DialogTrigger v-if="triggerText || $slots.trigger">
      <slot name="trigger">
        <Button>{{ triggerText }}</Button>
      </slot>
    </DialogTrigger>
    <DialogContent>
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
            <Button v-if="primaryButtonText" @click="handlePrimaryClick">
              {{ primaryButtonText }}
            </Button>
          </div>
        </slot>
      </DialogFooter>
    </DialogContent>
  </DialogRoot>
</template>
