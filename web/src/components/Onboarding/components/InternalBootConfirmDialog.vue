<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  open: boolean;
  action: 'reboot' | 'shutdown';
  disabled?: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const { t } = useI18n();

const title = computed(() =>
  props.action === 'reboot'
    ? t('onboarding.nextSteps.confirmReboot.title')
    : t('onboarding.nextSteps.confirmShutdown.title')
);
</script>

<template>
  <UModal
    :open="open"
    :portal="false"
    :title="title"
    :description="t('onboarding.nextSteps.confirmReboot.description')"
    :ui="{ footer: 'justify-end', overlay: 'z-50', content: 'z-50 max-w-md' }"
    @update:open="
      (value) => {
        if (!value) emit('cancel');
      }
    "
  >
    <template #body>
      <UAlert
        color="warning"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        :description="t('onboarding.nextSteps.confirmReboot.warning')"
      />
    </template>
    <template #footer>
      <UButton color="neutral" variant="outline" :disabled="disabled" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </UButton>
      <UButton :disabled="disabled" @click="emit('confirm')">
        {{ t('onboarding.nextSteps.confirmReboot.confirm') }}
      </UButton>
    </template>
  </UModal>
</template>
