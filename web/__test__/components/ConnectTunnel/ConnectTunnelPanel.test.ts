import { ref } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { flushPromises, mount } from '@vue/test-utils';

import { SelectRoot } from '@unraid/ui';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ConnectServiceTargetsQuery, ConnectTunnelPageQuery } from '~/composables/gql/graphql';

import Auth from '~/components/Auth.standalone.vue';
import BrandMark from '~/components/Brand/Mark.vue';
import ConnectSettings from '~/components/ConnectSettings/ConnectSettings.standalone.vue';
import ConnectServicesPanel from '~/components/ConnectTunnel/ConnectServicesPanel.vue';
import ConnectTunnelPage from '~/components/ConnectTunnel/ConnectTunnel.standalone.vue';
import ConnectTunnelPanel from '~/components/ConnectTunnel/ConnectTunnelPanel.vue';
import ManagedBackupPanel from '~/components/ConnectTunnel/ManagedBackupPanel.vue';
import { ContainerPortType, ContainerState } from '~/composables/gql/graphql';
import { createTestI18n } from '../../utils/i18n';

vi.mock('@vue/apollo-composable', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@vue/apollo-composable')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));
vi.mock('~/components/Auth.standalone.vue', () => ({
  default: {
    props: { allowSignOut: Boolean },
    template: '<button type="button">Sign in to Unraid</button>',
  },
}));
vi.mock('~/components/ConnectTunnel/managed-backup.api', () => ({
  getManagedBackupStatus: vi.fn().mockResolvedValue({
    schemaVersion: 1,
    signedIn: true,
    configured: false,
    setupPending: false,
    legacyMigrationPending: false,
    running: false,
    job: null,
    usage: { state: 'unavailable' },
  }),
  setupManagedBackup: vi.fn(),
  runManagedBackup: vi.fn(),
}));

type State = ConnectTunnelPageQuery['connectTunnelSettings'];
const state = (): State => ({
  gateway: { revision: 0, available: true, pending: false, services: [] },
  previewMode: false,
  signedIn: true,
  certificateManagementEnabled: true,
  tunnelRemoteAccessEnabled: false,
  serverDataReportingEnabled: false,
  tunnelUrl: null,
  status: {
    gateway: 'disabled',
    gatewayReason: '',
    routeState: 'unavailable',
    presence: 'disconnected',
    certificate: 'valid',
    tunnel: 'idle',
    reason: '',
    tunnelReason: '',
    entitlementState: 'unavailable',
    entitlement: null,
  },
  overviewCleanupPending: false,
  overview: { info: { os: { hostname: 'Test server' } } },
  certificateMigration: {
    status: 'idle',
    reason: '',
    requestId: null,
    domain: '*.example.myunraid.net',
    fingerprint: 'a'.repeat(64),
    managed: false,
    confirmationToken: 'confirmation-token',
  },
});
const wrappers: ReturnType<typeof mount>[] = [];
function render(value = state()) {
  const wrapper = mount(ConnectTunnelPanel, {
    props: { state: value },
    global: { plugins: [createTestI18n()] },
  });
  wrappers.push(wrapper);
  return wrapper;
}
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
});
const button = (wrapper: ReturnType<typeof render>, name: string) =>
  wrapper.findAll('[role="button"]').find((b) => b.text() === name)!;
const details = (wrapper: ReturnType<typeof render>, name: string) =>
  wrapper.findAll('details').find((d) => d.get('summary').text() === name)!;
const visibleText = (wrapper: ReturnType<typeof render>, text: string) => {
  const paragraph = wrapper.findAll('p').find((p) => p.text().includes(text))!;
  expect(paragraph.element.closest('details')).toBeNull();
};
const featureSwitch = (wrapper: ReturnType<typeof mount>, key: string) =>
  wrapper.get(`[role="switch"][aria-describedby*="-${key}-description"]`);

