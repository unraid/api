<script setup lang="ts">
interface Props {
  autostartValue?: boolean;
  showAutostart?: boolean;
  manageActions?: Array<{ label: string; icon: string; onClick?: () => void }>;
}

const _props = withDefaults(defineProps<Props>(), {
  autostartValue: true,
  showAutostart: true,
  manageActions: () => [
    { label: 'Edit', icon: 'i-lucide-edit' },
    { label: 'Remove', icon: 'i-lucide-trash-2' },
    { label: 'Restart', icon: 'i-lucide-refresh-cw' },
    { label: 'Force Update', icon: 'i-lucide-download' },
  ],
});

const emit = defineEmits<{
  'update:autostart': [value: boolean];
  manageAction: [action: string];
}>();

const handleManageAction = (action: { label: string; icon: string }) => {
  emit('manageAction', action.label);
};
</script>

<template>
  <div class="flex items-center gap-4">
    <div v-if="showAutostart" class="flex items-center gap-3">
      <span class="text-sm font-medium">Autostart</span>
      <USwitch :model-value="autostartValue" @update:model-value="$emit('update:autostart', $event)" />
    </div>

    <UDropdownMenu :items="[manageActions]" @click="handleManageAction">
      <UButton variant="subtle" color="primary" size="sm" trailing-icon="i-lucide-chevron-down">
        Manage
      </UButton>
    </UDropdownMenu>
  </div>
</template>
