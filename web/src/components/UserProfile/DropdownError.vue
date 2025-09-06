<script setup lang="ts">
// eslint-disable vue/no-v-html
import { storeToRefs } from 'pinia';

import type { UserProfileLink } from '~/types/userProfile';
import type { ComposerTranslation } from 'vue-i18n';

import UpcDropdownItem from '~/components/UserProfile/DropdownItem.vue';
import { useErrorsStore } from '~/store/errors';

defineProps<{ t: ComposerTranslation }>();

const errorsStore = useErrorsStore();
const { errors } = storeToRefs(errorsStore);
</script>

<template>
  <ul
    v-if="errors.length"
    class="list-reset border-muted mb-1 flex flex-col gap-y-2 rounded-md border-2 border-solid"
  >
    <li v-for="(error, index) in errors" :key="index" class="flex flex-col gap-2">
      <h3 class="bg-unraid-red/90 px-3 py-1 text-lg font-semibold text-white">
        <span>{{ t(error.heading) }}</span>
      </h3>
      <div
        class="flex flex-col gap-y-2 px-3 text-sm"
        :class="{ 'pb-2': !error.actions }"
        v-html="t(error.message)"
      />
      <nav v-if="error.actions">
        <li v-for="(link, idx) in error.actions" :key="`link_${idx}`">
          <UpcDropdownItem :item="link as UserProfileLink" :rounded="false" :t="t" />
        </li>
      </nav>
    </li>
  </ul>
</template>
