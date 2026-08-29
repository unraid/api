<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  Button,
  Input,
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@unraid/ui';

import type {
  ConnectGatewayServiceInput,
  ConnectGatewaySettingsInput,
  ConnectTunnelPageQuery,
} from '~/composables/gql/graphql';

const {
  state,
  providers = [],
  saving = false,
  unavailable = false,
  error = '',
  saved = false,
} = defineProps<{
  state: ConnectTunnelPageQuery['connectTunnelSettings'];
  providers?: { id: string; name: string }[];
  saving?: boolean;
  unavailable?: boolean;
  error?: string;
  saved?: boolean;
}>();
const emit = defineEmits<{ save: [input: ConnectGatewaySettingsInput] }>();
const { t } = useI18n();
const id = useId();
const form = ref<HTMLFormElement>();
const draft = ref<ConnectGatewayServiceInput | null>(null);
const editingRevision = ref(0);
const removing = ref<string | null>(null);
const pendingSubmission = ref(false);
const applicationAuthAcknowledged = ref(false);
watch(
  () => [draft.value?.auth, draft.value?.upstream, draft.value?.tlsServerName],
  () => {
    applicationAuthAcknowledged.value = false;
  }
);
const authOptions = computed(() => [
  { value: 'account', label: t('connectServices.accountAuth') },
  ...providers.map((provider) => ({ value: `oidc:${provider.id}`, label: provider.name })),
  { value: 'upstream', label: t('connectServices.applicationAuth') },
]);
const needsAcknowledgment = computed(
  () => draft.value?.auth === 'upstream' && !applicationAuthAcknowledged.value
);
const selectedAuth = computed(() =>
  draft.value?.auth === 'oidc' ? `oidc:${draft.value.providerId}` : draft.value?.auth
);
const missingProvider = computed(
  () => draft.value?.auth === 'oidc' && !providers.some((p) => p.id === draft.value?.providerId)
);
function selectAuth(value: unknown) {
  if (!draft.value || typeof value !== 'string') return;
  if (value === 'account' || value === 'upstream') {
    draft.value.auth = value;
    draft.value.providerId = '';
    draft.value.subjects = [];
  } else if (value.startsWith('oidc:') && providers.some((p) => p.id === value.slice(5))) {
    draft.value.auth = 'oidc';
    draft.value.providerId = value.slice(5);
    draft.value.subjects = [];
  }
}
const subjectText = computed({
  get: () => draft.value?.subjects?.join('\n') ?? '',
  set: (value: string) => {
    if (draft.value) draft.value.subjects = value.split('\n');
  },
});
const editable = (s: ConnectGatewayServiceInput): ConnectGatewayServiceInput => ({
  id: s.id,
  name: s.name,
  upstream: s.upstream,
  tlsServerName: s.tlsServerName,
  enabled: s.enabled,
  auth: s.auth ?? 'account',
  providerId: s.providerId ?? '',
  subjects: (s.subjects ?? []).map((subject) => subject.trim()).filter(Boolean),
});
const ready = computed(
  () =>
    state.tunnelRemoteAccessEnabled &&
    state.status.gateway === 'ready' &&
    state.status.routeState === 'ready' &&
    state.status.tunnel === 'connected'
);
const blocked = computed(() => saving || unavailable || !state.signedIn);
const stale = computed(() => draft.value !== null && editingRevision.value !== state.gateway.revision);
const canChange = computed(
  () =>
    !blocked.value &&
    state.gateway.available &&
    (!state.gateway.pending || !state.tunnelRemoteAccessEnabled)
);
watch(
  () => saving,
  (value, previous) => {
    if (previous && !value && pendingSubmission.value) {
      pendingSubmission.value = false;
      if (saved) {
        draft.value = null;
        removing.value = null;
      }
    }
  }
);
function edit(service?: ConnectGatewayServiceInput) {
  if (!canChange.value) return;
  editingRevision.value = state.gateway.revision;
  const token = Array.from(crypto.getRandomValues(new Uint8Array(8)), (n) =>
    n.toString(16).padStart(2, '0')
  ).join('');
  draft.value = service
    ? editable(service)
    : {
        id: `app-${token}`,
        name: '',
        upstream: '',
        tlsServerName: '',
        enabled: false,
        auth: 'account',
        providerId: '',
        subjects: [],
      };
  removing.value = null;
  applicationAuthAcknowledged.value = false;
}
function submit() {
  if (
    !draft.value ||
    !canChange.value ||
    stale.value ||
    needsAcknowledgment.value ||
    missingProvider.value ||
    !form.value?.reportValidity()
  )
    return;
  const services = state.gateway.services.filter((s) => s.id !== draft.value?.id).map(editable);
  services.push(editable(draft.value));
  pendingSubmission.value = true;
  emit('save', { expectedRevision: editingRevision.value, services });
}
function remove(serviceId: string) {
  if (!canChange.value) return;
  pendingSubmission.value = true;
  emit('save', {
    expectedRevision: state.gateway.revision,
    services: state.gateway.services.filter((s) => s.id !== serviceId).map(editable),
  });
}
function retry() {
  if (blocked.value || !state.tunnelRemoteAccessEnabled) return;
  emit('save', {
    expectedRevision: state.gateway.revision,
    services: state.gateway.services.map(editable),
  });
}
function status(service: (typeof state.gateway.services)[number]) {
  if (!service.enabled) return t('connectServices.disabled');
  if (!state.tunnelRemoteAccessEnabled) return t('connectServices.paused');
  if (state.gateway.pending || !service.url) return t('connectServices.pending');
  if (!ready.value) return t('connectServices.unavailable');
  if (service.auth === 'oidc') return t('connectServices.providerProtected');
  return t(
    service.auth === 'upstream' ? 'connectServices.applicationAuth' : 'connectServices.protected'
  );
}
</script>