describe('dedicated Connect controls', () => {
  it('collapses secondary details and preserves expansion and confirmation through polling', async () => {
    const wrapper = render();
    expect(wrapper.findAll('details').every((d) => !d.element.open)).toBe(true);
    const certificate = details(wrapper, 'Certificate details and migration');
    expect(certificate.text()).toContain('*.example.myunraid.net');
    expect(certificate.text()).toContain('a'.repeat(64));
    // Native disclosure state is owned by the browser, not the polled server state.
    certificate.element.open = true;
    await button(wrapper, 'Migrate certificate now').trigger('click');
    await wrapper.setProps({
      state: { ...state(), status: { ...state().status, presence: 'connected' } },
    });
    expect(certificate.element.open).toBe(true);
    expect(certificate.text()).toContain('Confirm certificate migration');
    expect(wrapper.emitted('migrate')).toBeUndefined();
    expect(wrapper.emitted('save')).toBeUndefined();
  });

  it('explains encryption without hiding TLS failures or claiming cloud data is end-to-end encrypted', () => {
    const value = state();
    value.tunnelRemoteAccessEnabled = true;
    value.tunnelUrl = 'https://example.myunraid.net';
    value.status.tunnel = 'tunnel_retrying';
    value.status.tunnelReason = 'target_tls_unavailable';
    const wrapper = render(value);
    visibleText(wrapper, 'end-to-end encrypted between your browser and this server');
    visibleText(wrapper, 'local HTTPS listener is not serving its certificate');
    visibleText(wrapper, 'Usage is unavailable');
    const security = details(wrapper, 'Security and connection details');
    expect(security.element.open).toBe(false);
    expect(security.text()).toContain('cannot read the contents');
    expect(security.text()).toContain('hostname, connection metadata, and traffic usage');
    expect(security.text()).toContain('Server overview data shared with Connect is separate');
    expect(security.text()).toContain('Encryption does not replace access controls');
    expect(security.text()).toContain(value.tunnelUrl);
    expect(wrapper.get('a').text()).toBe('Open remote access');
    expect(wrapper.get('a').attributes('href')).toBe(value.tunnelUrl);
  });

  it('shows authoritative usage and a quota block while cloud remains connected', async () => {
    const value = state();
    value.tunnelRemoteAccessEnabled = true;
    value.status.presence = 'connected';
    value.status.entitlementState = 'current';
    value.status.entitlement = {
      accessState: 'blocked',
      reason: 'quota_exhausted',
      status: 'unknown',
      rateMode: 'limited',
      rateBytesPerSecond: 500000,
      bytesUsed: 9745244848,
      quotaBytes: 1000000000,
      bytesRemaining: 0,
      periodStart: 1785542400,
      periodEnd: 1788220800,
      updatedAt: 1787523507131,
    };
    const wrapper = render(value);
    expect(wrapper.text()).toContain('9.75 GB used of 1 GB');
    expect(wrapper.text()).toContain('0 GB remaining');
    expect(wrapper.text()).toContain('allowance is exhausted');
    expect(wrapper.text()).toContain('default allowance');
    expect(wrapper.text()).toContain('Maximum tunnel speed');
    expect(wrapper.text()).toContain('Up to 4 Mbps');
    expect(wrapper.text()).not.toContain('Usage is unavailable');
    visibleText(wrapper, '9.75 GB used of 1 GB');
    visibleText(wrapper, 'allowance is exhausted');
    visibleText(wrapper, 'default allowance');
    const allowance = details(wrapper, 'Usage details');
    expect(allowance.element.open).toBe(false);
    expect(allowance.text()).toContain('0 GB remaining');
    expect(allowance.text()).toContain('Allowance period:');
    allowance.element.open = true;
    await wrapper.setProps({
      state: {
        ...value,
        status: {
          ...value.status,
          tunnel: 'tunnel_retrying',
          tunnelReason: 'target_tls_unavailable',
          entitlementState: 'unavailable',
        },
      },
    });
    expect(wrapper.text()).toContain('last reported values');
    expect(wrapper.text()).toContain('9.75 GB used of 1 GB');
    expect(wrapper.text()).toContain('Connection status Retrying');
    expect(wrapper.text()).not.toContain('allowance is exhausted');
    visibleText(wrapper, 'local HTTPS listener is not serving its certificate');
    visibleText(wrapper, 'last reported values');
    expect(allowance.element.open).toBe(true);
  });

  it('requires confirmation and discards it when the certificate or settings change', async () => {
    const wrapper = render();
    await button(wrapper, 'Migrate certificate now').trigger('click');
    expect(wrapper.emitted('migrate')).toBeUndefined();
    expect(wrapper.text()).toContain('*.example.myunraid.net');
    expect(wrapper.text()).toContain('a'.repeat(64));
    await wrapper.setProps({
      state: {
        ...state(),
        certificateMigration: { ...state().certificateMigration, confirmationToken: 'changed' },
      },
    });
    expect(wrapper.text()).not.toContain('Confirm certificate migration');
    await button(wrapper, 'Migrate certificate now').trigger('click');
    await button(wrapper, 'Cancel migration').trigger('click');
    expect(wrapper.emitted('migrate')).toBeUndefined();
    await button(wrapper, 'Migrate certificate now').trigger('click');
    await button(wrapper, 'Confirm certificate migration').trigger('click');
    expect(wrapper.emitted('migrate')).toEqual([['changed']]);
  });
  it('blocks migration with unsaved settings and shows native partial-install status', async () => {
    const wrapper = render();
    await featureSwitch(wrapper, 'serverDataReportingEnabled').trigger('click');
    expect(button(wrapper, 'Migrate certificate now').attributes('aria-disabled')).toBe('true');
    await wrapper.setProps({
      state: {
        ...state(),
        certificateMigration: {
          ...state().certificateMigration,
          status: 'installed_unconfirmed',
          reason: 'marker_failed',
          confirmationToken: null,
        },
      },
    });
    expect(wrapper.text()).toContain('migration or HTTPS activation could not be confirmed');
    visibleText(wrapper, 'migration or HTTPS activation could not be confirmed');
    expect(wrapper.text()).not.toContain('Migrate certificate now');
  });
  it('shows readable statuses without rendering the unified API schema', () => {
    const wrapper = render();
    expect(wrapper.findAll('[role="switch"]')).toHaveLength(3);
    expect(wrapper.text()).toContain('Certificate valid');
    expect(wrapper.text()).not.toContain('OIDC');
    expect(button(wrapper, 'Apply changes').attributes('aria-disabled')).toBe('true');
  });
  it('saves only the three explicit feature flags and keeps drafts through status polling', async () => {
    const wrapper = render();
    await featureSwitch(wrapper, 'serverDataReportingEnabled').trigger('click');
    expect(wrapper.emitted('save')).toBeUndefined();
    await wrapper.setProps({
      state: { ...state(), status: { ...state().status, certificate: 'checking' } },
    });
    expect(featureSwitch(wrapper, 'serverDataReportingEnabled').attributes('aria-checked')).toBe('true');
    await button(wrapper, 'Apply changes').trigger('click');
    expect(wrapper.emitted('save')).toEqual([
      [
        {
          certificateManagementEnabled: true,
          tunnelRemoteAccessEnabled: false,
          serverDataReportingEnabled: true,
        },
      ],
    ]);
    await wrapper.setProps({ state: { ...state(), serverDataReportingEnabled: true }, saved: true });
    expect(wrapper.text()).toContain('Connect settings saved.');
    expect(button(wrapper, 'Apply changes').attributes('aria-disabled')).toBe('true');
  });
  it('requires certificates for remote access and supports discarding pending changes', async () => {
    const wrapper = render({ ...state(), certificateManagementEnabled: false });
    expect(featureSwitch(wrapper, 'tunnelRemoteAccessEnabled').attributes('aria-disabled')).toBe('true');
    await featureSwitch(wrapper, 'certificateManagementEnabled').trigger('click');
    await featureSwitch(wrapper, 'tunnelRemoteAccessEnabled').trigger('click');
    expect(featureSwitch(wrapper, 'certificateManagementEnabled').attributes('aria-disabled')).toBe(
      'true'
    );
    await button(wrapper, 'Discard changes').trigger('click');
    expect(featureSwitch(wrapper, 'certificateManagementEnabled').attributes('aria-checked')).toBe(
      'false'
    );
    expect(wrapper.emitted('save')).toBeUndefined();
  });
  it('prevents saving while signed out, busy, or disconnected and exposes save failures', async () => {
    const wrapper = render();
    await featureSwitch(wrapper, 'serverDataReportingEnabled').trigger('click');
    await wrapper.setProps({ saving: true });
    expect(button(wrapper, 'Applying…').attributes('aria-disabled')).toBe('true');
    await wrapper.setProps({ saving: false, unavailable: true, error: 'Request refused (403)' });
    expect(wrapper.get('[role="alert"]').text()).toContain('Request refused (403)');
    expect(button(wrapper, 'Apply changes').attributes('aria-disabled')).toBe('true');
    await wrapper.setProps({ unavailable: false, state: { ...state(), signedIn: false } });
    expect(
      wrapper.findAll('[role="switch"]').every((s) => s.attributes('aria-disabled') === 'true')
    ).toBe(true);
  });
  it('keeps payload preview local and labels pending cleanup separately', async () => {
    const wrapper = render({ ...state(), overviewCleanupPending: true });
    await details(wrapper, 'Preview shared data').get('summary').trigger('click');
    expect(wrapper.get('pre').text()).toContain('Test server');
    expect(wrapper.text()).toContain('Opening it does not enable sharing.');
    expect(wrapper.text()).toContain('not yet been confirmed');
    expect(wrapper.emitted('save')).toBeUndefined();
  });
});

