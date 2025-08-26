<script setup lang="ts">
import { computed, watch } from 'vue';
import { useLazyQuery } from '@vue/apollo-composable';
import { Badge } from '@unraid/ui';
import { PREVIEW_EFFECTIVE_PERMISSIONS } from './permissions-preview.query';
import type { Role, PreviewEffectivePermissionsQuery } from '~/composables/gql/graphql';
import type { AuthActionValue } from '~/types/auth-actions';

interface RawPermission {
  resource: string;
  actions: AuthActionValue[];
}

interface Props {
  roles?: Role[];
  rawPermissions?: RawPermission[];
  showHeader?: boolean;
  headerText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  roles: () => [],
  rawPermissions: () => [],
  showHeader: true,
  headerText: 'Effective Permissions',
});

// Query for effective permissions
const { load: loadEffectivePermissions, loading, result } = useLazyQuery<PreviewEffectivePermissionsQuery>(PREVIEW_EFFECTIVE_PERMISSIONS);

// Computed property for effective permissions from the result
const effectivePermissions = computed(() => {
  return result.value?.previewEffectivePermissions || [];
});

// Format action for display - show the actual enum value or formatted string
const formatAction = (action: string): string => {
  if (action === '*') return 'ALL ACTIONS';
  
  // If it's already an enum value like CREATE_ANY, READ_ANY, show as-is
  if (action.includes('_')) {
    return action; // Keep the original enum format
  }
  
  // If it's in scope format like 'create:any' or just 'create', format for display
  if (action.includes(':')) {
    return action.split(':')[0].toUpperCase() + ':' + action.split(':')[1].toUpperCase();
  }
  
  // For simple verbs, uppercase them
  return action.toUpperCase();
};

// Watch for changes to roles and permissions and reload
watch(
  () => ({
    roles: props.roles,
    rawPermissions: props.rawPermissions,
  }),
  async ({ roles, rawPermissions }) => {
    // Skip if no roles or permissions
    if ((!roles || roles.length === 0) && (!rawPermissions || rawPermissions.length === 0)) {
      return;
    }
    
    try {
      // Transform permissions to the format expected by the query
      const permissions = rawPermissions?.map(perm => ({
        resource: perm.resource,
        actions: perm.actions
      })) || [];
      
      // Call load with the parameters
      await loadEffectivePermissions(null, {
        roles: roles || [],
        permissions: permissions.length > 0 ? permissions : undefined,
      });
    } catch (error) {
      console.error('Failed to load effective permissions:', error);
    }
  },
  { immediate: true, deep: true }
);
</script>

<template>
  <div class="w-full">
    <h3 v-if="showHeader" class="text-sm font-semibold mb-3 flex items-center gap-2">
      {{ headerText }}
      <span v-if="loading" class="text-xs text-muted-foreground">(loading...)</span>
    </h3>
    
    <!-- Show effective permissions -->
    <div v-if="effectivePermissions.length > 0 && !loading" class="space-y-2">
      <div class="text-xs text-muted-foreground mb-2">
        These are the actual permissions that will be granted based on selected roles and custom permissions:
      </div>
      
      <div class="space-y-2 max-h-64 overflow-y-auto">
        <div 
          v-for="perm in effectivePermissions" 
          :key="perm.resource"
          class="text-xs bg-background p-2 rounded border border-muted"
        >
          <div class="flex items-center gap-2 mb-1">
            <span class="font-medium">{{ perm.resource }}</span>
          </div>
          <div class="flex flex-wrap gap-1">
            <Badge 
              v-for="action in perm.actions" 
              :key="action"
              variant="green"
              size="xs"
            >
              {{ formatAction(action) }}
            </Badge>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Show loading state -->
    <div v-else-if="loading" class="text-xs text-muted-foreground">
      Loading permissions...
    </div>
    
    <!-- Show message when no permissions selected -->
    <div v-else class="text-xs text-muted-foreground italic">
      No permissions selected yet
    </div>
  </div>
</template>
