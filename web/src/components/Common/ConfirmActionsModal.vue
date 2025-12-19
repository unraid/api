<script setup lang="ts">
export interface ConfirmActionGroup {
  label: string;
  items: { name: string }[];
}

interface Props {
  open: boolean;
  title?: string;
  groups: ConfirmActionGroup[];
}

withDefaults(defineProps<Props>(), {
  title: 'Confirm actions',
});

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'confirm'): void;
}>();

function handleConfirm() {
  emit('confirm');
  emit('update:open', false);
}

function handleClose() {
  emit('update:open', false);
}
</script>

<template>
  <UModal
    :open="open"
    :title="title"
    :ui="{ footer: 'justify-end', overlay: 'z-50', content: 'z-50' }"
    @update:open="$emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-3">
        <template v-for="group in groups" :key="group.label">
          <div v-if="group.items.length" class="space-y-1">
            <div class="text-sm font-medium">{{ group.label }}</div>
            <ul class="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300">
              <li v-for="item in group.items" :key="item.name" class="truncate">{{ item.name }}</li>
            </ul>
          </div>
        </template>
      </div>
    </template>
    <template #footer>
      <UButton color="neutral" variant="outline" @click="handleClose">Cancel</UButton>
      <UButton @click="handleConfirm">Confirm</UButton>
    </template>
  </UModal>
</template>
