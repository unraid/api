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
const { partnerLogo, showActivationModal } = storeToRefs(activationCodeStore);
const purchaseStore = usePurchaseStore();

const title = computed<string>(() => props.t("Let's activate your Unraid license!"));
const description = computed<string>(() =>
  props.t(
    `Start by creating an Unraid.net account — this will let you manage your license and access support. Once that's done, we'll guide you through a quick checkout process to register your license and install your key.`
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
      activationCodeStore.setActivationModalHidden(true);
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

    <template #subFooter>
      <ActivationSteps :active-step="2" class="hidden sm:flex mt-6" />
    </template>
  </Modal>
</template>
