<script setup lang="ts">
import { computed } from 'vue';

// Centralized configuration for logo/text colors
const CLOUD_COLORS = {
  unraid: 'var(--ui-secondary)', // Special Unraid/highlight color
  default: 'var(--ui-secondary)', // Default text/icon color
};

// Helper to determine color based on item property
const getItemColor = (isUnraid?: boolean) => {
  return isUnraid ? CLOUD_COLORS.unraid : CLOUD_COLORS.default;
};

// Dynamically import all SVGs from the partners assets directory as RAW strings
const partnerIcons = import.meta.glob('@/assets/partners/*.svg', {
  eager: true,
  import: 'default',
  query: '?raw', // Get content as string
}) as Record<string, string>;

// Helper to resolve icon content from filename
const getIconContent = (filename: string) => {
  if (!filename) return '';

  // Check if it's a UIcon class (starts with i-)
  if (filename.startsWith('i-')) return '';

  // Try to find the file in the imported glob
  const key = Object.keys(partnerIcons).find((k) => k.endsWith(`/${filename}`));
  return key ? partnerIcons[key] : '';
};

// Helper to check if it's a raw SVG
const isRawSvg = (iconStr: string) => {
  return !!(iconStr && !iconStr.startsWith('i-') && getIconContent(iconStr));
};

// Define structure for cloud items
interface CloudItem {
  name: string;
  icon: string;
  isUnraid?: boolean;
}

const originalRows: { direction: string; duration: string; items: CloudItem[] }[] = [
  // Row 1
  {
    direction: 'left',
    duration: '120s',
    items: [
      { name: 'Unraid', icon: 'simple-icons-unraid.svg', isUnraid: true },
      { name: 'Community Apps', icon: 'i-heroicons-squares-2x2', isUnraid: true },
      { name: 'Unraid Connect', icon: 'simple-icons-unraid.svg', isUnraid: true },
      { name: 'Unraid Forums', icon: 'i-heroicons-chat-bubble-left-right', isUnraid: true },
      { name: 'Unraid Docs', icon: 'i-heroicons-book-open', isUnraid: true },
      { name: 'The Uncast Show', icon: 'simple-icons-unraid.svg', isUnraid: true },
      { name: 'Tailscale', icon: 'simple-icons-tailscale.svg' },
      { name: 'Docker', icon: 'i-heroicons-cube' },
      { name: 'VMs', icon: 'i-heroicons-server-stack' },
      { name: 'ZFS', icon: 'i-heroicons-circle-stack' },
    ],
  },
  // Row 2
  {
    direction: 'right',
    duration: '140s',
    items: [
      { name: 'Tailscale', icon: 'simple-icons-tailscale.svg' },
      { name: 'Docker', icon: 'i-heroicons-cube' },
      { name: 'VMs', icon: 'i-heroicons-server-stack' },
      { name: 'ZFS', icon: 'i-heroicons-circle-stack' },
      { name: 'Unraid', icon: 'simple-icons-unraid.svg', isUnraid: true },
      { name: 'Community Apps', icon: 'i-heroicons-squares-2x2', isUnraid: true },
      { name: 'Unraid Connect', icon: 'simple-icons-unraid.svg', isUnraid: true },
      { name: 'Unraid Forums', icon: 'i-heroicons-chat-bubble-left-right', isUnraid: true },
      { name: 'Unraid Docs', icon: 'i-heroicons-book-open', isUnraid: true },
      { name: 'The Uncast Show', icon: 'simple-icons-unraid.svg', isUnraid: true },
    ],
  },
  // Row 3
  {
    direction: 'left',
    duration: '130s',
    items: [
      { name: 'Unraid Forums', icon: 'i-heroicons-chat-bubble-left-right', isUnraid: true },
      { name: 'Unraid Docs', icon: 'i-heroicons-book-open', isUnraid: true },
      { name: 'The Uncast Show', icon: 'simple-icons-unraid.svg', isUnraid: true },
      { name: 'Tailscale', icon: 'simple-icons-tailscale.svg' },
      { name: 'Docker', icon: 'i-heroicons-cube' },
      { name: 'VMs', icon: 'i-heroicons-server-stack' },
      { name: 'ZFS', icon: 'i-heroicons-circle-stack' },
      { name: 'Unraid', icon: 'simple-icons-unraid.svg', isUnraid: true },
      { name: 'Community Apps', icon: 'i-heroicons-squares-2x2', isUnraid: true },
      { name: 'Unraid Connect', icon: 'simple-icons-unraid.svg', isUnraid: true },
    ],
  },
  // Row 4
  {
    direction: 'right',
    duration: '150s',
    items: [
      { name: 'Unraid', icon: 'simple-icons-unraid.svg', isUnraid: true },
      { name: 'Community Apps', icon: 'i-heroicons-squares-2x2', isUnraid: true },
      { name: 'Unraid Connect', icon: 'simple-icons-unraid.svg', isUnraid: true },
      { name: 'Unraid Forums', icon: 'i-heroicons-chat-bubble-left-right', isUnraid: true },
      { name: 'Unraid Docs', icon: 'i-heroicons-book-open', isUnraid: true },
      { name: 'The Uncast Show', icon: 'simple-icons-unraid.svg', isUnraid: true },
      { name: 'Tailscale', icon: 'simple-icons-tailscale.svg' },
      { name: 'Docker', icon: 'i-heroicons-cube' },
      { name: 'VMs', icon: 'i-heroicons-server-stack' },
      { name: 'ZFS', icon: 'i-heroicons-circle-stack' },
    ],
  },
];

