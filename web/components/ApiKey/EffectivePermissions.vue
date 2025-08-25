<script setup lang="ts">
import { computed, watch } from 'vue';
import { useLazyQuery } from '@vue/apollo-composable';
import { Badge } from '@unraid/ui';
import { PREVIEW_EFFECTIVE_PERMISSIONS } from './permissions-preview.query';
import { extractActionVerb } from '~/utils/authorizationLink';
import type { Role, AuthAction } from '~/composables/gql/graphql';

interface RawPermission {
  resource: string;
  actions: AuthAction[];
}

interface EffectivePermission {
  resource: string;
  actions: AuthAction[];
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
const { load: loadEffectivePermissions, loading, result } = useLazyQuery(PREVIEW_EFFECTIVE_PERMISSIONS);

// Computed property for effective permissions from the result
const effectivePermissions = computed<EffectivePermission[]>(() => {
  return result.value?.previewEffectivePermissions || [];
});

// Format action for display (uppercase for UI)
const formatAction = (action: string): string => {
  if (action === '*') return 'ALL ACTIONS';
  
  // Use shared function to extract verb, then uppercase for display
  const verb = extractActionVerb(action);
  return verb.toUpperCase();
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
            <span v-if="perm.resource === '*'" class="text-amber-600 dark:text-amber-400">(All Resources)</span>
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