describe('Connect page save handler', () => {
  function renderPage(fail = false) {
    const stopPolling = vi.fn();
    const startPolling = vi.fn();
    const result = ref<{ connectTunnelSettings: State }>();
    result.value = { connectTunnelSettings: state() };
    const loading = ref(false);
    const error = ref<Error | null>(null);
    const refetch = vi.fn(async () => {
      if (!fail)
        result.value = { connectTunnelSettings: { ...state(), serverDataReportingEnabled: true } };
      return { data: result.value };
    });
    const mutate = fail
      ? vi.fn().mockRejectedValue(new Error('Save refused'))
      : vi.fn().mockResolvedValue({ data: { updateConnectTunnelSettings: state() } });
    vi.mocked(useQuery).mockReturnValue({
      result,
      loading,
      error,
      refetch,
      query: ref({ stopPolling, startPolling }),
    } as unknown as ReturnType<typeof useQuery>);
    vi.mocked(useMutation).mockReturnValue({ mutate } as unknown as ReturnType<typeof useMutation>);
    const wrapper = mount(ConnectTunnelPage, { global: { plugins: [createTestI18n()] } });
    wrappers.push(wrapper);
    return { wrapper, mutate, refetch, stopPolling, startPolling, result, loading, error };
  }

  it('keeps services inside remote access and flash backup on the same Connect page', () => {
    const { wrapper } = renderPage();
    expect(wrapper.findComponent(BrandMark).exists()).toBe(true);
    const headings = wrapper.findAll('h2').map((heading) => heading.text());
    expect(headings).toEqual([
      'Account Status:',
      'Certificate management',
      'Server overview',
      'Remote access',
      'Services',
      'Flash backup',
    ]);
    const remoteHeading = wrapper.findAll('h2').find((heading) => heading.text() === 'Remote access')!;
    expect(remoteHeading.element.closest('section')?.textContent).toContain('Services');
    expect(wrapper.getComponent(ManagedBackupPanel)).toBeDefined();
  });

  it('shows the preview environment disclaimer only in preview mode', async () => {
    const { wrapper, result } = renderPage();
    expect(wrapper.text()).not.toContain('Preview mode:');

    result.value = {
      connectTunnelSettings: { ...state(), previewMode: true },
    };
    await flushPromises();

    expect(wrapper.get('[role="status"]').text()).toContain(
      'Preview mode: licensing, Unraid Connect, and certificates use the preview environment, not production.'
    );
  });

  it('keeps a gateway loader visible until the restarted connector reports ready or idle', async () => {
    const { wrapper, result } = renderPage();
    wrapper.getComponent(ConnectServicesPanel).vm.$emit('save', {
      expectedRevision: 0,
      services: [],
    });
    await flushPromises();
    expect(wrapper.text()).toContain('Applying gateway changes');
    expect(wrapper.text()).not.toContain('Gateway unavailable');
    expect(wrapper.getComponent(ConnectServicesPanel).props('applying')).toBe(true);

    const ready = state();
    ready.tunnelRemoteAccessEnabled = true;
    ready.gateway.revision = 1;
    ready.status.gateway = 'ready';
    ready.status.routeState = 'ready';
    ready.status.tunnel = 'idle';
    result.value = { connectTunnelSettings: ready };
    await flushPromises();
    expect(wrapper.getComponent(ConnectServicesPanel).props('applying')).toBe(false);
    expect(wrapper.text()).not.toContain('Applying gateway changes');
  });

  it.each(['loading', 'failed'])(
    'keeps account actions on Connect when tunnel settings are %s',
    async (status) => {
      const { wrapper, result, loading, error, refetch } = renderPage();
      expect(wrapper.findAllComponents(Auth)).toHaveLength(1);
      expect(wrapper.getComponent(Auth).props('allowSignOut')).toBe(true);
      expect(wrapper.getComponent(Auth).element.closest('form')).toBeNull();
      result.value = undefined;
      loading.value = status === 'loading';
      error.value = status === 'failed' ? new Error('Unavailable') : null;
      await flushPromises();
      expect(wrapper.findAllComponents(Auth)).toHaveLength(1);
      expect(wrapper.getComponent(Auth).props('allowSignOut')).toBe(true);
      expect(wrapper.find('h1').exists()).toBe(true);
      expect(wrapper.find('form').exists()).toBe(false);
      expect(wrapper.find('a[href="/Settings/Connect"]').exists()).toBe(true);
      if (status === 'failed') {
        await wrapper
          .findAll('[role="button"]')
          .find((b) => b.text() === 'Retry')!
          .trigger('click');
        expect(refetch).toHaveBeenCalledOnce();
      }
    }
  );

  it('leaves API settings and OIDC logs separate from Connect account actions', () => {
    vi.mocked(useQuery).mockReturnValue({
      result: ref({
        settings: { unified: { dataSchema: {}, uiSchema: {}, values: {} } },
      }),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useQuery>);
    vi.mocked(useMutation).mockReturnValue({
      mutate: vi.fn(),
      loading: ref(false),
      error: ref(null),
      onDone: vi.fn(),
    } as unknown as ReturnType<typeof useMutation>);
    const wrapper = mount(ConnectSettings, {
      global: {
        plugins: [createTestI18n()],
        stubs: { JsonForms: true, OidcDebugLogs: true },
      },
    });
    wrappers.push(wrapper);
    expect(wrapper.findComponent(Auth).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'JsonForms' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'OidcDebugLogs' }).exists()).toBe(true);
    expect(wrapper.text()).toContain('Apply');
  });
  it.each([false, true])('resumes observable polling after save (failure=%s)', async (fail) => {
    const { wrapper, mutate, refetch, stopPolling, startPolling } = renderPage(fail);
    await featureSwitch(wrapper, 'serverDataReportingEnabled').trigger('click');
    await wrapper
      .findAll('[role="button"]')
      .find((b) => b.text() === 'Apply changes')!
      .trigger('click');
    await flushPromises();
    expect(mutate).toHaveBeenCalledWith({
      input: {
        certificateManagementEnabled: true,
        tunnelRemoteAccessEnabled: false,
        serverDataReportingEnabled: true,
      },
    });
    expect(stopPolling).toHaveBeenCalledOnce();
    expect(refetch).toHaveBeenCalledOnce();
    expect(startPolling).toHaveBeenCalledWith(5000);
    expect(wrapper.getComponent(ConnectTunnelPanel).attributes('aria-busy')).toBe('false');
    if (fail) expect(wrapper.get('[role="alert"]').text()).toContain('Save refused');
    else expect(wrapper.text()).toContain('Connect settings saved.');
  });
  it.each([false, true])(
    'sends migration once and refreshes status even after a lost response (failure=%s)',
    async (fail) => {
      const { wrapper, mutate, refetch } = renderPage(fail);
      const click = async (name: string) =>
        wrapper
          .findAll('[role="button"]')
          .find((b) => b.text() === name)!
          .trigger('click');
      await click('Migrate certificate now');
      expect(mutate).not.toHaveBeenCalled();
      await click('Confirm certificate migration');
      await flushPromises();
      expect(mutate).toHaveBeenCalledExactlyOnceWith({ confirmationToken: 'confirmation-token' });
      expect(refetch).toHaveBeenCalledOnce();
      expect(wrapper.text()).not.toContain('Connect settings saved.');
    }
  );
});

