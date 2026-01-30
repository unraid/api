<script lang="ts" setup>
import OnboardingPartnerLogoImg from '@/components/Onboarding/components/OnboardingPartnerLogoImg.vue';

interface Props {
  partnerInfo?: {
    partner?: { url?: string | null } | null;
    branding?: { logoUrl?: string | null; hasPartnerLogo?: boolean | null } | null;
  } | null;
}

defineProps<Props>();
</script>

<template>
  <template v-if="partnerInfo?.partner?.url">
    <a
      v-if="partnerInfo?.partner?.url"
      :href="partnerInfo?.partner?.url"
      class="opacity-100 hover:opacity-75 focus:opacity-75"
      target="_blank"
      rel="noopener noreferrer"
    >
      <OnboardingPartnerLogoImg :partner-info="partnerInfo" />
    </a>
    <OnboardingPartnerLogoImg v-else :partner-info="partnerInfo" />
  </template>
</template>
