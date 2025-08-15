<script setup lang="ts">
import { Button } from '@/components/common/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/tabs';
import { jsonFormsAjv } from '@/forms/config';
// Import the renderers and AJV directly
import { jsonFormsRenderers } from '@/forms/renderers';
import type { ControlElement, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { JsonForms, useJsonFormsControl } from '@jsonforms/vue';
import type { RendererProps } from '@jsonforms/vue';
import { Plus, X } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';

const props = defineProps<RendererProps<ControlElement>>();
const { control, handleChange } = useJsonFormsControl(props);

// Use the imported renderers
const renderers = jsonFormsRenderers;

const items = computed({
  get: () => {
    const data = control.value.data ?? [];
    return Array.isArray(data) ? data : [];
  },
  set: (newValue: unknown[]) => {
    handleChange(control.value.path, newValue);
  },
});

// Track active tab
const activeTab = ref<string>('0');

// Update active tab when items change
watch(
  () => items.value.length,
  (newLength, oldLength) => {
    if (newLength > oldLength) {
      // When adding a new item, switch to the new tab
      activeTab.value = String(newLength - 1);
    } else if (newLength < oldLength && Number(activeTab.value) >= newLength) {
      // When removing an item, ensure active tab is valid
      activeTab.value = String(Math.max(0, newLength - 1));
    }
  }
);

// Get the detail layout from options or create a default one
const detailLayout = computed(() => {
  const options = control.value.uischema?.options;
  if (options?.detail) {
    return options.detail as UISchemaElement;
  }

  // Create a default vertical layout with all properties
  const schema = control.value.schema;
  if (schema?.items && typeof schema.items === 'object' && !Array.isArray(schema.items)) {
    const properties = schema.items.properties;
    if (properties && typeof properties === 'object') {
      return {
        type: 'VerticalLayout',
        elements: Object.keys(properties).map((key) => ({
          type: 'Control',
          scope: `#/properties/${key}`,
        })),
      } as UISchemaElement;
    }
  }

  return { type: 'VerticalLayout', elements: [] } as UISchemaElement;
});

// Get the property to use as the item label
const elementLabelProp = computed(() => {
  const options = control.value.uischema?.options as Record<string, unknown> | undefined;
  return (options?.elementLabelProp as string) ?? 'name';
});

// Get the item type name (e.g., "Provider", "Rule", etc.)
const itemTypeName = computed(() => {
  const options = control.value.uischema?.options as Record<string, unknown> | undefined;
  return (options?.itemTypeName as string) ?? 'Provider';
});

const getItemLabel = (item: unknown, index: number) => {
  if (item && typeof item === 'object' && item !== null && elementLabelProp.value in item) {
    const itemObj = item as Record<string, unknown>;
    return String(itemObj[elementLabelProp.value] || `${itemTypeName.value} ${index + 1}`);
  }
  return `${itemTypeName.value} ${index + 1}`;
};

// Check if an item is protected based on options configuration
const isItemProtected = (item: unknown): boolean => {
  const options = control.value.uischema?.options as Record<string, unknown> | undefined;
  const protectedItems = options?.protectedItems as Array<{ field: string; value: unknown }> | undefined;

  if (!protectedItems || !item || typeof item !== 'object') {
    return false;
  }

  const itemObj = item as Record<string, unknown>;
  return protectedItems.some((rule) => rule.field in itemObj && itemObj[rule.field] === rule.value);
};

// Get warning message for an item if it matches warning conditions
const getItemWarning = (item: unknown): { title: string; description: string } | null => {
  const options = control.value.uischema?.options as Record<string, unknown> | undefined;
  const itemWarnings = options?.itemWarnings as
    | Array<{
        condition: { field: string; value: unknown };
        title: string;
        description: string;
      }>
    | undefined;

  if (!itemWarnings || !item || typeof item !== 'object') {
    return null;
  }

  const itemObj = item as Record<string, unknown>;
  const warning = itemWarnings.find(
    (w) => w.condition.field in itemObj && itemObj[w.condition.field] === w.condition.value
  );

  return warning ? { title: warning.title, description: warning.description } : null;
};

const addItem = () => {
  const schema = control.value.schema;
  const newItem: Record<string, unknown> = {};

  // Initialize with default values if available
  if (schema?.items && typeof schema.items === 'object' && !Array.isArray(schema.items)) {
    const properties = schema.items.properties;
    if (properties && typeof properties === 'object') {
      Object.entries(properties).forEach(([key, propSchema]) => {
        const schema = propSchema as JsonSchema;
        if (schema.default !== undefined) {
          newItem[key] = schema.default;
        } else if (schema.type === 'array') {
          newItem[key] = [];
        } else if (schema.type === 'string') {
          newItem[key] = '';
        } else if (schema.type === 'number' || schema.type === 'integer') {
          newItem[key] = 0;
        } else if (schema.type === 'boolean') {
          newItem[key] = false;
        }
      });
    }
  }

  items.value = [...items.value, newItem];
};

const removeItem = (index: number) => {
  const newItems = [...items.value];
  newItems.splice(index, 1);
  items.value = newItems;
};

const updateItem = (index: number, newValue: unknown) => {
  const newItems = [...items.value];
  newItems[index] = newValue;
  items.value = newItems;
};
</script>

<template>
  <div class="w-full">
    <Tabs v-if="items.length > 0" v-model="activeTab" class="w-full">
      <div class="flex items-center gap-2 mb-4">
        <TabsList class="flex-1">
          <TabsTrigger
            v-for="(item, index) in items"
            :key="index"
            :value="String(index)"
            class="flex items-center gap-2"
          >
            {{ getItemLabel(item, index) }}
          </TabsTrigger>
        </TabsList>
        <Button
          variant="outline"
          size="icon"
          class="h-9 w-9"
          :disabled="!control.enabled"
          @click="addItem"
        >
          <Plus class="h-4 w-4" />
        </Button>
      </div>

      <TabsContent
        v-for="(item, index) in items"
        :key="index"
        :value="String(index)"
        class="mt-0 w-full"
      >
        <div class="border rounded-lg p-6 w-full">
          <div class="flex justify-end mb-4">
            <Button
              v-if="!isItemProtected(item)"
              variant="ghost"
              size="sm"
              class="text-destructive hover:text-destructive"
              :disabled="!control.enabled"
              @click="removeItem(index)"
            >
              <X class="h-4 w-4 mr-2" />
              Remove {{ getItemLabel(item, index) }}
            </Button>
          </div>
          <div class="w-full max-w-none">
            <!-- Show warning if item matches protected condition -->
            <div
              v-if="getItemWarning(item)"
              class="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg"
            >
              <div class="flex items-start gap-2">
                <span class="text-warning">⚠️</span>
                <div>
                  <div class="font-medium text-warning">{{ getItemWarning(item)?.title }}</div>
                  <div class="text-sm text-muted-foreground mt-1">
                    {{ getItemWarning(item)?.description }}
                  </div>
                </div>
              </div>
            </div>
            <JsonForms
              :data="item"
              :schema="control.schema.items as JsonSchema"
              :uischema="detailLayout"
              :renderers="renderers"
              :ajv="jsonFormsAjv"
              :readonly="!control.enabled"
              @change="({ data }) => updateItem(index, data)"
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>

    <div v-else class="text-center py-8 border-2 border-dashed rounded-lg">
      <p class="text-muted-foreground mb-4">No {{ itemTypeName.toLowerCase() }}s configured</p>
      <Button variant="outline" size="md" :disabled="!control.enabled" @click="addItem">
        <Plus class="h-4 w-4 mr-2" />
        Add First {{ itemTypeName }}
      </Button>
    </div>
  </div>
</template>
