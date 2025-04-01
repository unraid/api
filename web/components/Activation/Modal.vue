<script lang="ts" setup>
import { storeToRefs } from 'pinia';

import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { Button } from '@unraid/ui';

import type { ButtonProps } from '@unraid/ui';
import type { ComposerTranslation } from 'vue-i18n';

import ActivationPartnerLogo from '~/components/Activation/PartnerLogo.vue';
import { useActivationCodeStore } from '~/store/activationCode';
import { usePurchaseStore } from '~/store/purchase';

export interface Props {
  t: ComposerTranslation;
}

const props = defineProps<Props>();

const activationCodeStore = useActivationCodeStore();
const { partnerLogo, showActivationModal } = storeToRefs(activationCodeStore);
const purchaseStore = usePurchaseStore();

const title = computed<string>(() => props.t("Let's activate your Unraid OS License"));
const description = computed<string>(() =>
  props.t(
    `On the following screen, your license will be activated. You'll then create an Unraid.net Account to manage your license going forward.`
  )
);
const docsButtons = computed<ButtonProps[]>(() => {
  return [
    {
      variant: 'link',
      external: true,
      href: 'https://docs.unraid.net/unraid-os/faq/licensing-faq/',
      iconRight: ArrowTopRightOnSquareIcon,
      size: 'md',
      text: props.t('More about Licensing'),
    },
    {
      variant: 'link',
      external: true,
      href: 'https://docs.unraid.net/account/',
      iconRight: ArrowTopRightOnSquareIcon,
      size: 'md',
      text: props.t('More about Unraid.net Accounts'),
    },
  ];
});

/**
 * Listen for konami code sequence to close the modal
 */
const keySequence = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];
let sequenceIndex = 0;

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === keySequence[sequenceIndex]) {
    sequenceIndex++;
  } else {
    sequenceIndex = 0;
  }

  if (sequenceIndex === keySequence.length) {
    activationCodeStore.setActivationModalHidden(true);
    window.location.href = '/Tools/Registration';
  }
};

onMounted(() => {
  window?.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window?.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Modal
    v-if="showActivationModal"
    :t="t"
    :open="showActivationModal"
    :show-close-x="false"
    :title="title"
    :title-in-main="!!partnerLogo"
    :description="description"
    overlay-color="bg-background"
    overlay-opacity="bg-opacity-100"
    max-width="max-w-800px"
    :modal-vertical-center="false"
    :disable-shadow="true"
  >
    <template v-if="partnerLogo" #header>
      <ActivationPartnerLogo />
    </template>

    <template #footer>
      <div class="w-full flex gap-8px justify-center mx-auto">
        <Button :icon="ArrowTopRightOnSquareIcon" @click="purchaseStore.activate">{{
          t('Activate Now')
        }}</Button>
      </div>
    </template>

    <template #subFooter>
      <div class="flex flex-col gap-6">
        <ActivationSteps :active-step="2" class="hidden sm:flex mt-6" />

        <div class="flex flex-col sm:flex-row justify-center gap-4 mx-auto w-full">
          <Button v-for="(button, index) in docsButtons" :key="index" v-bind="button"></Button>
        </div>
      </div>
    </template>
  </Modal>
</template>
