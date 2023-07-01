<script setup lang="ts">
export interface Props {
  center?: boolean;
  copy?: string;
  icon?: string;
  title?: string;
}

defineProps<Props>();
</script>

<template>
  <div class="text-left relative flex overflow-hidden">
    <span v-if="!center" class="flex-shrink-0">
      <slot></slot>
    </span>
    <div class="inline-flex flex-col" :class="{ 'text-center': center }">
      <h3 class="text-16px font-semibold" :class="{ 'mt-0 mb-4px': copy, 'my-0': !copy, 'flex flex-row justify-center items-center': center }">
        <span v-if="center" class="flex-shrink-0 mr-8px">
          <slot></slot>
        </span>
        {{ title }}
      </h3>
      <p v-if="copy" v-html="copy" class="text-14px opacity-75 py-0" :class="{'px-8px': center}"></p>
    </div>
  </div>
</template>