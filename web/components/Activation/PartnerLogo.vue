<script lang="ts" setup>
import { storeToRefs } from "pinia";

import { useActivationCodeStore } from "~/store/activationCode";
import ActivationPartnerLogoImg from "~/components/Activation/PartnerLogoImg.vue";

const { partnerLogo, partnerUrl } = storeToRefs(useActivationCodeStore());
</script>

<template>
  <template v-if="partnerLogo">
    <a v-if="partnerUrl" :href="partnerUrl" class="opacity-100 hover:opacity-75 focus:opacity-75" target="_blank" rel="noopener noreferrer">
      <ActivationPartnerLogoImg />
    </a>
    <ActivationPartnerLogoImg v-else />
  </template>
</template>
