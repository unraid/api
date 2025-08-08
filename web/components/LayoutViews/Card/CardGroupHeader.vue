<script setup lang="ts">
interface Props {
  label: string;
  icon?: string;
  badge?: string | number;
  isExpanded?: boolean;
}

defineProps<Props>();
</script>

<template>
  <UCard
    class="w-full cursor-pointer transition-all duration-200 hover:shadow-md"
    @click="$emit('toggle')"
  >
    <div class="flex items-center gap-4 py-2">
      <!-- Expansion Arrow -->
      <div class="flex-shrink-0 pl-2">
        <UIcon
          name="i-lucide-chevron-right"
          :class="[
            'h-5 w-5 text-gray-500 transform transition-transform duration-200',
            isExpanded ? 'rotate-90' : 'rotate-0',
          ]"
        />
      </div>

      <!-- Icon -->
      <div class="flex-shrink-0">
        <UIcon v-if="icon" :name="icon" class="h-8 w-8" />
        <div v-else class="h-8 w-8rounded flex items-center justify-center">
          <UIcon name="i-lucide-folder" class="h-5 w-5 text-gray-500" />
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h2 class="text-lg font-semiboldtruncate">
            {{ label }}
          </h2>
          <UBadge v-if="badge" size="sm" :label="String(badge)" variant="subtle" />
          <!-- Edit icon -->
          <UIcon
            name="i-lucide-pencil"
            class="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
          />
        </div>
      </div>

      <!-- Right side - remove duplicate arrow -->
      <div class="flex-shrink-0 pr-2"/>
    </div>
  </UCard>
</template>