const MIN_ITEMS_PER_ROW = 15;

const rows = computed(() => {
  return originalRows.map((row) => {
    let currentItems = [...row.items];
    while (currentItems.length < MIN_ITEMS_PER_ROW) {
      currentItems = [...currentItems, ...row.items];
    }
    return {
      ...row,
      items: currentItems,
    };
  });
});
</script>

<template>
  <div class="bg-background absolute inset-0 z-0 overflow-hidden">
    <!-- Gradient Mask Layer -->
    <!-- Tuned gradient opacity -->
    <div
      class="from-background/70 pointer-events-none absolute inset-0 z-10 bg-gradient-to-b to-transparent"
    />

    <!-- Rotated & Scaled Container -->
    <div
      class="relative -top-32 left-0 h-[150%] w-[150%] -translate-x-[25%] scale-110 rotate-12 transform opacity-30 transition-all duration-1000 md:scale-125 lg:-top-32 lg:scale-150"
    >
      <div class="flex h-full flex-col justify-center gap-6 md:gap-8 lg:gap-10">
        <div v-for="(row, rowIndex) in rows" :key="rowIndex" class="flex w-full overflow-hidden">
          <!-- Track 1 -->
          <div
            class="flex min-w-full shrink-0 items-center justify-around gap-6 px-4 md:gap-10 md:px-6 lg:gap-16 lg:px-8"
            :class="[row.direction === 'left' ? 'animate-marquee' : 'animate-marquee-reverse']"
            :style="{ animationDuration: row.duration }"
          >
            <div
              v-for="(item, index) in row.items"
              :key="`${rowIndex}-${index}`"
              class="flex items-center gap-2 md:gap-3"
            >
              <div
                class="flex items-center justify-center p-1 md:p-2"
                :style="{ color: getItemColor(item.isUnraid) }"
              >
                <!-- Use inline SVG for local files to allow coloring -->
                <div
                  v-if="isRawSvg(item.icon)"
                  v-html="getIconContent(item.icon)"
                  class="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 [&_path]:fill-current [&>svg]:h-full [&>svg]:w-full [&>svg]:fill-current"
                />
                <UIcon
                  v-else-if="item.icon"
                  :name="item.icon"
                  class="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8"
                />
              </div>
              <span
                v-if="item.name"
                class="text-sm font-bold tracking-wider uppercase md:text-lg lg:text-xl"
                :style="{ color: getItemColor(item.isUnraid) }"
              >
                {{ item.name }}
              </span>
            </div>
          </div>

          <!-- Track 2 (Duplicate for infinite loop) -->
          <div
            class="flex min-w-full shrink-0 items-center justify-around gap-6 px-4 md:gap-10 md:px-6 lg:gap-16 lg:px-8"
            :class="[row.direction === 'left' ? 'animate-marquee' : 'animate-marquee-reverse']"
            :style="{ animationDuration: row.duration }"
          >
            <div
              v-for="(item, index) in row.items"
              :key="`${rowIndex}-${index}-dup`"
              class="flex items-center gap-2 md:gap-3"
            >
              <div
                class="flex items-center justify-center p-1 md:p-2"
                :style="{ color: getItemColor(item.isUnraid) }"
              >
                <!-- Use inline SVG for local files to allow coloring -->
                <div
                  v-if="isRawSvg(item.icon)"
                  v-html="getIconContent(item.icon)"
                  class="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 [&_path]:fill-current [&>svg]:h-full [&>svg]:w-full [&>svg]:fill-current"
                />
                <UIcon
                  v-else-if="item.icon"
                  :name="item.icon"
                  class="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8"
                />
              </div>
              <span
                v-if="item.name"
                class="text-sm font-bold tracking-wider uppercase md:text-lg lg:text-xl"
                :style="{ color: getItemColor(item.isUnraid) }"
              >
                {{ item.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-marquee {
  animation: marquee linear infinite;
}

.animate-marquee-reverse {
  animation: marquee-reverse linear infinite;
}

@keyframes marquee {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-100%);
  }
}

@keyframes marquee-reverse {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(0);
  }
}
</style>
