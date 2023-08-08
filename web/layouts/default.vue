<template>
  <client-only>
    <div class="flex flex-row items-center justify-center gap-6 p-6 text-gray-200 bg-zinc-800">
      <NuxtLink to="/" class="underline hover:no-underline focus:no-underline" active-class="text-orange">
        Test Vue Components
      </NuxtLink>
      <NuxtLink to="/webComponents" class="underline hover:no-underline focus:no-underline" active-class="text-orange">
        Test Web Components
      </NuxtLink>
    </div>
    <slot />
  </client-only>
</template>