describe('service editor', () => {
  type ServiceTarget = ConnectServiceTargetsQuery['docker']['containers'][number];
  function services(
    value = state(),
    providers: { id: string; name: string }[] = [],
    serviceTargets: ServiceTarget[] = [],
    discovery: { loading?: boolean; error?: boolean } = {}
  ) {
    const wrapper = mount(ConnectServicesPanel, {
      props: {
        state: value,
        providers,
        serviceTargets,
        serviceTargetsLoading: discovery.loading,
        serviceTargetsError: discovery.error,
      },
      global: { plugins: [createTestI18n()] },
    });
    wrappers.push(wrapper);
    return wrapper;
  }
  const action = (wrapper: ReturnType<typeof services>, name: string) =>
    wrapper.findAll('[role="button"]').find((b) => b.text() === name)!;
  const authSelect = (wrapper: ReturnType<typeof services>) =>
    wrapper.findAllComponents(SelectRoot).at(-1)!;
  const app = {
    id: 'app-0123456789abcdef',
    name: 'Media',
    upstream: 'http://127.0.0.1:32400',
    tlsServerName: '',
    enabled: true,
    url: 'https://media.example.test',
    auth: 'account',
    providerId: '',
    subjects: [],
  };
  const plexTarget: ServiceTarget = {
    id: 'docker:plex',
    names: ['/Plex'],
    state: ContainerState.RUNNING,
    webUiUrl: 'http://10.0.6.112:32400/web',
    ports: [
      {
        privatePort: 32400,
        publicPort: 32400,
        type: ContainerPortType.TCP,
      },
      {
        privatePort: 1900,
        publicPort: 1900,
        type: ContainerPortType.UDP,
      },
    ],
  };
  it('discovers running containers and builds the local target from a published TCP port', async () => {
    const wrapper = services(
      state(),
      [],
      [
        plexTarget,
        {
          ...plexTarget,
          id: 'docker:stopped',
          names: ['/Stopped'],
          state: ContainerState.EXITED,
        },
      ]
    );
    await action(wrapper, 'Add service').trigger('click');
    expect(wrapper.text()).toContain('Docker container');
    expect(wrapper.text()).toContain('Plex');
    expect(wrapper.text()).toContain('Port 32400/TCP');
    expect(wrapper.text()).not.toContain('1900');
    expect(wrapper.text()).not.toContain('Stopped');
    expect(wrapper.text()).toContain('http://127.0.0.1:32400');
    expect((wrapper.get('input[autocomplete="off"]').element as HTMLInputElement).value).toBe('Plex');
    expect(wrapper.find('input[type="url"]').exists()).toBe(false);

    const protocol = wrapper
      .findAllComponents(SelectRoot)
      .find((select) => select.props('modelValue') === 'http')!;
    protocol.vm.$emit('update:modelValue', 'https');
    await flushPromises();
    expect(wrapper.text()).toContain('https://127.0.0.1:32400');

    await action(wrapper, 'Save service').trigger('click');
    expect(wrapper.emitted('save')?.[0]).toMatchObject([
      {
        services: [
          {
            name: 'Plex',
            upstream: 'https://127.0.0.1:32400',
          },
        ],
      },
    ]);
  });
  it('shows discovery progress and selects a target when the API response arrives', async () => {
    const wrapper = services(state(), [], [], { loading: true });
    await action(wrapper, 'Add service').trigger('click');
    expect(wrapper.get('[role="status"]').text()).toContain('Finding running containers');
    await wrapper.setProps({ serviceTargetsLoading: false, serviceTargets: [plexTarget] });
    await flushPromises();
    expect(wrapper.text()).toContain('http://127.0.0.1:32400');
    expect((wrapper.get('input[autocomplete="off"]').element as HTMLInputElement).value).toBe('Plex');
  });
  it('keeps manual entry available when Docker discovery fails or has no published ports', async () => {
    const failed = services(state(), [], [], { error: true });
    await action(failed, 'Add service').trigger('click');
    expect(failed.text()).toContain('could not load Docker containers');
    await action(failed, 'Refresh containers').trigger('click');
    expect(failed.emitted('refreshTargets')).toHaveLength(1);
    await action(failed, 'Enter address manually').trigger('click');
    expect(failed.find('input[type="url"]').exists()).toBe(true);

    const empty = services();
    await action(empty, 'Add service').trigger('click');
    empty.findAllComponents(SelectRoot)[0]!.vm.$emit('update:modelValue', 'container');
    await flushPromises();
    expect(empty.text()).toContain('No running containers with published TCP ports');
  });
  it('publishes a new service when saved and emits only the local settings contract', async () => {
    const wrapper = services();
    await action(wrapper, 'Add service').trigger('click');
    expect(wrapper.find('[role="switch"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Enable remote access to this service');
    expect(wrapper.text()).toContain('configured Unraid Account access rules');
    expect(wrapper.text()).toContain('limited to the server owner');
    await wrapper.get('input[autocomplete="off"]').setValue('Media');
    await wrapper.get('input[type="url"]').setValue('http://127.0.0.1:32400');
    expect(wrapper.emitted('save')).toBeUndefined();
    await action(wrapper, 'Save service').trigger('click');
    expect(wrapper.emitted('save')?.[0]).toEqual([
      {
        expectedRevision: 0,
        services: [
          {
            id: expect.stringMatching(/^app-[a-f0-9]{16}$/),
            name: 'Media',
            upstream: 'http://127.0.0.1:32400',
            tlsServerName: '',
            enabled: true,
            auth: 'account',
            providerId: '',
            subjects: [],
          },
        ],
      },
    ]);
  });
  it('lists configured providers, shows the callback and saves provider-backed access', async () => {
    const value = state();
    value.gateway.callbackUrl = 'https://tun-parent.example.test/graphql/api/auth/oidc/callback';
    const wrapper = services(value, [{ id: 'local-provider', name: 'Company sign-in' }]);
    await action(wrapper, 'Add service').trigger('click');
    await wrapper.get('input[autocomplete="off"]').setValue('Media');
    await wrapper.get('input[type="url"]').setValue('http://127.0.0.1:32400');
    authSelect(wrapper).vm.$emit('update:modelValue', 'oidc:local-provider');
    await flushPromises();
    expect(wrapper.text()).toContain('existing access rules');
    expect(wrapper.text()).toContain('does not grant access');
    expect(wrapper.text()).toContain(value.gateway.callbackUrl);
    expect(wrapper.text()).toContain('allowed callback redirects');
    expect(wrapper.find('textarea').exists()).toBe(false);
    await action(wrapper, 'Save service').trigger('click');
    expect(wrapper.emitted('save')?.[0]).toMatchObject([
      {
        services: [{ auth: 'oidc', providerId: 'local-provider', subjects: [] }],
      },
    ]);
    authSelect(wrapper).vm.$emit('update:modelValue', 'account');
    await flushPromises();
    await action(wrapper, 'Save service').trigger('click');
    expect(wrapper.emitted('save')?.[1]).toMatchObject([
      { services: [{ auth: 'account', providerId: '', subjects: [] }] },
    ]);
  });
  it('shows the built-in account provider once while retaining other configured providers', async () => {
    const wrapper = services(state(), [
      { id: 'provider:unraid.net', name: 'Unraid.net' },
      { id: 'provider:company', name: 'Company sign-in' },
    ]);
    await action(wrapper, 'Add service').trigger('click');
    const optionLabels = (
      wrapper.vm as unknown as { authOptions: { value: string; label: string }[] }
    ).authOptions.map((option) => option.label);
    expect(optionLabels.filter((label) => label === 'Unraid Account sign-in (default)')).toHaveLength(1);
    expect(optionLabels).not.toContain('Unraid.net');
    expect(optionLabels).toContain('Company sign-in');
  });
  it('edits a legacy Unraid.net OIDC service as Unraid Account without losing its saved mode', async () => {
    const value = state();
    value.gateway.services = [
      { ...app, auth: 'oidc', providerId: 'provider:unraid.net', subjects: ['owner'] },
    ];
    const wrapper = services(value, [{ id: 'provider:unraid.net', name: 'Unraid.net' }]);
    await action(wrapper, 'Edit service').trigger('click');
    expect(authSelect(wrapper).props('modelValue')).toBe('account');
    expect(wrapper.text()).not.toContain('no longer configured');
    await action(wrapper, 'Save service').trigger('click');
    expect(wrapper.emitted('save')?.[0]).toMatchObject([
      {
        services: [{ auth: 'oidc', providerId: 'provider:unraid.net', subjects: ['owner'] }],
      },
    ]);
  });
  it('does not replace a deleted provider with an unprotected route', async () => {
    const value = state();
    value.gateway.services = [{ ...app, auth: 'oidc', providerId: 'deleted' }];
    const wrapper = services(value);
    await action(wrapper, 'Edit service').trigger('click');
    expect(wrapper.text()).toContain('no longer configured');
    await action(wrapper, 'Save service').trigger('click');
    expect(wrapper.emitted('save')).toBeUndefined();
  });
  it('requires acknowledgment for application auth and resets it when the target changes', async () => {
    const wrapper = services();
    await action(wrapper, 'Add service').trigger('click');
    await wrapper.get('input[autocomplete="off"]').setValue('Plex');
    await wrapper.get('input[type="url"]').setValue('http://127.0.0.1:32400');
    authSelect(wrapper).vm.$emit('update:modelValue', 'upstream');
    await flushPromises();
    expect(wrapper.text()).toContain('Connect will not require');
    expect(wrapper.text()).toContain('trusted-network');
    await action(wrapper, 'Save service').trigger('click');
    expect(wrapper.emitted('save')).toBeUndefined();
    await wrapper.get('input[type="checkbox"]').setValue(true);
    await wrapper.get('input[type="url"]').setValue('http://127.0.0.1:32401');
    await action(wrapper, 'Save service').trigger('click');
    expect(wrapper.emitted('save')).toBeUndefined();
    await wrapper.get('input[type="checkbox"]').setValue(true);
    await action(wrapper, 'Save service').trigger('click');
    expect(wrapper.emitted('save')?.[0]).toMatchObject([{ services: [{ auth: 'upstream' }] }]);
  });
  it('reports application-controlled access without claiming Account protection', () => {
    const value = state();
    value.tunnelRemoteAccessEnabled = true;
    value.gateway.services = [{ ...app, auth: 'upstream' }];
    value.status.gateway = 'ready';
    value.status.routeState = 'ready';
    value.status.tunnel = 'connected';
    const wrapper = services(value);
    expect(wrapper.text()).toContain('Application controls access');
    expect(wrapper.text()).not.toContain('Account sign-in required');
  });
  it('keeps confirmed services available while the on-demand tunnel is initially idle', () => {
    const value = state();
    value.tunnelRemoteAccessEnabled = true;
    value.gateway.services = [app];
    value.status.gateway = 'ready';
    value.status.routeState = 'ready';
    value.status.tunnel = 'idle';
    const wrapper = services(value);
    expect(wrapper.text()).toContain('Account sign-in required');
    expect(wrapper.text()).not.toContain('Gateway unavailable');
    expect(wrapper.get('a').attributes('href')).toBe(app.url);
  });
  it('shows a loader instead of an unavailable service while gateway changes apply', async () => {
    const value = state();
    value.tunnelRemoteAccessEnabled = true;
    value.gateway.services = [app];
    value.status.gateway = 'unavailable';
    value.status.routeState = 'unavailable';
    const wrapper = services(value);
    await wrapper.setProps({ applying: true });
    expect(wrapper.attributes('aria-busy')).toBe('true');
    expect(wrapper.text()).toContain('Applying gateway changes');
    expect(wrapper.text()).toContain('restarting the gateway');
    expect(wrapper.text()).not.toContain('Gateway unavailable');
    expect(wrapper.find('a').exists()).toBe(false);
    expect(action(wrapper, 'Add service').attributes('aria-disabled')).toBe('true');
  });
  it('preserves drafts during polling but blocks a stale revision', async () => {
    const wrapper = services();
    await action(wrapper, 'Add service').trigger('click');
    await wrapper.get('input[autocomplete="off"]').setValue('Unsaved');
    await wrapper.setProps({ state: { ...state(), gateway: { ...state().gateway, revision: 1 } } });
    expect(wrapper.get('input').element.value).toBe('Unsaved');
    expect(wrapper.text()).toContain('changed elsewhere');
    await action(wrapper, 'Save service').trigger('click');
    expect(wrapper.emitted('save')).toBeUndefined();
  });
  it('requires confirmation to remove a service and hides unready links', async () => {
    const value = state();
    value.tunnelRemoteAccessEnabled = true;
    value.gateway.services = [app];
    value.status.gateway = 'ready';
    value.status.routeState = 'ready';
    value.status.tunnel = 'connected';
    const wrapper = services(value);
    expect(wrapper.get('a').attributes('href')).toBe(app.url);
    await action(wrapper, 'Remove').trigger('click');
    expect(wrapper.emitted('save')).toBeUndefined();
    await action(wrapper, 'Remove service').trigger('click');
    expect(wrapper.emitted('save')?.[0]).toEqual([{ expectedRevision: 0, services: [] }]);
    await wrapper.setProps({ state: { ...value, gateway: { ...value.gateway, pending: true } } });
    expect(wrapper.find('a').exists()).toBe(false);
    await action(wrapper, 'Retry route setup').trigger('click');
    expect(wrapper.emitted('save')?.[1]).toEqual([
      {
        expectedRevision: 0,
        services: [
          {
            id: app.id,
            name: app.name,
            upstream: app.upstream,
            tlsServerName: '',
            enabled: true,
            auth: 'account',
            providerId: '',
            subjects: [],
          },
        ],
      },
    ]);
  });
  it('does not claim readiness or allow saves while signed out or unavailable', async () => {
    const value = state();
    value.gateway.services = [app];
    const wrapper = services(value);
    expect(wrapper.find('a').exists()).toBe(false);
    await wrapper.setProps({ unavailable: true });
    await action(wrapper, 'Add service').trigger('click');
    expect(wrapper.find('form').exists()).toBe(false);
    await wrapper.setProps({ unavailable: false, state: { ...value, signedIn: false } });
    await action(wrapper, 'Add service').trigger('click');
    expect(wrapper.find('form').exists()).toBe(false);
  });
});
