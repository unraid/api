const ACCOUNT = new URL(import.meta.env.VITE_ACCOUNT ?? 'https://account.unraid.net');
const FORUMS = new URL('https://forums.unraid.net');
const UNRAID_NET = new URL(import.meta.env.VITE_UNRAID_NET ?? 'https://unraid.net');

const ACCOUNT_CALLBACK = new URL('c', ACCOUNT);
const FORUMS_BUG_REPORT = new URL('/bug-reports', FORUMS);
const CONNECT_DOCS = new URL('https://docs.unraid.net/category/unraid-connect');
const CONNECT_DASHBOARD = new URL(import.meta.env.VITE_CONNECT ?? 'https://connect.myunraid.net');
const CONNECT_FORUMS = new URL('/forum/94-connect-plugin-support/', FORUMS);
const CONTACT = new URL('/contact', UNRAID_NET);
const DISCORD = new URL('https://discord.gg/unraid');
const GRAPHQL = new URL('/graphql', import.meta.env.VITE_GRAPHQL ?? window.location.origin);
const PURCHASE_CALLBACK = new URL('/c', UNRAID_NET);

const SETTINGS_MANAGMENT_ACCESS = new URL('/Settings/ManagementAccess', window.location.origin);
const PLUGIN_SETTINGS = new URL('#UnraidNetSettings', SETTINGS_MANAGMENT_ACCESS);

const OS_RELEASES = new URL('https://s3.amazonaws.com/dnld.lime-technology.com/stable/releases.json');

export {
  ACCOUNT,
  ACCOUNT_CALLBACK,
  CONNECT_DASHBOARD,
  CONNECT_DOCS,
  CONNECT_FORUMS,
  CONTACT,
  DISCORD,
  FORUMS,
  FORUMS_BUG_REPORT,
  GRAPHQL,
  PURCHASE_CALLBACK,
  PLUGIN_SETTINGS,
  SETTINGS_MANAGMENT_ACCESS,
  OS_RELEASES,
};
