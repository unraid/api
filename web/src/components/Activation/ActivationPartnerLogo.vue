<script lang="ts" setup>
import ActivationPartnerLogoImg from '~/components/Activation/ActivationPartnerLogoImg.vue';

interface Props {
  partnerInfo?: {
    partnerUrl?: string | null;
    partnerLogoUrl?: string | null;
    hasPartnerLogo?: boolean;
  };
}

defineProps<Props>();
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
      <ActivationPartnerLogoImg :partner-info="partnerInfo" />
    </a>
    <ActivationPartnerLogoImg v-else :partner-info="partnerInfo" />
  </template>
</template>
