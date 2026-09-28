import { nextTick, ref } from 'vue';

import type { DropdownMenuItem } from '@nuxt/ui/components/DropdownMenu.vue';

export interface ContextMenuOptions<T = unknown> {
  x: number;
  y: number;
  items: DropdownMenuItem[][];
  rowId: string | null;
  meta?: T;
}

export function useContextMenu<T = unknown>() {
  const isOpen = ref(false);
  const position = ref({ x: 0, y: 0 });
  const items = ref<DropdownMenuItem[][]>([]);
  const targetRowId = ref<string | null>(null);
  const targetMeta = ref<T | undefined>(undefined);

  const popperOptions = {
    strategy: 'fixed' as const,
    placement: 'bottom-start' as const,
    offset: 4,
  };

  async function openContextMenu(options: ContextMenuOptions<T>) {
    isOpen.value = false;
    position.value = { x: options.x, y: options.y };
    items.value = options.items;
    targetRowId.value = options.rowId;
    targetMeta.value = options.meta;

    await nextTick();
    isOpen.value = true;
  }

  function closeContextMenu() {
    isOpen.value = false;
  }

  return {
    isOpen,
    position,
    items,
    targetRowId,
    targetMeta,
    popperOptions,
    openContextMenu,
    closeContextMenu,
  };
}
