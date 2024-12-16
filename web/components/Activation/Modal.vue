<script lang="ts" setup>
import { ArrowTopRightOnSquareIcon } from "@heroicons/vue/24/solid";
import { storeToRefs } from "pinia";
import type { ComposerTranslation } from "vue-i18n";

import { useActivationCodeStore } from "~/store/activationCode";
import { usePurchaseStore } from "~/store/purchase";
import type { ButtonProps } from "~/types/ui/button";

import ActivationPartnerLogo from "~/components/Activation/PartnerLogo.vue";

export interface Props {
  t: ComposerTranslation;
}

const props = defineProps<Props>();

const activationCodeStore = useActivationCodeStore();
const { partnerLogo, partnerName, showModal } = storeToRefs(activationCodeStore);
const purchaseStore = usePurchaseStore();

const title = computed<string>(() =>
  partnerName.value
    ? props.t(`Welcome to your new {0} system, powered by Unraid!`, [partnerName.value])
    : props.t("Welcome to Unraid!")
);
const description = computed<string>(() =>
  props.t(
    `To get started, let's activate your license and create an Unraid.net Account to provide access to account features like key management and support.`
  )
);
const docsButtons = computed<ButtonProps[]>(() => {
  return [
    {
      btnStyle: "underline",
      external: true,
      href: "https://docs.unraid.net/unraid-os/faq/licensing-faq/",
      iconRight: ArrowTopRightOnSquareIcon,
      size: "14px",
      text: props.t("More about Licensing"),
    },
    {
      btnStyle: "underline",
      external: true,
      href: "https://docs.unraid.net/account/",
      iconRight: ArrowTopRightOnSquareIcon,
      size: "14px",
      text: props.t("More about Unraid.net Accounts"),
    },
  ];
});

/**
 * Listen for a key sequence to close the modal
 * @todo - temporary solution until we have a better way to handle this
 */
onMounted(() => {
  const keySequence = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];
  let sequenceIndex = 0;

  window.addEventListener("keydown", (event) => {
    if (event.key === keySequence[sequenceIndex]) {
      sequenceIndex++;
    } else {
      sequenceIndex = 0;
    }

    if (sequenceIndex === keySequence.length) {
      activationCodeStore.setModalHidden(true);
      window.location.href = "/Tools/Registration";
    }
  });
});

onUnmounted(() => {
  window.removeEventListener("keydown", () => {});
});
</script>

<template>
  <Modal
    v-if="showModal"
    :t="t"
    :open="showModal"
    :show-close-x="false"
    :title="title"
    :title-in-main="!!partnerLogo"
    :description="description"
    overlay-opacity="bg-opacity-90"
    max-width="max-w-800px"
  >
    <template v-if="partnerLogo" #header>
      <ActivationPartnerLogo />
    </template>

    <template #main>
      <div class="flex justify-center gap-4 mx-auto w-full">
        <BrandButton v-for="button in docsButtons" :key="button.text" v-bind="button" />
      </div>
    </template>
    <template #footer>
      <div class="w-full flex gap-8px justify-center mx-auto">
        <BrandButton
          :text="t('Activate Now')"
          :icon-right="ArrowTopRightOnSquareIcon"
          @click="purchaseStore.activate"
        />
      </div>
    </template>
  </Modal>
</template>
