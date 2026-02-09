<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/solid';

const props = defineProps<{
  code: string;
}>();

const { t } = useI18n();
const isCodeRevealed = ref(false);

const toggleCodeReveal = () => {
  isCodeRevealed.value = !isCodeRevealed.value;
};
</script>

<template>
  <div class="flex min-w-0 items-center gap-2">
    <span
      class="text-highlighted border-muted bg-muted/40 min-w-0 truncate rounded-md border px-2 py-1 font-mono text-sm font-bold tracking-wide"
    >
      {{ isCodeRevealed ? props.code : '••••••••••••••••' }}
    </span>
    <button
      @click.stop="toggleCodeReveal"
      class="text-muted hover:text-primary shrink-0 transition-colors focus:outline-none"
      :title="
        isCodeRevealed
          ? t('registration.actions.hideActivationCode')
          : t('registration.actions.showActivationCode')
      "
      type="button"
    >
      <EyeIcon v-if="!isCodeRevealed" class="h-4 w-4" />
      <EyeSlashIcon v-else class="h-4 w-4" />
    </button>
  </div>
</template>
