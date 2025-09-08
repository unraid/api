<script setup lang="ts">
interface Props {
  autostartValue?: boolean;
  showAutostart?: boolean;
  manageActions?: Array<Array<{ label: string; icon: string; onClick?: () => void }>>;
}

withDefaults(defineProps<Props>(), {
  autostartValue: true,
  showAutostart: true,
  manageActions: () => [
    [
      { label: 'Start', icon: 'i-lucide-play' },
      { label: 'Stop', icon: 'i-lucide-square' },
      { label: 'Pause', icon: 'i-lucide-pause' },
      { label: 'Restart', icon: 'i-lucide-refresh-cw' },
    ],
    [
      { label: 'Update', icon: 'i-lucide-download' },
      { label: 'Force Update', icon: 'i-lucide-download-cloud' },
      { label: 'Remove', icon: 'i-lucide-trash-2' },
    ],
    [{ label: 'Docker Allocations', icon: 'i-lucide-hard-drive' }],
    [
      { label: 'Project Page', icon: 'i-lucide-external-link' },
      { label: 'Support', icon: 'i-lucide-help-circle' },
      { label: 'More Info', icon: 'i-lucide-info' },
    ],
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
  <div class="flex items-center gap-3 sm:gap-6">
    <div v-if="showAutostart" class="flex items-center gap-2 sm:gap-3">
      <span class="text-xs font-medium sm:text-sm">Autostart</span>
      <USwitch :model-value="autostartValue" @update:model-value="$emit('update:autostart', $event)" />
    </div>

    <UDropdownMenu
      :items="
        manageActions.map((group) =>
          group.map((action) => ({
            ...action,
            onSelect: () => handleManageAction(action),
          }))
        )
      "
      size="md"
    >
      <UButton variant="subtle" color="primary" size="sm" trailing-icon="i-lucide-chevron-down">
        Manage
      </UButton>
    </UDropdownMenu>
  </div>
</template>
