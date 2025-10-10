<script lang="ts" setup>
import { ref } from 'vue';

import { BrandButton } from '@unraid/ui';
import useInstallPlugin from '@/composables/installPlugin';

import type { ComposerTranslation } from 'vue-i18n';

export interface Props {
  t: ComposerTranslation;
  onComplete: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

const props = defineProps<Props>();

interface Plugin {
  id: string;
  name: string;
  description: string;
  url: string;
}

const availablePlugins: Plugin[] = [
  {
    id: 'community-apps',
    name: 'Community Apps',
    description: 'Browse and install plugins and Docker containers',
    url: 'https://raw.githubusercontent.com/unraid/community.applications/master/plugins/community.applications.plg',
  },
  {
    id: 'fix-common-problems',
    name: 'Fix Common Problems',
    description: 'Automatically detect and fix common configuration issues',
    url: 'https://raw.githubusercontent.com/unraid/fix.common.problems/master/plugins/fix.common.problems.plg',
  },
  {
    id: 'tailscale',
    name: 'Tailscale',
    description: 'Secure remote access with Tailscale VPN',
    url: 'https://raw.githubusercontent.com/unraid/unraid-tailscale/main/plugin/tailscale.plg',
  },
];

const selectedPlugins = ref<Set<string>>(new Set(availablePlugins.map((p) => p.id)));
const isInstalling = ref(false);
const error = ref<string | null>(null);

const { install } = useInstallPlugin();

const togglePlugin = (pluginId: string) => {
  if (selectedPlugins.value.has(pluginId)) {
    selectedPlugins.value.delete(pluginId);
  } else {
    selectedPlugins.value.add(pluginId);
  }
};

const handleInstall = async () => {
  if (selectedPlugins.value.size === 0) {
    props.onComplete();
    return;
  }

  isInstalling.value = true;
  error.value = null;

  try {
    const pluginsToInstall = availablePlugins.filter((p) => selectedPlugins.value.has(p.id));

    for (const plugin of pluginsToInstall) {
      install({
        pluginUrl: plugin.url,
        modalTitle: `Installing ${plugin.name}`,
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    props.onComplete();
  } catch (err) {
    error.value = props.t('Failed to install plugins. Please try again.');
    console.error('Failed to install plugins:', err);
  } finally {
    isInstalling.value = false;
  }
};

const handleSkip = () => {
  props.onSkip?.();
};
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col items-center justify-center">
    <h2 class="mb-4 text-xl font-semibold">{{ t('Install Essential Plugins') }}</h2>
    <p class="mb-8 text-center text-sm opacity-75">
      {{ t('Select the plugins you want to install. You can always add more later.') }}
    </p>

    <div class="mb-8 flex w-full flex-col gap-4">
      <label
        v-for="plugin in availablePlugins"
        :key="plugin.id"
        :for="plugin.id"
        class="border-border bg-card hover:bg-accent/50 flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors"
      >
        <input
          :id="plugin.id"
          type="checkbox"
          :checked="selectedPlugins.has(plugin.id)"
          @change="() => togglePlugin(plugin.id)"
          class="text-primary focus:ring-primary mt-1 h-5 w-5 cursor-pointer rounded border-gray-300 focus:ring-2"
        />
        <div class="flex-1">
          <div class="font-semibold">{{ plugin.name }}</div>
          <div class="text-sm opacity-75">{{ plugin.description }}</div>
        </div>
      </label>
    </div>

    <div v-if="error" class="mb-4 text-sm text-red-500">
      {{ error }}
    </div>

    <div class="flex gap-4">
      <BrandButton
        v-if="onSkip && showSkip"
        :text="t('Skip')"
        variant="outline"
        :disabled="isInstalling"
        @click="handleSkip"
      />
      <BrandButton
        :text="selectedPlugins.size > 0 ? t('Install & Continue') : t('Continue')"
        :disabled="isInstalling"
        :loading="isInstalling"
        @click="handleInstall"
      />
    </div>
  </div>
</template>
