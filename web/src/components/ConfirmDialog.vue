<script setup lang="ts">
import {
  Button,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from '@unraid/ui';

import { useConfirm } from '~/composables/useConfirm';

const { isOpen, state, handleConfirm, handleCancel } = useConfirm();
</script>

<template>
  <DialogRoot :open="isOpen" @update:open="!$event && handleCancel()">
    <DialogContent>
      <DialogHeader v-if="state">
        <DialogTitle>{{ state.title }}</DialogTitle>
        <DialogDescription v-if="state.description">
          {{ state.description }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter v-if="state">
        <div class="flex w-full justify-between gap-3">
          <Button variant="outline" @click="handleCancel">
            {{ state.cancelText }}
          </Button>
          <Button :variant="state.confirmVariant" @click="handleConfirm">
            {{ state.confirmText }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </DialogRoot>
</template>
