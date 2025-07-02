<script setup lang="ts">
import { Button } from '@/components/common/button';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface DropdownMenuItemData {
  type?: 'item' | 'label' | 'separator';
  label?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export interface DropdownMenuProps {
  items?: DropdownMenuItemData[];
  trigger?: string;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
}

const props = withDefaults(defineProps<DropdownMenuProps>(), {
  align: 'start',
  side: 'bottom',
  sideOffset: 4,
});

const emit = defineEmits<{
  select: [item: DropdownMenuItemData];
}>();

function handleItemClick(item: DropdownMenuItemData) {
  item.onClick?.();

  emit('select', item);
}
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger v-if="!$slots.trigger" as-child>
      <Button variant="primary">
        {{ props.trigger || 'Options' }}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuTrigger v-else as-child>
      <slot name="trigger" />
    </DropdownMenuTrigger>

    <DropdownMenuContent :align="props.align" :side="props.side" :side-offset="props.sideOffset">
      <!--Slot for direct composition -->
      <slot name="content" />

      <!-- Props-based items rendering -->
      <template v-if="props.items && props.items.length > 0">
        <template v-for="item in props.items" :key="item.label || item.type">
          <DropdownMenuSeparator v-if="item.type === 'separator'" />

          <DropdownMenuLabel v-else-if="item.type === 'label'">
            {{ item.label }}
          </DropdownMenuLabel>

          <DropdownMenuItem v-else :disabled="item.disabled" @click="handleItemClick(item)">
            {{ item.label }}
          </DropdownMenuItem>
        </template>
      </template>
    </DropdownMenuContent>
  </DropdownMenuRoot>
</template>
