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
  <div
    class="text-left relative flex overflow-hidden p-8px"
    :class="{
      'w-full sm:w-1/2': !center,
      'max-w-640px': center,
    }"
  >
    <span v-if="!center" class="flex-shrink-0">
      <slot></slot>
    </span>
    <div class="inline-flex flex-col pl-4 mr-4" :class="{ 'text-center': center }">
      <h3 class="font-semibold" :class="{ 'mt-0 mb-4px': copy, 'my-0': !copy, 'flex flex-row justify-center items-center': center }">
        <span v-if="center" class="flex-shrink-0 mr-8px">
          <slot></slot>
        </span>
        {{ title }}
      </h3>
      <p v-if="copy" v-html="copy" class="opacity-90 py-0" :class="{'px-8px': center}"></p>
    </div>
  </div>
</template>