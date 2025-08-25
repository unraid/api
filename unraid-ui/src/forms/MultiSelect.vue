<script setup lang="ts">
import { Badge } from '@/components/common/badge';
import { Button } from '@/components/common/button';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import type { ControlElement } from '@jsonforms/core';
import { useJsonFormsControl } from '@jsonforms/vue';
import type { RendererProps } from '@jsonforms/vue';
import { computed, ref } from 'vue';

const props = defineProps<RendererProps<ControlElement>>();
const { control, handleChange } = useJsonFormsControl(props);

// Handle array data
const selectedValues = computed({
  get: () => {
    const data = control.value.data ?? [];
    return Array.isArray(data) ? data : [];
  },
  set: (values: string[]) => {
    handleChange(control.value.path, values);
  },
});

// Get available options from schema
const options = computed(() => {
  const schema = control.value.schema;
  let enumValues: string[] = [];

  // Check for enum in schema.items (for array types)
  if (
    schema.type === 'array' &&
    typeof schema.items === 'object' &&
    !Array.isArray(schema.items) &&
    'enum' in schema.items
  ) {
    enumValues = schema.items.enum as string[];
  }
  // Fallback to direct enum
  else if ('enum' in schema) {
    enumValues = schema.enum as string[];
  }

  const labels: Record<string, string> | undefined = control.value.uischema.options?.labels;
  const descriptions: Record<string, string> | undefined = control.value.uischema.options?.descriptions;

  return enumValues.map((value) => ({
    value,
    label: labels?.[value] || value,
    description: descriptions?.[value],
  }));
});

// Display format from options
const displayFormat = computed(() => control.value.uischema.options?.format || 'dropdown');

// Check if readonly
const isReadonly = computed(() => control.value.uischema.options?.readonly || !control.value.enabled);

// Toggle selection of a value
const toggleValue = (value: string) => {
  if (isReadonly.value) return;

  const current = [...selectedValues.value];
  const index = current.indexOf(value);

  if (index > -1) {
    current.splice(index, 1);
  } else {
    current.push(value);
  }

  selectedValues.value = current;
};

// Remove a specific value (for chips display)
const removeValue = (value: string) => {
  if (isReadonly.value) return;
  selectedValues.value = selectedValues.value.filter((v) => v !== value);
};

// Clear all selections
const clearAll = () => {
  if (isReadonly.value) return;
  selectedValues.value = [];
};

const dropdownOpen = ref(false);

// Placeholder text
const placeholder = computed(() => {
  const customPlaceholder = control.value.uischema.options?.placeholder;
  if (customPlaceholder) return customPlaceholder;
  return options.value.length > 0 ? 'Select items...' : 'No items available';
});
</script>

<template>
  <!-- Chips display format -->
  <div v-if="displayFormat === 'chips' || displayFormat === 'array'" class="space-y-2">
    <div class="flex flex-wrap gap-2">
      <Badge
        v-for="value in selectedValues"
        :key="value"
        :variant="isReadonly ? 'gray' : 'blue'"
        size="sm"
      >
        <span>{{ options.find((o) => o.value === value)?.label || value }}</span>
        <button
          v-if="!isReadonly"
          @click.stop="removeValue(value)"
          class="ml-1 hover:text-destructive"
          type="button"
        >
          <XMarkIcon class="h-3 w-3" />
        </button>
      </Badge>
      <span v-if="selectedValues.length === 0" class="text-muted-foreground text-sm">
        {{ isReadonly ? 'None selected' : placeholder }}
      </span>
    </div>

    <!-- Add button for editable chips -->
    <DropdownMenuRoot v-if="!isReadonly && displayFormat === 'chips'" v-model:open="dropdownOpen">
      <DropdownMenuTrigger as-child>
        <Button variant="outline" size="sm" class="h-8">
          <span>Add Item</span>
          <ChevronDownIcon class="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-56 max-h-[20rem] overflow-y-auto">
        <DropdownMenuLabel>Select Items</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          v-for="option in options"
          :key="option.value"
          :model-value="selectedValues.includes(option.value)"
          @update:model-value="
            (checked) => {
              if (checked && !selectedValues.includes(option.value)) {
                selectedValues = [...selectedValues, option.value];
              } else if (!checked && selectedValues.includes(option.value)) {
                selectedValues = selectedValues.filter((v) => v !== option.value);
              }
            }
          "
          @select.prevent
        >
          <div class="flex flex-col">
            <span>{{ option.label }}</span>
            <span v-if="option.description" class="text-xs text-muted-foreground">
              {{ option.description }}
            </span>
          </div>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  </div>

  <!-- Dropdown format -->
  <div v-else>
    <DropdownMenuRoot v-model:open="dropdownOpen">
      <DropdownMenuTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="dropdownOpen"
          :disabled="isReadonly"
          class="w-full justify-between"
        >
          <span class="truncate">
            <template v-if="selectedValues.length === 0">
              {{ placeholder }}
            </template>
            <template v-else-if="selectedValues.length === 1">
              {{ options.find((o) => o.value === selectedValues[0])?.label || selectedValues[0] }}
            </template>
            <template v-else> {{ selectedValues.length }} items selected </template>
          </span>
          <ChevronDownIcon class="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent class="w-full max-h-[20rem] overflow-y-auto">
        <DropdownMenuLabel class="flex justify-between items-center">
          <span>Select Items</span>
          <button
            v-if="selectedValues.length > 0"
            @click="clearAll"
            class="text-xs text-muted-foreground hover:text-foreground"
            type="button"
          >
            Clear all
          </button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuCheckboxItem
          v-for="option in options"
          :key="option.value"
          :model-value="selectedValues.includes(option.value)"
          @update:model-value="
            (checked) => {
              if (checked && !selectedValues.includes(option.value)) {
                selectedValues = [...selectedValues, option.value];
              } else if (!checked && selectedValues.includes(option.value)) {
                selectedValues = selectedValues.filter((v) => v !== option.value);
              }
            }
          "
          @select.prevent
        >
          <div class="flex flex-col">
            <span>{{ option.label }}</span>
            <span v-if="option.description" class="text-xs text-muted-foreground">
              {{ option.description }}
            </span>
          </div>
        </DropdownMenuCheckboxItem>

        <template v-if="selectedValues.length > 0">
          <DropdownMenuSeparator />
          <div class="px-2 py-2 text-sm text-muted-foreground">{{ selectedValues.length }} selected</div>
        </template>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  </div>
</template>
