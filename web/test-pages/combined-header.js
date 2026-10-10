import { createApp, h, ref } from 'vue';
import { createPinia } from 'pinia';
import { DefaultApolloClient, provideApolloClient } from '@vue/apollo-composable';

import { ApolloClient, ApolloLink, InMemoryCache, Observable } from '@apollo/client/core';
import Header from '/src/components/Header.standalone.vue';
import { ARRAY_CAPACITY_QUERY } from '/src/components/Header/arrayCapacity.query';
import { notificationsOverview } from '/src/components/Notifications/graphql/notification.query';
import { createI18nInstance, ensureLocale } from '/src/helpers/i18n-loader';
import { useServerStore } from '/src/store/server';
import { useThemeStore } from '/src/store/theme';

import '/src/assets/main.css';
import '@unraid/ui/styles';

const params = new URLSearchParams(location.search);
let usedPercent = Math.min(100, Math.max(0, Number(params.get('used') || 38)));
let arrayState = params.get('array') === 'stopped' ? 'STOPPED' : 'STARTED';
const arrayData = () => ({
  id: 'preview-array',
  state: arrayState,
  capacity: { kilobytes: { total: '100', free: String(100 - usedPercent), used: String(usedPercent) } },
});
const counts = { info: 0, warning: 0, alert: 0, total: 0 };
if (params.get('notification')) {
  counts[params.get('notification')] = 2;
  counts.total = 2;
}
const overview = () => ({ unread: { ...counts }, archive: { info: 0, warning: 0, alert: 0, total: 0 } });
const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new ApolloLink(
    (operation) =>
      new Observable((observer) => {
        if (operation.query.definitions.some((def) => def.operation === 'subscription')) return;
        const data = {
          customization: null,
          vars: null,
          config: null,
          owner: null,
          registration: null,
          cloud: null,
          recalculateOverview: overview(),
          array: arrayData(),
          info: {
            id: 'preview-info',
            primaryNetwork: null,
            os: { id: 'preview-os', hostname: 'Tower' },
            versions: { id: 'preview-versions', core: { unraid: '7.4.0-beta.3', api: '4.37.5' } },
          },
          notifications: {
            id: 'preview-notifications',
            overview: overview(),
            list: [],
          },
        };
        observer.next({ data });
        observer.complete();
      })
  ),
});
provideApolloClient(client);
const pinia = createPinia();
const server = {
  name: params.has('long') ? 'Home-Media-and-Backup-Server-With-A-Long-Name' : 'Tower',
  description: 'Media server',
  osVersion: '7.4.0-beta.3',
  rebootType: 'update',
  state: params.get('license') || 'LIFETIME',
  registered: false,
  lanIp: '192.0.2.10',
  connectPluginInstalled: params.has('no-connect') ? '' : 'dynamix.unraid.net.plg',
  guid: 'PREVIEW-GUID',
  keyfile: '',
  dateTimeFormat: { date: '%c', time: '%R' },
  uptime: Date.now() - 9 * 86400000,
  expireTime: Date.now() + (params.get('license') === 'EEXPIRED' ? -2 : 14) * 86400000,
  deviceCount: 4,
};
const theme =
  getComputedStyle(document.documentElement).getPropertyValue('--theme-name').trim() || 'black';
