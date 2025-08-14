<template>
  <div v-if="layout.visible !== false" class="space-y-4">
    <AccordionRoot :type="'multiple'" :defaultValue="defaultOpenItems" class="space-y-2">
      <AccordionItem
        v-for="(element, index) in elements"
        :key="`${layout.path || ''}-${index}`"
        :value="`item-${index}`"
        class="border rounded-lg bg-background"
      >
        <AccordionTrigger class="px-4 py-3 hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
          <div class="flex flex-col items-start space-y-1 text-left">
            <span class="font-medium">
              {{ getAccordionTitle(element, index) }}
            </span>
            <span v-if="getAccordionDescription(element, index)" class="text-sm text-muted-foreground">
              {{ getAccordionDescription(element, index) }}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent class="px-4 pb-4 pt-0">
          <div class="space-y-4">
            <DispatchRenderer
              :schema="layout.schema"
              :uischema="element as UISchemaElement"
              :path="layout.path || ''"
              :enabled="layout.enabled"
              :renderers="layout.renderers"
              :cells="layout.cells"
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </div>
</template>

<script setup lang="ts">
import {
  AccordionContent,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { jsonFormsAjv } from '@/forms/config';
import type { Layout, UISchemaElement } from '@jsonforms/core';
import { isVisible } from '@jsonforms/core';
import { DispatchRenderer, useJsonFormsLayout } from '@jsonforms/vue';
import type { RendererProps } from '@jsonforms/vue';
import { computed, inject } from 'vue';

const props = defineProps<RendererProps<Layout>>();

// Use the JsonForms layout composable - returns layout with all necessary props
const { layout } = useJsonFormsLayout(props);

// Try to get the root data from JSONForms context
const jsonFormsContext = inject('jsonforms') as { core?: { data?: unknown } } | undefined;

// Get elements to render - filter out invisible elements based on rules
const elements = computed(() => {
  const allElements = props.uischema?.elements || [];

  // Filter elements based on visibility rules
  return allElements.filter((element: UISchemaElement & Record<string, unknown>) => {
    if (!element.rule) {
      // No rule means always visible
      return true;
    }

    // Use JSONForms isVisible function to evaluate rule
    try {
      // Get the root data from JSONForms context for rule evaluation
      const rootData = jsonFormsContext?.core?.data || {};
      const formData = props.data || layout.data || rootData;
      const formPath = props.path || layout.path || '';

      const visible = isVisible(element as UISchemaElement, formData, formPath, jsonFormsAjv);
      return visible;
    } catch (error) {
      console.warn('[AccordionLayout] Error evaluating visibility:', error, element.rule);
      return true; // Default to visible on error
    }
  });
});

// Extract accordion configuration from options
const accordionOptions = computed(() => props.uischema?.options?.accordion || {});

// Determine which items should be open by default
const defaultOpenItems = computed(() => {
  const defaultOpen = accordionOptions.value?.defaultOpen;
  if (Array.isArray(defaultOpen)) {
    return defaultOpen.map((index: number) => `item-${index}`);
  }
  if (typeof defaultOpen === 'number') {
    return [`item-${defaultOpen}`];
  }
  if (defaultOpen === 'all') {
    return elements.value.map((_, index) => `item-${index}`);
  }
  // Default to first item open for better UX if there are elements
  return elements.value.length > 0 ? ['item-0'] : [];
});

// Get title for accordion item from element options
const getAccordionTitle = (
  element: UISchemaElement & Record<string, unknown>,
  index: number
): string => {
  return (
    (element as { options?: { accordion?: { title?: string }; title?: string }; text?: string }).options
      ?.accordion?.title ||
    (element as { options?: { accordion?: { title?: string }; title?: string }; text?: string }).options
      ?.title ||
    (element as { options?: { accordion?: { title?: string }; title?: string }; text?: string }).text ||
    `Section ${index + 1}`
  );
};

// Get description for accordion item from element options
const getAccordionDescription = (
  element: UISchemaElement & Record<string, unknown>,
  index: number
): string => {
  return (
    (element as { options?: { accordion?: { description?: string }; description?: string } }).options
      ?.accordion?.description ||
    (element as { options?: { accordion?: { description?: string }; description?: string } }).options
      ?.description ||
    ''
  );
};
</script>
