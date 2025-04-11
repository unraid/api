<script lang="ts" setup>
import { WanAccessType, WanForwardType } from '~/composables/gql/graphql';
import { useUnraidApiSettingsStore } from '~/store/unraidApiSettings';

const apiSettingsStore = useUnraidApiSettingsStore();

const accessType = ref<WanAccessType>(WanAccessType.DISABLED);
const forwardType = ref<WanForwardType | null>(null);
const port = ref<number | null>(null);

onMounted(async () => {
  const remoteAccessSettings = await apiSettingsStore.getRemoteAccess();
  accessType.value =
    remoteAccessSettings?.accessType ?? WanAccessType.DISABLED;
  forwardType.value = remoteAccessSettings?.forwardType ?? null;
  port.value = remoteAccessSettings?.port ?? null;
});

const setRemoteAccess = () => {
  apiSettingsStore.setupRemoteAccess({
    accessType: accessType.value,
    ...(forwardType.value ? { forwardType: forwardType.value } : {}),
    ...(port.value ? { port: port.value } : {}),
  });
};

watch(accessType, (newVal) => {
  if (newVal !== WanAccessType.DISABLED) {
    forwardType.value = WanForwardType.STATIC;
  }
});
</script>

<template>
  <div class="flex flex-col">
    <h2>Setup Remote Access</h2>
    <label for="forwardType">Forward Type</label>
    <select id="accessType" v-model="accessType">
      <option v-for="(val, index) in Object.values(WanAccessType)" :key="index" :value="val">
        {{ val }}
      </option>
    </select>
    <template v-if="accessType !== WanAccessType.DISABLED">
      <label for="forwardType">Forward Type</label>
      <select id="forwardType" v-model="forwardType">
        <option v-for="(val, index) in Object.values(WanForwardType)" :key="index" :value="val">
          {{ val }}
        </option>
      </select>
    </template>
    <template v-if="forwardType === WanForwardType.STATIC && accessType !== WanAccessType.DISABLED">
      <label for="port">Port</label>
      <input id="port" v-model="port" type="number">
    </template>

    <button @click="setRemoteAccess">
      Save
    </button>
  </div>
</template>
