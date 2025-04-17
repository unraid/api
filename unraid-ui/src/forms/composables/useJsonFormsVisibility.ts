import type { Layout } from '@jsonforms/core';
import { useJsonFormsLayout, type RendererProps } from '@jsonforms/vue';
import { computed, type ComputedRef } from 'vue';

interface UseJsonFormsVisibilityProps<T extends Layout> {
  rendererProps: RendererProps<T>;
}

interface UseJsonFormsVisibilityReturn {
  layout: ReturnType<typeof useJsonFormsLayout>;
  isVisible: ComputedRef<boolean>;
}

export function useJsonFormsVisibility<T extends Layout>(props: UseJsonFormsVisibilityProps<T>): UseJsonFormsVisibilityReturn {
  const layout = useJsonFormsLayout(props.rendererProps);

  const isVisible = computed(() => {
    // The composable handles rule evaluation and provides the visibility status
    // console.log('[useJsonFormsVisibility] isVisible computed. layout.layout.value.visible:', layout.layout.value.visible);
    return !!layout.layout.value.visible;
  });

  return {
    layout,
    isVisible,
  };
} 