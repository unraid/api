<script setup lang="ts">
import { computed } from 'vue';

import { Badge } from '@unraid/ui';

import type { AuthAction } from '~/composables/gql/graphql';

import { actionVariant } from '~/components/ApiKey/actionVariant.js';

const props = withDefaults(
  defineProps<{
    permissions: { resource: string; actions: AuthAction[] }[];
    possiblePermissions?: { resource: string; actions: AuthAction[] }[];
    hideNumber?: boolean;
    label?: string;
  }>(),
  {
    label: '',
    possiblePermissions: () => [],
    hideNumber: false,
  }
);

const possibleActions = computed(() => {
  if (!props.possiblePermissions) return [];
  return Array.from(new Set(props.possiblePermissions.flatMap((p) => p.actions)));
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

const filteredActions = computed(() => {
  return possibleActions.value.filter((action) => actionCounts.value[action] > 0);
});
</script>
<template>
  <div class="flex flex-row items-center gap-1">
    <span v-if="label">{{ label }}</span>
    <template v-if="possibleActions.length">
      <Badge
        v-for="action in filteredActions"
        :key="action"
        :variant="actionVariant(action)"
        class="text-muted-foreground text-xs"
      >
        <span v-if="!hideNumber">{{ action }}: {{ actionCounts[action] || 0 }}</span>
        <span v-else>{{ action }}</span>
      </Badge>
    </template>
  </div>
</template>
