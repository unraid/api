<script lang="ts" setup>
import { storeToRefs } from 'pinia';

import ActivationPartnerLogoImg from '~/components/Activation/ActivationPartnerLogoImg.vue';
import { useActivationCodeDataStore } from '~/components/Activation/store/activationCodeData';

const { partnerInfo } = storeToRefs(useActivationCodeDataStore());
</script>

<template>
  <template v-if="partnerInfo?.partnerUrl">
    <a
      v-if="partnerInfo?.partnerUrl"
      :href="partnerInfo?.partnerUrl"
      class="opacity-100 hover:opacity-75 focus:opacity-75"
      target="_blank"
      rel="noopener noreferrer"
    >
      <ActivationPartnerLogoImg />
    </a>
    <ActivationPartnerLogoImg v-else />
  </template>
</template>
