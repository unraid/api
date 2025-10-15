<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { BrandButton } from '@unraid/ui';

import usePluginInstaller from '~/components/Activation/usePluginInstaller';
import { PluginInstallStatus } from '~/composables/gql/graphql';

export interface Props {
  onComplete: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  showSkip?: boolean;
  showBack?: boolean;
}

const props = defineProps<Props>();
const { t } = useI18n();

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

const selectedPlugins = ref<Set<string>>(new Set());
const isInstalling = ref(false);
const error = ref<string | null>(null);
const installationLogs = ref<string[]>([]);
const installationFinished = ref(false);

const { installPlugin } = usePluginInstaller();

const appendLogs = (lines: string[] | string) => {
  if (Array.isArray(lines)) {
    lines.forEach((line) => installationLogs.value.push(line));
  } else {
    installationLogs.value.push(lines);
  }
};

const resetCompletionState = () => {
  installationFinished.value = false;
};

const togglePlugin = (pluginId: string) => {
  const next = new Set(selectedPlugins.value);
  if (next.has(pluginId)) {
    next.delete(pluginId);
  } else {
    next.add(pluginId);
  }
  selectedPlugins.value = next;
  resetCompletionState();
};

const handleInstall = async () => {
  if (selectedPlugins.value.size === 0) {
    installationFinished.value = true;
    props.onComplete();
    return;
  }

  isInstalling.value = true;
  error.value = null;
  installationLogs.value = [];
  installationFinished.value = false;

  try {
    const pluginsToInstall = availablePlugins.filter((p) => selectedPlugins.value.has(p.id));

    for (const plugin of pluginsToInstall) {
      appendLogs(t('activation.pluginsStep.installingPluginMessage', { name: plugin.name }));

      const result = await installPlugin({
        url: plugin.url,
        name: plugin.name,
        forced: true,
        onEvent: (event) => {
          if (event.output?.length) {
            appendLogs(event.output.map((line) => `[${plugin.name}] ${line}`));
          }
        },
      });

      if (result.status !== PluginInstallStatus.SUCCEEDED) {
        throw new Error(`Plugin installation failed for ${plugin.name}`);
      }

      appendLogs(t('activation.pluginsStep.pluginInstalledMessage', { name: plugin.name }));
    }

    installationFinished.value = true;
  } catch (err) {
    error.value = t('activation.pluginsStep.installFailed');
    console.error('Failed to install plugins:', err);
    installationFinished.value = false;
  } finally {
    isInstalling.value = false;
  }
};

const handleSkip = () => {
  props.onSkip?.();
};

const handleBack = () => {
  props.onBack?.();
};

const handlePrimaryAction = async () => {
  if (installationFinished.value || selectedPlugins.value.size === 0) {
    props.onComplete();
    return;
  }

  if (!isInstalling.value) {
    await handleInstall();
  }
};

const primaryButtonText = computed(() => {
  if (installationFinished.value) {
    return t('common.continue');
  }
  if (selectedPlugins.value.size > 0) {
    return t('activation.pluginsStep.installSelected');
  }
  return t('common.continue');
});

const isPrimaryActionDisabled = computed(() => {
  if (isInstalling.value) {
    return true;
  }

  if (installationFinished.value) {
    return false;
  }

  return selectedPlugins.value.size === 0;
});
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col items-center justify-center">
    <h2 class="mb-4 text-xl font-semibold">
      {{ t('activation.pluginsStep.installEssentialPlugins') }}
    </h2>
    <p class="mb-8 text-center text-sm opacity-75">
      {{ t('activation.pluginsStep.selectPluginsDescription') }}
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
          :disabled="isInstalling"
          @change="() => togglePlugin(plugin.id)"
          class="text-primary focus:ring-primary mt-1 h-5 w-5 cursor-pointer rounded border-gray-300 focus:ring-2"
        />
        <div class="flex-1">
          <div class="font-semibold">{{ plugin.name }}</div>
          <div class="text-sm opacity-75">{{ plugin.description }}</div>
        </div>
      </label>
    </div>

    <div
      v-if="installationLogs.length > 0"
      class="border-border bg-muted/40 mb-4 max-h-48 w-full overflow-y-auto rounded border p-3 text-left font-mono text-xs"
    >
      <div v-for="(line, index) in installationLogs" :key="`${index}-${line}`">
        {{ line }}
      </div>
    </div>

    <div v-if="error" class="mb-4 text-sm text-red-500">
      {{ error }}
    </div>

    <div class="flex gap-4">
      <BrandButton
        v-if="onBack && showBack"
        :text="t('common.back')"
        variant="outline"
        :disabled="isInstalling"
        @click="handleBack"
      />
      <div class="flex-1" />
      <BrandButton
        v-if="onSkip && showSkip"
        :text="t('common.skip')"
        variant="outline"
        :disabled="isInstalling"
        @click="handleSkip"
      />
      <BrandButton
        :text="primaryButtonText"
        :disabled="isPrimaryActionDisabled"
        :loading="isInstalling"
        @click="handlePrimaryAction"
      />
    </div>
  </div>
</template>
