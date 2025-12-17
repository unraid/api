<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  open: boolean;
  containerName: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'confirm', withImage: boolean): void;
}>();

const removeWithImage = ref(true);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      removeWithImage.value = true;
    }
  }
);

function handleConfirm() {
  emit('confirm', removeWithImage.value);
}

function handleClose() {
  emit('update:open', false);
}
</script>

<template>
  <UModal
    :open="open"
    title="Remove container"
    :ui="{ footer: 'justify-end', overlay: 'z-50', content: 'z-50' }"
    @update:open="$emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <p class="text-foreground text-sm">
          Are you sure you want to remove
          <strong>{{ containerName }}</strong
          >?
        </p>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="removeWithImage" type="checkbox" class="accent-primary h-4 w-4 rounded" />
          <span>Also remove image</span>
        </label>
      </div>
    </template>
    <template #footer>
      <UButton color="neutral" variant="outline" @click="handleClose">Cancel</UButton>
      <UButton color="error" :loading="loading" @click="handleConfirm">Remove</UButton>
    </template>
  </UModal>
</template>
