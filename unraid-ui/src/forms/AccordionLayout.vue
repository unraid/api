<template>
  <div v-if="layout.visible !== false" class="space-y-4">
    <AccordionRoot :type="'multiple'" :defaultValue="defaultOpenItems" class="space-y-2">
      <AccordionItem
        v-for="(element, index) in elements"
        :key="`${layout.path || ''}-${index}`"
        :value="`item-${index}`"
        class="bg-background border-muted rounded-lg border"
      >
        <AccordionTrigger class="hover:bg-muted/50 px-4 py-3 [&[data-state=open]>svg]:rotate-180">
          <div class="flex flex-col items-start space-y-1 text-left">
            <span class="font-medium">
              {{ getAccordionTitle(element, index) }}
            </span>
            <span v-if="getAccordionDescription(element, index)" class="text-muted-foreground text-sm">
              {{ getAccordionDescription(element, index) }}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent class="px-4 pt-0 pb-4">
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
import type { BaseUISchemaElement, Labelable, Layout, UISchemaElement } from '@jsonforms/core';
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
  return allElements.filter((element) => {
    const elementWithRule = element as BaseUISchemaElement;
    if (!elementWithRule.rule) {
      // No rule means always visible
      return true;
    }

    // Use JSONForms isVisible function to evaluate rule
    try {
      // Get the root data from JSONForms context for rule evaluation
      const rootData = jsonFormsContext?.core?.data || {};
      const formData = props.data || rootData;
      const formPath = props.path || layout.value.path || '';

      const visible = isVisible(element, formData, formPath, jsonFormsAjv);
      return visible;
    } catch (error) {
      console.warn('[AccordionLayout] Error evaluating visibility:', error, elementWithRule.rule);
      return true; // Default to visible on error
    }
  });
});

// Extract accordion configuration from options
const accordionOptions = computed(() => props.uischema?.options?.accordion || {});

// Determine which items should be open by default
const defaultOpenItems = computed(() => {
  const defaultOpen = accordionOptions.value?.defaultOpen;
  const allElements = props.uischema?.elements || [];

  // Helper function to map original index to filtered position
  const mapOriginalToFiltered = (originalIndex: number): number | null => {
    const originalElement = allElements[originalIndex];
    if (!originalElement) return null;

    const filteredIndex = elements.value.findIndex((el) => el === originalElement);
    return filteredIndex >= 0 ? filteredIndex : null;
  };

  if (Array.isArray(defaultOpen)) {
    // Map original indices to filtered positions
    const mappedItems = defaultOpen
      .map((originalIndex: number) => {
        const filteredIndex = mapOriginalToFiltered(originalIndex);
        return filteredIndex !== null ? `item-${filteredIndex}` : null;
      })
      .filter((item) => item !== null);
    return mappedItems.length > 0 ? mappedItems : elements.value.length > 0 ? ['item-0'] : [];
  }
  if (typeof defaultOpen === 'number') {
    // Map single original index to filtered position
    const filteredIndex = mapOriginalToFiltered(defaultOpen);
    return filteredIndex !== null
      ? [`item-${filteredIndex}`]
      : elements.value.length > 0
        ? ['item-0']
        : [];
  }
  if (defaultOpen === 'all') {
    return elements.value.map((_, index) => `item-${index}`);
  }
  // Default to first item open for better UX if there are elements
  return elements.value.length > 0 ? ['item-0'] : [];
});

// Get title for accordion item from element options
const getAccordionTitle = (element: UISchemaElement, index: number): string => {
  const el = element as BaseUISchemaElement & Labelable;
  const options = el.options;
  const accordionTitle = options?.accordion?.title;
  const title = options?.title;
  const text = el.label;
  return accordionTitle || title || text || `Section ${index + 1}`;
};

// Get description for accordion item from element options
const getAccordionDescription = (element: UISchemaElement, _index: number): string => {
  const el = element as BaseUISchemaElement;
  const options = el.options;
  const accordionDescription = options?.accordion?.description;
  const description = options?.description;
  return accordionDescription || description || '';
};
</script>
