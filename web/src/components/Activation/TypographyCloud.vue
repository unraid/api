<script setup lang="ts">
const words = [
  { text: 'Store', top: '10%', left: '5%', size: 'text-6xl', blur: 'blur-none', opacity: 0.14 },
  { text: 'Share', top: '15%', left: '80%', size: 'text-7xl', blur: 'blur-none', opacity: 0.18 },
  { text: 'Protect', top: '35%', left: '10%', size: 'text-5xl', blur: 'blur-none', opacity: 0.12 },
  { text: 'Expand', top: '45%', left: '85%', size: 'text-6xl', blur: 'blur-none', opacity: 0.14 },
  { text: 'Backup', top: '70%', left: '5%', size: 'text-7xl', blur: 'blur-none', opacity: 0.18 },
  { text: 'Stream', top: '75%', left: '75%', size: 'text-5xl', blur: 'blur-none', opacity: 0.14 },
  { text: 'Automate', top: '20%', left: '40%', size: 'text-8xl', blur: 'blur-none', opacity: 0.16 },
  { text: 'Run', top: '80%', left: '45%', size: 'text-9xl', blur: 'blur-none', opacity: 0.12 },
  { text: 'Monitor', top: '5%', left: '60%', size: 'text-5xl', blur: 'blur-none', opacity: 0.12 },
  { text: 'Secure', top: '55%', left: '15%', size: 'text-6xl', blur: 'blur-none', opacity: 0.14 },
  { text: 'Sync', top: '25%', left: '20%', size: 'text-5xl', blur: 'blur-none', opacity: 0.12 },
  { text: 'Restore', top: '90%', left: '25%', size: 'text-6xl', blur: 'blur-none', opacity: 0.14 },
];
</script>

<template>
  <div class="bg-background pointer-events-none absolute inset-0 z-0 overflow-hidden">
    <!-- Main Content Container with Mask -->
    <div class="relative h-full w-full">
      <!-- Gradient Mask to fade edges and center -->
      <div
        class="from-background to-background absolute inset-0 z-10 bg-gradient-to-b via-transparent"
      />
      <div
        class="from-background/50 to-background/50 absolute inset-0 z-10 bg-gradient-to-r via-transparent"
      />

      <div
        v-for="(word, index) in words"
        :key="index"
        class="text-primary absolute font-black tracking-widest uppercase transition-transform duration-[20s] ease-in-out hover:scale-105"
        :class="[word.size, word.blur, 'animate-float']"
        :style="{
          top: word.top,
          left: word.left,
          opacity: word.opacity,
          animationDelay: `${index * 1.5}s`,
        }"
      >
        {{ word.text }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-float {
  animation: float 20s infinite ease-in-out;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-20px);
  }
}
</style>
