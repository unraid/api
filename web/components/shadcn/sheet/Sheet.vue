<script setup lang="ts">
import { DialogRoot, type DialogRootEmits, type DialogRootProps, useForwardPropsEmits } from 'radix-vue'

const props = defineProps<DialogRootProps & { class?: string }>()
const emits = defineEmits<DialogRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
const initialViewport = ref(document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? 'width=1300');
const openListener = (opened: boolean) => {
  /**
   * Update meta tags for the root page when oepned
   */

  if (opened) {
    document.querySelector('meta[name="viewport"]')?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0')
  } else {
    document.querySelector('meta[name="viewport"]')?.setAttribute('content', initialViewport.value);
  }
}
</script>

<template>
  <DialogRoot v-bind="forwarded" @update:open="openListener">
    <slot />
  </DialogRoot>
</template>