<template>
  <section
    class="border-border @container space-y-5 border-t pt-6"
    :aria-labelledby="`${id}-heading`"
    :aria-busy="saving"
  >
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-2">
        <h2 :id="`${id}-heading`" class="text-lg font-semibold">{{ t('connectServices.title') }}</h2>
        <p class="text-muted-foreground max-w-prose">{{ t('connectServices.description') }}</p>
      </div>
      <Button
        v-if="!draft"
        variant="outline"
        :disabled="!canChange || state.gateway.services.length >= 31"
        @click="edit()"
        >{{ t('connectServices.add') }}</Button
      >
    </div>
    <p v-if="!state.gateway.available" role="status" class="text-sm">
      {{ t('connectServices.setupRequired') }}
    </p>
    <div v-if="state.gateway.pending" role="status" class="space-y-2 text-sm">
      <p>
        {{
          t(
            state.tunnelRemoteAccessEnabled
              ? 'connectServices.pendingHelp'
              : 'connectServices.pausedHelp'
          )
        }}
      </p>
      <Button
        v-if="state.tunnelRemoteAccessEnabled"
        variant="outline"
        :disabled="blocked"
        @click="retry"
        >{{ t('connectServices.retry') }}</Button
      >
    </div>
    <p v-if="error" role="alert" class="text-destructive">{{ error }}</p>
    <p v-else-if="saved" role="status" class="text-sm">{{ t('connectServices.saved') }}</p>
    <p
      v-if="!state.gateway.services.length && !draft"
      class="border-border text-muted-foreground rounded-lg border border-dashed p-5 text-sm"
    >
      {{ t('connectServices.empty') }}
    </p>
    <ul v-if="state.gateway.services.length" class="grid gap-3">
      <li
        v-for="service in state.gateway.services"
        :key="service.id"
        class="border-border space-y-3 rounded-lg border p-4"
      >
        <div class="flex flex-col gap-3 @md:flex-row @md:items-start @md:justify-between">
          <div class="min-w-0 space-y-1">
            <h3 class="font-medium">{{ service.name }}</h3>
            <p class="text-muted-foreground text-sm break-all">{{ service.upstream }}</p>
            <p class="text-sm" role="status">{{ status(service) }}</p>
            <a
              v-if="service.url && service.enabled && !state.gateway.pending && ready"
              class="text-primary inline-block text-sm break-all underline"
              :href="service.url"
              target="_blank"
              rel="noopener noreferrer"
              >{{ t('connectServices.open', { name: service.name }) }}</a
            >
          </div>
          <div class="flex shrink-0 flex-wrap gap-3">
            <Button
              variant="outline"
              :disabled="!canChange || Boolean(draft)"
              :aria-label="t('connectServices.editNamed', { name: service.name })"
              @click="edit(service)"
              >{{ t('connectServices.edit') }}</Button
            >
            <Button
              variant="outline"
              :disabled="!canChange || Boolean(draft)"
              :aria-label="t('connectServices.removeNamed', { name: service.name })"
              @click="removing = service.id"
              >{{ t('connectServices.remove') }}</Button
            >
          </div>
        </div>
        <div v-if="removing === service.id" class="space-y-3">
          <p>{{ t('connectServices.removeHelp', { name: service.name }) }}</p>
          <div class="flex flex-wrap gap-3">
            <Button :disabled="!canChange" @click="remove(service.id)">{{
              t('connectServices.confirmRemove')
            }}</Button>
            <Button variant="outline" :disabled="saving" @click="removing = null">{{
              t('connectServices.cancel')
            }}</Button>
          </div>
        </div>
      </li>
    </ul>
    <form v-if="draft" ref="form" class="border-border space-y-4 border-t pt-6" @submit.prevent="submit">
      <div class="space-y-1">
        <h3 class="text-lg font-semibold">
          {{
            t(
              state.gateway.services.some((s) => s.id === draft?.id)
                ? 'connectServices.edit'
                : 'connectServices.add'
            )
          }}
        </h3>
        <p class="text-muted-foreground text-sm">{{ t('connectServices.formDescription') }}</p>
      </div>
      <p
        v-if="stale"
        role="alert"
        class="border-destructive/40 bg-destructive/5 rounded-md border p-3 text-sm"
      >
        {{ t('connectServices.stale') }}
      </p>

      <section class="border-border bg-muted/20 space-y-4 rounded-lg border p-4 @md:p-5">
        <div class="space-y-1">
          <p class="text-primary text-xs font-semibold tracking-wide uppercase">
            {{ t('connectServices.steps.application') }}
          </p>
          <h4 class="font-semibold">{{ t('connectServices.steps.applicationTitle') }}</h4>
        </div>
        <div class="grid gap-4 @lg:grid-cols-2">
          <div class="space-y-2">
            <label :for="`${id}-name`" class="font-medium">{{ t('connectServices.name') }}</label>
            <Input
              :id="`${id}-name`"
              v-model="draft.name"
              required
              maxlength="80"
              :disabled="saving"
              autocomplete="off"
              :placeholder="t('connectServices.namePlaceholder')"
            />
          </div>
          <div class="space-y-2">
            <label :for="`${id}-upstream`" class="font-medium">{{
              t('connectServices.upstream')
            }}</label>
            <Input
              :id="`${id}-upstream`"
              v-model="draft.upstream"
              type="url"
              required
              maxlength="300"
              :disabled="saving"
              autocomplete="off"
              placeholder="http://127.0.0.1:32400"
              :aria-describedby="`${id}-upstream-help`"
            />
            <p :id="`${id}-upstream-help`" class="text-muted-foreground text-sm">
              {{ t('connectServices.upstreamHelp') }}
            </p>
          </div>
        </div>
      </section>

      <section class="border-border space-y-4 rounded-lg border p-4 @md:p-5">
        <div class="space-y-1">
          <p class="text-primary text-xs font-semibold tracking-wide uppercase">
            {{ t('connectServices.steps.access') }}
          </p>
          <h4 class="font-semibold">{{ t('connectServices.steps.accessTitle') }}</h4>
        </div>
        <div class="max-w-xl space-y-2">
          <label :id="`${id}-auth-label`" class="font-medium">{{
            t('connectServices.authentication')
          }}</label>
          <SelectRoot :model-value="selectedAuth" :disabled="saving" @update:model-value="selectAuth">
            <SelectTrigger :aria-labelledby="`${id}-auth-label`" :aria-describedby="`${id}-auth-help`">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in authOptions" :key="option.value" :value="option.value">{{
                option.label
              }}</SelectItem>
            </SelectContent>
          </SelectRoot>
          <p :id="`${id}-auth-help`" class="text-muted-foreground text-sm">
            {{
              t(
                draft.auth === 'upstream'
                  ? 'connectServices.applicationWarning'
                  : draft.auth === 'oidc'
                    ? 'connectServices.providerHelp'
                    : 'connectServices.auth'
              )
            }}
          </p>
        </div>
        <details v-if="draft.auth === 'oidc'" class="text-sm">
          <summary
            class="focus-visible:outline-ring cursor-pointer rounded-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            {{ t('connectServices.providerSetup') }}
          </summary>
          <div class="mt-3 space-y-2">
            <p v-if="missingProvider" role="alert">{{ t('connectServices.providerMissing') }}</p>
            <p>{{ t('connectServices.callbackHelp') }}</p>
            <code
              v-if="state.gateway.callbackUrl"
              class="bg-muted block rounded p-2 break-all select-all"
              >{{ state.gateway.callbackUrl }}</code
            >
            <p v-else role="status">{{ t('connectServices.callbackPending') }}</p>
          </div>
        </details>
        <div
          v-if="draft.auth === 'upstream'"
          class="border-warning/50 bg-warning/5 space-y-3 rounded-md border p-4"
        >
          <h5 class="font-semibold">{{ t('connectServices.safetyTitle') }}</h5>
          <p class="max-w-prose text-sm">{{ t('connectServices.networkWarning') }}</p>
          <div class="flex items-start gap-3">
            <input
              :id="`${id}-auth-ack`"
              v-model="applicationAuthAcknowledged"
              type="checkbox"
              :disabled="saving"
            />
            <label :for="`${id}-auth-ack`" class="max-w-prose text-sm">{{
              t('connectServices.authAcknowledgment')
            }}</label>
          </div>
        </div>
      </section>

      <details class="border-border rounded-lg border p-4">
        <summary
          class="focus-visible:outline-ring cursor-pointer rounded-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {{ t('connectServices.advanced') }}
        </summary>
        <div v-if="draft.auth === 'oidc'" class="mt-3 space-y-2">
          <label :for="`${id}-subjects`">{{ t('connectServices.subjects') }}</label>
          <textarea
            :id="`${id}-subjects`"
            v-model="subjectText"
            rows="3"
            :disabled="saving"
            class="border-input bg-background focus-visible:outline-ring w-full rounded-md border p-2 focus-visible:outline-2"
            :aria-describedby="`${id}-subjects-help`"
          />
          <p :id="`${id}-subjects-help`" class="text-muted-foreground text-sm">
            {{ t('connectServices.subjectsHelp') }}
          </p>
        </div>
        <div class="mt-3 space-y-2">
          <label :for="`${id}-tls`">{{ t('connectServices.tlsName') }}</label>
          <Input
            :id="`${id}-tls`"
            v-model="draft.tlsServerName"
            maxlength="253"
            :disabled="saving"
            autocomplete="off"
            :aria-describedby="`${id}-tls-help`"
          />
          <p :id="`${id}-tls-help`" class="text-muted-foreground text-sm">
            {{ t('connectServices.tlsHelp') }}
          </p>
        </div>
      </details>
      <section class="border-border space-y-4 rounded-lg border p-4 @md:p-5">
        <div class="space-y-1">
          <p class="text-primary text-xs font-semibold tracking-wide uppercase">
            {{ t('connectServices.steps.publish') }}
          </p>
          <h4 class="font-semibold">{{ t('connectServices.steps.publishTitle') }}</h4>
        </div>
        <div class="flex items-start justify-between gap-6">
          <div class="space-y-1">
            <p :id="`${id}-enabled`" class="font-medium">{{ t('connectServices.enable') }}</p>
            <p :id="`${id}-auth`" class="text-muted-foreground max-w-prose text-sm">
              {{
                t(
                  draft.auth === 'upstream'
                    ? 'connectServices.applicationAuth'
                    : draft.auth === 'oidc'
                      ? 'connectServices.providerProtected'
                      : 'connectServices.protected'
                )
              }}
            </p>
          </div>
          <Switch
            v-model="draft.enabled"
            :disabled="saving"
            :aria-labelledby="`${id}-enabled`"
            :aria-describedby="`${id}-auth`"
          />
        </div>
        <details class="text-sm">
          <summary
            class="focus-visible:outline-ring cursor-pointer rounded-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            {{ t('connectServices.publishDetails') }}
          </summary>
          <div class="text-muted-foreground mt-3 max-w-prose space-y-2">
            <p>
              {{
                t(
                  draft.auth === 'upstream'
                    ? 'connectServices.nativeClients'
                    : 'connectServices.browserOnly'
                )
              }}
            </p>
            <p v-if="draft.enabled">{{ t('connectServices.enableNotice') }}</p>
          </div>
        </details>
      </section>
      <div class="flex flex-wrap gap-3">
        <Button
          :disabled="!canChange || stale || needsAcknowledgment || missingProvider"
          @click="submit"
          >{{ t(saving ? 'connectServices.saving' : 'connectServices.save') }}</Button
        >
        <Button variant="outline" :disabled="saving" @click="draft = null">{{
          t('connectServices.cancel')
        }}</Button>
      </div>
    </form>
  </section>
</template>
