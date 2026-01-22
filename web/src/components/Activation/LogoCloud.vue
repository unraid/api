<script setup lang="ts">
import { computed } from 'vue';

// Centralized configuration for logo/text colors
const CLOUD_COLORS = {
  unraid: '#F15A2C', // Special Unraid/highlight color
  default: 'rgba(var(--foreground), 0.4)', // Default text/icon color
};

// Helper to determine color based on item property
const getItemColor = (isUnraid?: boolean) => {
  return isUnraid ? CLOUD_COLORS.unraid : CLOUD_COLORS.default;
};

// Dynamically import all SVGs from the partners assets directory
// We use 'as any' to avoid potential TS issues with the glob return type in this context,
// though strictly it returns Record<string, string> with { eager: true, import: 'default' }
const partnerIcons = import.meta.glob('@/assets/partners/*.svg', {
  eager: true,
  import: 'default',
  query: '?url', // Ensure we get the URL string, not a component
}) as Record<string, string>;

// Helper to resolve icon URL from filename
const getIconUrl = (filename: string) => {
  if (!filename) return '';

  // Check if it's a UIcon class (starts with i-)
  if (filename.startsWith('i-')) return filename;

  // Try to find the file in the imported glob
  // The keys in import.meta.glob are absolute local paths relative to the project root or src depending on alias
  // Since we used @ alias, keys usually look like: /src/assets/partners/filename.svg
  // Let's match by ending.
  const key = Object.keys(partnerIcons).find((k) => k.endsWith(`/${filename}`));
  return key ? partnerIcons[key] : '';
};

// Helper to check if it's an image url
const isImageUrl = (iconStr: string) => {
  const url = getIconUrl(iconStr);
  return !!(url && !iconStr.startsWith('i-') && (url.startsWith('/') || url.startsWith('data:')));
};

// Define structure for cloud items
interface CloudItem {
  name: string;
  // INSTRUCTION: Use the filename like 'simple-icons-unraid.svg' if in @/assets/partners/
  // OR use a UIcon class like 'i-heroicons-squares-2x2'
  icon: string;
  isUnraid?: boolean;
}

// Row configuration
const originalRows: { direction: string; duration: string; items: CloudItem[] }[] = [
  // Row 1 (Unraid Ecosystem)
  {
    direction: 'left',
    duration: '60s',
    items: [
      { name: 'Unraid', icon: 'simple-icons-unraid.svg', isUnraid: true },
      { name: 'Community Apps', icon: 'i-heroicons-squares-2x2', isUnraid: true },
      { name: 'Unraid Connect', icon: 'simple-icons-unraid.svg', isUnraid: true },
      { name: 'Unraid Forums', icon: 'i-heroicons-chat-bubble-left-right', isUnraid: true },
    ],
  },
  // Row 2 (Apps)
  {
    direction: 'right',
    duration: '70s',
    items: [
      { name: 'Tailscale', icon: 'simple-icons-tailscale.svg' },
      { name: 'Plex', icon: 'simple-icons-plex.svg' },
      { name: 'Jellyfin', icon: 'simple-icons-jellyfin.svg' },
      { name: 'Nextcloud', icon: 'simple-icons-nextcloud.svg' },
      { name: 'Home Assistant', icon: 'simple-icons-home-assistant.svg' },
      { name: 'Pi-hole', icon: 'simple-icons-pihole.svg' },
      { name: 'Vaultwarden', icon: 'simple-icons-vaultwarden.svg' },
      { name: 'Grafana', icon: 'simple-icons-grafana.svg' },
    ],
  },
  // Row 3 (Tools)
  {
    direction: 'left',
    duration: '65s',
    items: [
      { name: 'Jellyseerr', icon: '' }, // no icon
      { name: 'GitLab', icon: 'simple-icons-github.svg' },
      { name: 'Syncthing', icon: 'simple-icons-syncthing.svg' },
      { name: 'Uptime Kuma', icon: 'simple-icons-uptime-kuma.svg' },
      { name: 'Traefik', icon: 'simple-icons-traefik.svg' },
      { name: 'Overseerr', icon: '' }, // no icon
    ],
  },
  // Row 4 (Hardware)
  {
    direction: 'right',
    duration: '75s',
    items: [
      { name: '', icon: 'simple-icons-intel.svg' },
      { name: '', icon: 'simple-icons-amd.svg' },
      { name: 'NVIDIA', icon: 'simple-icons-nvidia.svg' },
      { name: 'Seagate', icon: 'simple-icons-seagate.svg' },
      { name: 'Western Digital', icon: 'simple-icons-westerndigital.svg' },
      { name: '45Drives', icon: '' }, // no icon
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
      class="relative -top-32 left-0 h-[150%] w-[150%] -translate-x-[25%] scale-150 rotate-12 transform opacity-30 grayscale transition-all duration-1000"
    >
      <div class="flex h-full flex-col justify-center gap-10">
        <div v-for="(row, rowIndex) in rows" :key="rowIndex" class="flex w-full overflow-hidden">
          <!-- Track 1 -->
          <div
            class="flex min-w-full shrink-0 items-center justify-around gap-16 px-8"
            :class="[row.direction === 'left' ? 'animate-marquee' : 'animate-marquee-reverse']"
            :style="{ animationDuration: row.duration }"
          >
            <div
              v-for="(item, index) in row.items"
              :key="`${rowIndex}-${index}`"
              class="flex items-center gap-3"
            >
              <div
                class="flex items-center justify-center p-2"
                :style="{ color: getItemColor(item.isUnraid) }"
              >
                <img
                  v-if="isImageUrl(item.icon)"
                  :src="getIconUrl(item.icon)"
                  class="h-8 w-8 object-contain"
                  style="filter: brightness(0) saturate(100%)"
                />
                <UIcon v-else-if="item.icon" :name="item.icon" class="h-8 w-8" />
              </div>
              <span
                v-if="item.name"
                class="text-xl font-bold tracking-wider uppercase"
                :style="{ color: getItemColor(item.isUnraid) }"
              >
                {{ item.name }}
              </span>
            </div>
          </div>

          <!-- Track 2 (Duplicate for infinite loop) -->
          <div
            class="flex min-w-full shrink-0 items-center justify-around gap-16 px-8"
            :class="[row.direction === 'left' ? 'animate-marquee' : 'animate-marquee-reverse']"
            :style="{ animationDuration: row.duration }"
          >
            <div
              v-for="(item, index) in row.items"
              :key="`${rowIndex}-${index}-dup`"
              class="flex items-center gap-3"
            >
              <div
                class="flex items-center justify-center p-2"
                :style="{ color: getItemColor(item.isUnraid) }"
              >
                <img
                  v-if="isImageUrl(item.icon)"
                  :src="getIconUrl(item.icon)"
                  class="h-8 w-8 object-contain"
                  style="filter: brightness(0) saturate(100%)"
                />
                <UIcon v-else-if="item.icon" :name="item.icon" class="h-8 w-8" />
              </div>
              <span
                v-if="item.name"
                class="text-xl font-bold tracking-wider uppercase"
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
