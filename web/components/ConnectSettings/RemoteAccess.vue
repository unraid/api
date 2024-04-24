<script lang="ts" setup>
import { WAN_ACCESS_TYPE, WAN_FORWARD_TYPE } from "~/composables/gql/graphql";
import { useUnraidApiSettingsStore } from "~/store/unraidApiSettings";

const apiSettingsStore = useUnraidApiSettingsStore();

const accessType = ref<WAN_ACCESS_TYPE>(WAN_ACCESS_TYPE.Disabled);
const forwardType = ref<WAN_FORWARD_TYPE | null>(null);
const port = ref<number | null>(null);

onMounted(async () => {
  const remoteAccessSettings = await apiSettingsStore.getRemoteAccess();
  accessType.value =
    remoteAccessSettings?.accessType ?? WAN_ACCESS_TYPE.Disabled;
  forwardType.value = remoteAccessSettings?.forwardType ?? null;
  port.value = remoteAccessSettings?.port ?? null;
});

const setRemoteAccess = () => {
  apiSettingsStore.setupRemoteAccess({
    accessType: accessType.value,
    ...(forwardType ? { forwardType: forwardType.value } : {}),
    ...(port ? { port: port.value } : {}),
  });
};

watch(accessType, (newVal) => {
  if (newVal !== WAN_ACCESS_TYPE.Disabled) {
    forwardType.value = WAN_FORWARD_TYPE.Static;
  }
});
</script>

<template>
  <div class="flex flex-col">
    <h2>Setup Remote Access</h2>
    <label for="forwardType">Forward Type</label>
    <select v-model="accessType" id="forwardType">
      <option v-for="val in Object.values(WAN_ACCESS_TYPE)" :value="val">
        {{ val }}
      </option>
    </select>
    <template v-if="accessType !== WAN_ACCESS_TYPE.Disabled">
      <label for="forwardType">Forward Type</label>
      <select v-model="forwardType" id="forwardType">
        <option v-for="val in Object.values(WAN_FORWARD_TYPE)" :value="val">
          {{ val }}
        </option>
      </select>
    </template>
    <template v-if="forwardType === WAN_FORWARD_TYPE.Static && accessType !== WAN_ACCESS_TYPE.Disabled">
      <label for="port">Port</label>
      <input type="number" v-model="port" id="port" />
    </template>

    <button @click="setRemoteAccess">Save</button>
  </div>
</template>
