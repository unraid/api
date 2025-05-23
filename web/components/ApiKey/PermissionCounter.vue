<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  permissions: { resource: string; actions: string[] }[];
  possiblePermissions?: { resource: string; actions: string[] }[];
  label?: string;
}>();

const possibleActions = computed(() => {
  if (!props.possiblePermissions) return [];
  return Array.from(new Set(props.possiblePermissions.flatMap(p => p.actions)));
});

const actionCounts = computed(() => {
  const actions = possibleActions.value;
  const counts: Record<string, number> = {};
  for (const action of actions) {
    counts[action] = props.permissions.reduce(
      (sum, perm) => sum + perm.actions.filter((a) => a === action).length,
      0
    );
  }
  return counts;
});
</script>
<template>
  <div class="flex flex-row items-center gap-1">
    <span v-if="label">{{ label }}</span>
    <template v-if="possibleActions.length">
      (<span v-for="action in possibleActions" :key="action" class="text-xs text-muted-foreground">
        {{ action }}: {{ actionCounts[action] || 0 }}
      </span>)
    </template>
  </div>
</template> 