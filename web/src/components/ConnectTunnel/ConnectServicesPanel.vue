<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  ArrowPathIcon,
  GlobeAltIcon,
  PencilSquareIcon,
  PlusIcon,
  Squares2X2Icon,
  TrashIcon,
} from '@heroicons/vue/24/outline';
import {
  Button,
  Input,
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@unraid/ui';

import type {
  ConnectGatewayServiceInput,
  ConnectGatewaySettingsInput,
  ConnectServiceTargetsQuery,
  ConnectTunnelPageQuery,
} from '~/composables/gql/graphql';

type ServiceTarget = ConnectServiceTargetsQuery['docker']['containers'][number];
type TargetMode = 'container' | 'manual';
type TargetProtocol = 'http' | 'https';
type ServiceKind = 'web' | 'minecraft-java';

const {
  state,
  providers = [],
  serviceTargets = [],
  serviceTargetsLoading = false,
  serviceTargetsError = false,
  saving = false,
  applying = false,
  unavailable = false,
  error = '',
  saved = false,
} = defineProps<{
  state: ConnectTunnelPageQuery['connectTunnelSettings'];
  providers?: { id: string; name: string }[];
  serviceTargets?: ServiceTarget[];
  serviceTargetsLoading?: boolean;
  serviceTargetsError?: boolean;
  saving?: boolean;
  applying?: boolean;
  unavailable?: boolean;
  error?: string;
  saved?: boolean;
}>();
const emit = defineEmits<{
  save: [input: ConnectGatewaySettingsInput];
  refreshTargets: [];
}>();
const { t } = useI18n();
const id = useId();
const form = ref<HTMLFormElement>();
const draft = ref<ConnectGatewayServiceInput | null>(null);
const editingRevision = ref(0);
const removing = ref<string | null>(null);
const pendingSubmission = ref(false);
const applicationAuthAcknowledged = ref(false);
const targetMode = ref<TargetMode>('manual');
const selectedContainerId = ref('');
const selectedPort = ref('');
const selectedProtocol = ref<TargetProtocol>('http');
const serviceKind = ref<ServiceKind>('web');
watch(
  () => [draft.value?.auth, draft.value?.upstream, draft.value?.tlsServerName],
  () => {
    applicationAuthAcknowledged.value = false;
  }
);
const isUnraidAccountProvider = (providerId: string) =>
  providerId === 'unraid.net' || providerId.endsWith(':unraid.net');
const configuredProviders = computed(() =>
  providers.filter((provider) => !isUnraidAccountProvider(provider.id))
);
const targetName = (target: ServiceTarget) =>
  target.names.find(Boolean)?.replace(/^\//, '') || target.id;
const targetPorts = (target: ServiceTarget) =>
  target.ports
    .filter(
      (port) =>
        port.type === 'TCP' &&
        typeof port.publicPort === 'number' &&
        port.publicPort > 0 &&
        port.publicPort <= 65535
    )
    .filter(
      (port, index, ports) =>
        ports.findIndex((candidate) => candidate.publicPort === port.publicPort) === index
    )
    .sort((a, b) => (a.publicPort ?? 0) - (b.publicPort ?? 0));
const discoveredTargets = computed(() =>
  [...serviceTargets]
    .filter((target) => target.state === 'RUNNING' && targetPorts(target).length)
    .sort((a, b) => targetName(a).localeCompare(targetName(b)))
);
const selectedTarget = computed(() =>
  discoveredTargets.value.find((target) => target.id === selectedContainerId.value)
);
const portOptions = computed(() => (selectedTarget.value ? targetPorts(selectedTarget.value) : []));
const selectedPortDetails = computed(() =>
  portOptions.value.find((port) => String(port.publicPort) === selectedPort.value)
);
const discoveredTargetReady = computed(
  () =>
    targetMode.value === 'manual' ||
    Boolean(selectedTarget.value && selectedPortDetails.value && draft.value?.upstream)
);
const formatPort = (port: ServiceTarget['ports'][number]) =>
  port.privatePort && port.privatePort !== port.publicPort
    ? t('connectServices.discovery.portMapping', {
        publicPort: port.publicPort,
        privatePort: port.privatePort,
      })
    : t('connectServices.discovery.port', { port: port.publicPort });
function suggestedProtocol(target: ServiceTarget, publicPort: number): TargetProtocol {
  if (!target.webUiUrl) return 'http';
  try {
    const url = new URL(target.webUiUrl);
    const port = Number(url.port || (url.protocol === 'https:' ? 443 : 80));
    return url.protocol === 'https:' && port === publicPort ? 'https' : 'http';
  } catch {
    return 'http';
  }
}
function updateDiscoveredUpstream() {
  if (!draft.value || !selectedPortDetails.value || targetMode.value !== 'container') return;
  const binding = selectedPortDetails.value.ip?.trim();
  const host = !binding || binding === '0.0.0.0' || binding === '::' ? '127.0.0.1' : binding;
  const formattedHost = host.includes(':') ? `[${host}]` : host;
  const protocol = serviceKind.value === 'minecraft-java' ? 'tcp' : selectedProtocol.value;
  draft.value.upstream = `${protocol}://${formattedHost}:${selectedPort.value}`;
}
function selectContainer(value: unknown) {
  if (typeof value !== 'string' || !draft.value) return;
  const target = discoveredTargets.value.find((candidate) => candidate.id === value);
  if (!target) return;
  const previousName = selectedTarget.value ? targetName(selectedTarget.value) : '';
  selectedContainerId.value = value;
  if (!draft.value.name || draft.value.name === previousName) draft.value.name = targetName(target);
  const firstPort = targetPorts(target)[0];
  selectedPort.value = firstPort?.publicPort ? String(firstPort.publicPort) : '';
  selectedProtocol.value = firstPort?.publicPort
    ? suggestedProtocol(target, firstPort.publicPort)
    : 'http';
  updateDiscoveredUpstream();
}
function selectPort(value: unknown) {
  if (typeof value !== 'string') return;
  selectedPort.value = value;
  if (selectedTarget.value) {
    selectedProtocol.value = suggestedProtocol(selectedTarget.value, Number(value));
  }
  updateDiscoveredUpstream();
}
function selectProtocol(value: unknown) {
  if (value !== 'http' && value !== 'https') return;
  selectedProtocol.value = value;
  updateDiscoveredUpstream();
}
function selectServiceKind(value: unknown) {
  if (!draft.value || (value !== 'web' && value !== 'minecraft-java')) return;
  serviceKind.value = value;
  draft.value.protocol = value === 'minecraft-java' ? 'minecraft-java' : 'https';
  if (value === 'minecraft-java') {
    draft.value.auth = 'upstream';
    draft.value.providerId = '';
    draft.value.subjects = [];
    draft.value.tlsServerName = '';
  }
  applicationAuthAcknowledged.value = false;
  updateDiscoveredUpstream();
}
function selectTargetMode(value: unknown) {
  if (value !== 'container' && value !== 'manual') return;
  targetMode.value = value;
  if (value === 'container') {
    const target =
      discoveredTargets.value.find((candidate) => candidate.id === selectedContainerId.value) ??
      discoveredTargets.value[0];
    if (target) selectContainer(target.id);
  }
}
const authOptions = computed(() => [
  { value: 'account', label: t('connectServices.accountAuth') },
  ...configuredProviders.value.map((provider) => ({
    value: `oidc:${provider.id}`,
    label: provider.name,
  })),
  { value: 'upstream', label: t('connectServices.applicationAuth') },
]);
const needsAcknowledgment = computed(
  () =>
    (serviceKind.value === 'minecraft-java' || draft.value?.auth === 'upstream') &&
    !applicationAuthAcknowledged.value
);
const selectedAuth = computed(() =>
  draft.value?.auth === 'oidc'
    ? isUnraidAccountProvider(draft.value.providerId ?? '')
      ? 'account'
      : `oidc:${draft.value.providerId}`
    : draft.value?.auth
);
const missingProvider = computed(
  () =>
    draft.value?.auth === 'oidc' &&
    !isUnraidAccountProvider(draft.value.providerId ?? '') &&
    !configuredProviders.value.some((provider) => provider.id === draft.value?.providerId)
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
const editable = (s: ConnectGatewayServiceInput): ConnectGatewayServiceInput => ({
  id: s.id,
  name: s.name,
  upstream: s.upstream,
  protocol: s.protocol ?? 'https',
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
    ['idle', 'connected', 'tunnel_idle'].includes(state.status.tunnel)
);
const blocked = computed(() => saving || applying || unavailable || !state.signedIn);
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
        protocol: 'https',
        tlsServerName: '',
        enabled: true,
        auth: 'account',
        providerId: '',
        subjects: [],
      };
  targetMode.value = service
    ? 'manual'
    : discoveredTargets.value.length || serviceTargetsLoading || serviceTargetsError
      ? 'container'
      : 'manual';
  selectedContainerId.value = '';
  selectedPort.value = '';
  serviceKind.value = service?.protocol === 'minecraft-java' ? 'minecraft-java' : 'web';
  selectedProtocol.value = service?.upstream.startsWith('https:') ? 'https' : 'http';
  if (!service && discoveredTargets.value[0]) selectContainer(discoveredTargets.value[0].id);
  removing.value = null;
  applicationAuthAcknowledged.value = false;
}
watch(discoveredTargets, (targets) => {
  if (!draft.value || targetMode.value !== 'container' || selectedTarget.value || !targets[0]) return;
  selectContainer(targets[0].id);
});
watch(portOptions, (ports) => {
  if (
    !draft.value ||
    targetMode.value !== 'container' ||
    selectedPortDetails.value ||
    !ports[0]?.publicPort
  )
    return;
  selectPort(String(ports[0].publicPort));
});
function submit() {
  if (
    !draft.value ||
    !canChange.value ||
    stale.value ||
    needsAcknowledgment.value ||
    missingProvider.value ||
    !discoveredTargetReady.value ||
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
  if (applying) return t('connectServices.applying');
  if (state.gateway.pending || !service.url) return t('connectServices.pending');
  if (!ready.value) return t('connectServices.unavailable');
  if (service.protocol === 'minecraft-java') return t('connectServices.minecraftReady');
  if (service.auth === 'oidc') return t('connectServices.providerProtected');
  return t(
    service.auth === 'upstream' ? 'connectServices.applicationAuth' : 'connectServices.protected'
  );
}
</script>

<template>
  <section
    class="border-border @container space-y-5 border-t pt-7"
    :aria-labelledby="`${id}-heading`"
    :aria-busy="saving || applying"
  >
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-start gap-4">
        <div class="bg-primary/10 text-primary rounded-lg p-2.5" aria-hidden="true">
          <Squares2X2Icon class="h-6 w-6" />
        </div>
        <div class="space-y-1.5">
          <h2 :id="`${id}-heading`" class="text-lg font-semibold">{{ t('connectServices.title') }}</h2>
          <p class="text-muted-foreground max-w-prose">{{ t('connectServices.description') }}</p>
        </div>
      </div>
      <Button
        v-if="!draft"
        variant="outline"
        :disabled="!canChange || state.gateway.services.length >= 31"
        @click="edit()"
      >
        <PlusIcon class="mr-1.5 h-4 w-4" aria-hidden="true" />
        {{ t('connectServices.add') }}
      </Button>
    </div>
    <p v-if="!state.gateway.available" role="status" class="text-sm">
      {{ t('connectServices.setupRequired') }}
    </p>
    <div
      v-if="applying"
      role="status"
      class="border-primary/30 bg-primary/5 flex items-start gap-3 rounded-lg border p-4 text-sm"
    >
      <ArrowPathIcon class="text-primary mt-0.5 h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
      <div class="space-y-1">
        <p class="font-medium">{{ t('connectServices.applying') }}</p>
        <p class="text-muted-foreground">{{ t('connectServices.applyingHelp') }}</p>
      </div>
    </div>
    <div v-else-if="state.gateway.pending" role="status" class="space-y-2 text-sm">
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
    <p v-else-if="saved && !applying" role="status" class="text-sm">
      {{ t('connectServices.saved') }}
    </p>
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
        class="border-border bg-muted/10 space-y-3 rounded-xl border p-4"
      >
        <div class="flex flex-col gap-3 @md:flex-row @md:items-start @md:justify-between">
          <div class="flex min-w-0 items-start gap-3">
            <GlobeAltIcon class="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div class="min-w-0 space-y-1">
              <h3 class="font-medium">{{ service.name }}</h3>
              <p class="text-muted-foreground text-sm break-all">{{ service.upstream }}</p>
              <p class="text-sm" role="status">{{ status(service) }}</p>
              <a
                v-if="
                  service.url?.startsWith('https://') &&
                  service.enabled &&
                  !applying &&
                  !state.gateway.pending &&
                  ready
                "
                class="text-primary inline-block text-sm break-all underline"
                :href="service.url"
                target="_blank"
                rel="noopener noreferrer"
                >{{ t('connectServices.open', { name: service.name }) }}</a
              >
              <code
                v-else-if="service.protocol === 'minecraft-java' && service.url"
                class="bg-muted inline-block rounded px-1.5 py-0.5 text-sm break-all select-all"
                >{{ service.url }}</code
              >
            </div>
          </div>
          <div class="flex shrink-0 flex-wrap gap-3">
            <Button
              variant="outline"
              :disabled="!canChange || Boolean(draft)"
              :aria-label="t('connectServices.editNamed', { name: service.name })"
              @click="edit(service)"
            >
              <PencilSquareIcon class="mr-1.5 h-4 w-4" aria-hidden="true" />
              {{ t('connectServices.edit') }}
            </Button>
            <Button
              variant="outline"
              :disabled="!canChange || Boolean(draft)"
              :aria-label="t('connectServices.removeNamed', { name: service.name })"
              @click="removing = service.id"
            >
              <TrashIcon class="mr-1.5 h-4 w-4" aria-hidden="true" />
              {{ t('connectServices.remove') }}
            </Button>
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
        <div class="max-w-xl space-y-2">
          <label :id="`${id}-service-kind-label`" class="font-medium">{{
            t('connectServices.serviceType')
          }}</label>
          <SelectRoot
            :model-value="serviceKind"
            :disabled="saving"
            @update:model-value="selectServiceKind"
          >
            <SelectTrigger :aria-labelledby="`${id}-service-kind-label`">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="web">{{ t('connectServices.webApplication') }}</SelectItem>
              <SelectItem value="minecraft-java">{{ t('connectServices.minecraftJava') }}</SelectItem>
            </SelectContent>
          </SelectRoot>
        </div>
        <div class="max-w-xl space-y-2">
          <label :id="`${id}-target-mode-label`" class="font-medium">{{
            t('connectServices.discovery.source')
          }}</label>
          <SelectRoot
            :model-value="targetMode"
            :disabled="saving"
            @update:model-value="selectTargetMode"
          >
            <SelectTrigger :aria-labelledby="`${id}-target-mode-label`">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="container">{{
                t('connectServices.discovery.containerSource')
              }}</SelectItem>
              <SelectItem value="manual">{{ t('connectServices.discovery.manualSource') }}</SelectItem>
            </SelectContent>
          </SelectRoot>
        </div>

        <div v-if="targetMode === 'container'" class="space-y-4">
          <p v-if="serviceTargetsLoading && !discoveredTargets.length" role="status" class="text-sm">
            {{ t('connectServices.discovery.loading') }}
          </p>
          <div
            v-else-if="serviceTargetsError || !discoveredTargets.length"
            class="border-border space-y-3 rounded-md border p-4"
          >
            <p role="status" class="text-sm">
              {{
                t(
                  serviceTargetsError
                    ? 'connectServices.discovery.failed'
                    : 'connectServices.discovery.empty'
                )
              }}
            </p>
            <div class="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                :disabled="serviceTargetsLoading"
                @click="emit('refreshTargets')"
              >
                {{ t('connectServices.discovery.refresh') }}
              </Button>
              <Button type="button" variant="outline" @click="selectTargetMode('manual')">
                {{ t('connectServices.discovery.enterManually') }}
              </Button>
            </div>
          </div>
          <template v-else>
            <div class="grid gap-4 @lg:grid-cols-2">
              <div class="space-y-2">
                <label :id="`${id}-container-label`" class="font-medium">{{
                  t('connectServices.discovery.container')
                }}</label>
                <SelectRoot
                  :model-value="selectedContainerId"
                  :disabled="saving"
                  @update:model-value="selectContainer"
                >
                  <SelectTrigger :aria-labelledby="`${id}-container-label`">
                    <SelectValue :placeholder="t('connectServices.discovery.chooseContainer')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="target in discoveredTargets" :key="target.id" :value="target.id">
                      {{ targetName(target) }}
                    </SelectItem>
                  </SelectContent>
                </SelectRoot>
              </div>
              <div class="space-y-2">
                <label :id="`${id}-port-label`" class="font-medium">{{
                  t('connectServices.discovery.portLabel')
                }}</label>
                <SelectRoot
                  :model-value="selectedPort"
                  :disabled="saving || !selectedContainerId"
                  @update:model-value="selectPort"
                >
                  <SelectTrigger :aria-labelledby="`${id}-port-label`">
                    <SelectValue :placeholder="t('connectServices.discovery.choosePort')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="port in portOptions"
                      :key="String(port.publicPort)"
                      :value="String(port.publicPort)"
                    >
                      {{ formatPort(port) }}
                    </SelectItem>
                  </SelectContent>
                </SelectRoot>
              </div>
            </div>
            <div v-if="serviceKind === 'web'" class="max-w-xs space-y-2">
              <label :id="`${id}-protocol-label`" class="font-medium">{{
                t('connectServices.discovery.protocol')
              }}</label>
              <SelectRoot
                :model-value="selectedProtocol"
                :disabled="saving || !selectedPortDetails"
                @update:model-value="selectProtocol"
              >
                <SelectTrigger :aria-labelledby="`${id}-protocol-label`">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="http">HTTP</SelectItem>
                  <SelectItem value="https">HTTPS</SelectItem>
                </SelectContent>
              </SelectRoot>
            </div>
            <p v-if="draft.upstream" class="text-muted-foreground text-sm">
              {{ t('connectServices.discovery.address') }}
              <code class="bg-muted rounded px-1.5 py-0.5">{{ draft.upstream }}</code>
            </p>
          </template>
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
          <div v-if="targetMode === 'manual'" class="space-y-2">
            <label :for="`${id}-upstream`" class="font-medium">{{
              t('connectServices.upstream')
            }}</label>
            <Input
              :id="`${id}-upstream`"
              v-model="draft.upstream"
              :type="serviceKind === 'minecraft-java' ? 'text' : 'url'"
              required
              maxlength="300"
              :disabled="saving"
              autocomplete="off"
              :placeholder="
                serviceKind === 'minecraft-java' ? 'tcp://127.0.0.1:25565' : 'http://127.0.0.1:32400'
              "
              :aria-describedby="`${id}-upstream-help`"
            />
            <p :id="`${id}-upstream-help`" class="text-muted-foreground text-sm">
              {{ t('connectServices.upstreamHelp') }}
            </p>
          </div>
        </div>
      </section>

      <section
        v-if="serviceKind === 'web'"
        class="border-border space-y-4 rounded-lg border p-4 @md:p-5"
      >
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

      <section v-else class="border-warning/50 bg-warning/5 space-y-3 rounded-lg border p-4 @md:p-5">
        <h4 class="font-semibold">{{ t('connectServices.minecraftAccessTitle') }}</h4>
        <p class="max-w-prose text-sm">{{ t('connectServices.minecraftWarning') }}</p>
        <div class="flex items-start gap-3">
          <input
            :id="`${id}-minecraft-ack`"
            v-model="applicationAuthAcknowledged"
            type="checkbox"
            :disabled="saving"
          />
          <label :for="`${id}-minecraft-ack`" class="max-w-prose text-sm">{{
            t('connectServices.minecraftAcknowledgment')
          }}</label>
        </div>
      </section>

      <details v-if="serviceKind === 'web'" class="border-border rounded-lg border p-4">
        <summary
          class="focus-visible:outline-ring cursor-pointer rounded-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {{ t('connectServices.advanced') }}
        </summary>
        <div class="mt-3 space-y-2">
          <label :for="`${id}-tls`">{{ t('connectServices.tlsName') }}</label>
          <Input
            :id="`${id}-tls`"
            v-model="draft.tlsServerName"
            maxlength="253"
            :disabled="saving"
            autocomplete="off"
            placeholder="plex.home.arpa"
            :aria-describedby="`${id}-tls-help`"
          />
          <p :id="`${id}-tls-help`" class="text-muted-foreground text-sm">
            {{ t('connectServices.tlsHelp') }}
          </p>
        </div>
      </details>
      <div class="flex flex-wrap gap-3">
        <Button
          :disabled="
            !canChange || stale || needsAcknowledgment || missingProvider || !discoveredTargetReady
          "
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
