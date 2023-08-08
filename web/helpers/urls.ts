/**
 * @todo setup .env
 */
const ACCOUNT = new URL(import.meta.env.VITE_ACCOUNT ?? 'https://account.unraid.net');
const UNRAID_NET = new URL(import.meta.env.VITE_UNRAID_NET ?? 'https://unraid.net');

const ACCOUNT_CALLBACK = new URL('c', ACCOUNT);
const CONNECT_DOCS = new URL('https://docs.unraid.net/category/unraid-connect');
const CONNECT_DASHBOARD = new URL(import.meta.env.VITE_CONNECT ?? 'https://connect.myunraid.net');
const CONNECT_FORUMS = new URL('https://forums.unraid.net/forum/94-connect-plugin-support/');
const CONTACT = new URL('/contact', UNRAID_NET);
const DEV_GRAPH_URL = '';
const DISCORD = new URL('https://discord.gg/unraid');
const PURCHASE_CALLBACK = new URL('/c', UNRAID_NET);

const SETTINGS_MANAGMENT_ACCESS = new URL('/Settings/ManagementAccess', window.location.origin);
const PLUGIN_SETTINGS = new URL('#UnraidNetSettings', SETTINGS_MANAGMENT_ACCESS);

export {
  ACCOUNT,
  ACCOUNT_CALLBACK,
  CONNECT_DASHBOARD,
  CONNECT_DOCS,
  CONNECT_FORUMS,
  CONTACT,
  DEV_GRAPH_URL,
  DISCORD,
  PURCHASE_CALLBACK,
  PLUGIN_SETTINGS,
  SETTINGS_MANAGMENT_ACCESS,
};
