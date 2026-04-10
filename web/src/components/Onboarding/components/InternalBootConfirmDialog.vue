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
const tpmLicensingFaqUrl = 'https://docs.unraid.net/unraid-os/troubleshooting/tpm-licensing-faq/';

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
      <div class="space-y-4">
        <UAlert
          color="neutral"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :description="t('onboarding.nextSteps.confirmReboot.warning')"
        />

        <div class="text-muted space-y-2 text-sm leading-6">
          <p>
            {{ t('onboarding.nextSteps.confirmReboot.licensingNote') }}
            <br />
            <br />
            <strong class="text-toned font-semibold">{{
              t('onboarding.nextSteps.confirmReboot.licensingTpmLead')
            }}</strong>
            {{ t('onboarding.nextSteps.confirmReboot.licensingTpmDetail') }}
          </p>
          <a
            :href="tpmLicensingFaqUrl"
            target="_blank"
            rel="noopener noreferrer"
            @click.stop
            class="text-primary hover:text-primary/80 inline-flex items-center gap-1.5 font-medium hover:underline"
          >
            <span>{{ t('onboarding.nextSteps.confirmReboot.licensingFaq') }}</span>
            <UIcon name="i-heroicons-arrow-top-right-on-square" class="h-4 w-4 opacity-70" />
          </a>
        </div>
      </div>
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
