<script setup lang="ts">
// eslint-disable vue/no-v-html
import { storeToRefs } from 'pinia';
import type { ComposerTranslation } from 'vue-i18n';

import { useErrorsStore } from '~/store/errors';
import type { UserProfileLink } from '~/types/userProfile';
import UpcDropdownItem from './DropdownItem.vue';

defineProps<{ t: ComposerTranslation; }>();

const errorsStore = useErrorsStore();
const { errors } = storeToRefs(errorsStore);
</script>

<template>
  <ul v-if="errors.length" class="list-reset flex flex-col gap-y-2 mb-1 border-2 border-solid border-muted rounded-md">
    <li v-for="(error, index) in errors" :key="index" class="flex flex-col gap-2">
      <h3 class="text-lg py-1 px-3 text-white bg-unraid-red/90 font-semibold">
        <span>{{ t(error.heading) }}</span>
      </h3>
      <div class="text-sm px-3 flex flex-col gap-y-2" :class="{ 'pb-2': !error.actions }" v-html="t(error.message)" />
      <nav v-if="error.actions">
        <li v-for="(link, idx) in error.actions" :key="`link_${idx}`">
          <UpcDropdownItem :item="link as UserProfileLink" :rounded="false" :t="t" />
        </li>
      </nav>
    </li>
  </ul>
</template>
