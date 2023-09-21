<script setup lang="ts">
import { XCircleIcon } from '@heroicons/vue/24/solid';
import BrandLoading from '~/components/Brand/Loading.vue';
import BrandLoadingWhite from '~/components/Brand/LoadingWhite.vue';

const props = withDefaults(defineProps<{
  color?: 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink' | 'orange' | 'black' | 'white' | 'transparent' | 'current';
  icon?: typeof XCircleIcon | typeof BrandLoading | typeof BrandLoadingWhite;
  iconRight?: typeof XCircleIcon | typeof BrandLoading | typeof BrandLoadingWhite;
  size?: '12px' | '14px' | '16px' | '18px' | '20px' | '24px';
}>(), {
  color: 'gray',
  icon: undefined,
  iconRight: undefined,
  size: '16px',
});

const computedStyleClasses = computed(() => {
  let colorClasses = '';
  let textSize = '';
  let iconSize = '';
  switch (props.color) {
    case 'red':
      colorClasses = 'bg-unraid-red text-white group-hover:bg-orange-dark group-focus:bg-orange-dark';
      break;
    case 'yellow':
      colorClasses = 'bg-yellow-100 text-yellow-800 group-hover:bg-yellow-200 group-focus:bg-yellow-200';
      break;
    case 'green':
      colorClasses = 'bg-green-100 text-green-800 group-hover:bg-green-200 group-focus:bg-green-200';
      break;
    case 'blue':
      colorClasses = 'bg-blue-100 text-blue-800 group-hover:bg-blue-200 group-focus:bg-blue-200';
      break;
    case 'indigo':
      colorClasses = 'bg-indigo-100 text-indigo-800 group-hover:bg-indigo-200 group-focus:bg-indigo-200';
      break;
    case 'purple':
      colorClasses = 'bg-purple-100 text-purple-800 group-hover:bg-purple-200 group-focus:bg-purple-200';
      break;
    case 'pink':
      colorClasses = 'bg-pink-100 text-pink-800 group-hover:bg-pink-200 group-focus:bg-pink-200';
      break;
    case 'orange':
      colorClasses = 'bg-orange text-white group-hover:bg-orange-dark group-focus:bg-orange-dark';
      break;
    case 'black':
      colorClasses = 'bg-black text-white group-hover:bg-gray-800 group-focus:bg-gray-800';
      break;
    case 'white':
      colorClasses = 'bg-white text-black group-hover:bg-gray-100 group-focus:bg-gray-100';
      break;
    case 'transparent':
      colorClasses = 'bg-transparent text-black group-hover:bg-gray-100 group-focus:bg-gray-100';
      break;
    case 'current':
      colorClasses = 'bg-current text-black group-hover:bg-gray-100 group-focus:bg-gray-100';
      break;
    case 'gray':
      colorClasses = 'bg-gray-200 text-gray-800 group-hover:bg-gray-300 group-focus:bg-gray-300';
      break;
  }
  switch (props.size) {
    case '12px':
      textSize = 'text-12px px-8px py-4px';
      iconSize = 'w-12px';
      break;
    case '14px':
      textSize = 'text-14px px-8px py-4px';
      iconSize = 'w-14px';
      break;
    case '16px':
      textSize = 'text-16px px-12px py-8px';
      iconSize = 'w-16px';
      break;
    case '18px':
      textSize = 'text-18px px-12px py-8px';
      iconSize = 'w-18px';
      break;
    case '20px':
      textSize = 'text-20px px-16px py-12px';
      iconSize = 'w-20px';
      break;
    case '24px':
      textSize = 'text-24px px-16px py-12px';
      iconSize = 'w-24px';
      break;
  }

  return {
    badge: `${textSize} ${colorClasses}`,
    icon: iconSize,
  };
});
</script>

<template>
  <span
    class="inline-flex items-center rounded-full font-semibold leading-none transition-all duration-200 ease-in-out"
    :class="[
      computedStyleClasses.badge,
      icon || iconRight ? 'gap-8px' : '',
    ]"
  >
    <component :is="icon" v-if="icon" class="flex-shrink-0" :class="computedStyleClasses.icon" />
    <slot></slot>
    <component :is="iconRight" v-if="iconRight" class="flex-shrink-0" :class="computedStyleClasses.icon" />
  </span>
</template>
