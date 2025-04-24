<script lang="ts" setup>
import { storeToRefs } from "pinia";

import { useActivationCodeDataStore } from "~/components/Activation/store/activationCodeData";
import ActivationPartnerLogoImg from "~/components/Activation/PartnerLogoImg.vue";

const { activationCode} = storeToRefs(useActivationCodeDataStore());
</script>

<template>
  <template v-if="">
    <a v-if="partnerUrl" :href="partnerUrl" class="opacity-100 hover:opacity-75 focus:opacity-75" target="_blank" rel="noopener noreferrer">
      <ActivationPartnerLogoImg />
    </a>
    <ActivationPartnerLogoImg v-else />
  </template>
</template>