// Match the custom dark header and light text in the reported mobile banner.
if (params.get('header') === 'dark') {
  document.documentElement.style.setProperty('--header-background-color', '#1c1b1b');
  document.documentElement.style.setProperty('--header-text-color', '#f2f2f2');
}
const usage = ref(params.has('usage'));
const logoStyle = ref(params.get('logo') === 'theme' ? 'theme' : 'gradient');
const app = createApp({
  setup() {
    const themeStore = useThemeStore();
    const serverStore = useServerStore();
    const hasBanner = !params.has('no-banner');
    const hasFade = !params.has('no-fade');
    themeStore.setTheme({
      name: theme,
      banner: hasBanner,
      bannerGradient: hasFade,
      descriptionShow: true,
    });
    document.querySelector('#header').classList.toggle('image', hasBanner);
    document.querySelector('#banner').checked = hasBanner;
    document.querySelector('#fade').checked = hasFade;
    if (!hasFade) document.documentElement.style.setProperty('--banner-gradient', 'none');
    document.querySelector('#usage').checked = usage.value;
    document.querySelector('#long-name').checked = params.has('long');
    document.querySelector('#license').value = server.state;
    document.querySelector('#logo-style').value = logoStyle.value;
    document.querySelector('#array-state').value = arrayState;
    document.querySelector('#array-used').value = usedPercent;
    document.querySelector('#notification').value = params.get('notification') || 'none';

    const setStatus = (status) => {
      const updateAvailable = status === 'available' || status === 'renewal';
      const rebootType = ['update', 'downgrade', 'thirdPartyDriversDownloading'].includes(status)
        ? status
        : '';
      serverStore.rebootType = server.rebootType = rebootType;
      serverStore.regUpdatesExpired = server.regUpdatesExpired = status === 'renewal';
      serverStore.regExp = server.regExp = status === 'renewal' ? 1 : 0;
      serverStore.updateOsResponse = server.updateOsResponse = updateAvailable
        ? {
            version: '7.4.0-rc.1',
            name: 'Unraid 7.4.0-rc.1',
            date: '2026-10-09',
            isEligible: status !== 'renewal',
            isNewer: true,
            changelog: null,
            sha256: null,
          }
        : undefined;
      document.querySelector('#reboot').checked = Boolean(rebootType);
      document.querySelector('#operating-state').value = status;
    };
    setStatus(params.get('status') || 'update');
    document
      .querySelector('#operating-state')
      .addEventListener('change', (event) => setStatus(event.target.value));
    document.querySelector('#array-state').addEventListener('change', (event) => {
      arrayState = event.target.value;
      client.writeQuery({ query: ARRAY_CAPACITY_QUERY, data: { array: arrayData() } });
    });
    document.querySelector('#array-used').addEventListener('change', (event) => {
      usedPercent = Math.min(100, Math.max(0, Number(event.target.value)));
      client.writeQuery({ query: ARRAY_CAPACITY_QUERY, data: { array: arrayData() } });
    });
    document.querySelector('#notification').addEventListener('change', (event) => {
      Object.assign(counts, { info: 0, warning: 0, alert: 0, total: 0 });
      if (event.target.value !== 'none') {
        counts[event.target.value] = 2;
        counts.total = 2;
      }
      client.writeQuery({
        query: notificationsOverview,
        data: { notifications: { id: 'preview-notifications', overview: overview() } },
      });
    });
    document
      .querySelector('#logo-style')
      .addEventListener('change', (event) => (logoStyle.value = event.target.value));
    document.querySelector('#fade').addEventListener('change', (event) => {
      themeStore.setTheme({ bannerGradient: event.target.checked });
      document.documentElement.style.setProperty(
        '--banner-gradient',
        event.target.checked
          ? 'linear-gradient(90deg, transparent 0, var(--header-gradient-end) var(--banner-gradient-stop, 30%))'
          : 'none'
      );
    });
    document.querySelector('#banner').addEventListener('change', (event) => {
      themeStore.setTheme({ banner: event.target.checked });
      document.querySelector('#header').classList.toggle('image', event.target.checked);
    });
    document
      .querySelector('#reboot')
      .addEventListener('change', (event) => setStatus(event.target.checked ? 'update' : 'normal'));
    document
      .querySelector('#long-name')
      .addEventListener(
        'change',
        (event) =>
          (serverStore.name = server.name =
            event.target.checked ? 'Home-Media-and-Backup-Server-With-A-Long-Name' : 'Tower')
      );
    document
      .querySelector('#usage')
      .addEventListener('change', (event) => (usage.value = event.target.checked));
    document.querySelector('#license').addEventListener('change', (event) => {
      serverStore.state = server.state = event.target.value;
      serverStore.expireTime = server.expireTime =
        Date.now() + (event.target.value === 'EEXPIRED' ? -2 : 14) * 86400000;
    });

    return () => h(Header, { server, showArrayUsage: usage.value, headerLogoStyle: logoStyle.value });
  },
});
const i18n = createI18nInstance();
await ensureLocale(i18n, params.get('locale') || 'en_US');
app.use(pinia).use(i18n).provide(DefaultApolloClient, client).mount('#header-preview');
