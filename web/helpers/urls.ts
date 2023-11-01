const ACCOUNT = new URL(sessionStorage.getItem('unraidAccountUrl') ?? import.meta.env.VITE_ACCOUNT ?? 'https://account.unraid.net');
const DOCS = new URL('https://docs.unraid.net');
const FORUMS = new URL('https://forums.unraid.net');
const UNRAID_NET = new URL(sessionStorage.getItem('unraidPurchaseUrl') ?? import.meta.env.VITE_UNRAID_NET ?? 'https://unraid.net');

const ACCOUNT_CALLBACK = new URL('c', ACCOUNT);
const FORUMS_BUG_REPORT = new URL('/bug-reports', FORUMS);
const CONNECT_DOCS = new URL('category/unraid-connect', DOCS);
const CONNECT_DASHBOARD = new URL(import.meta.env.VITE_CONNECT ?? 'https://connect.myunraid.net');
const CONNECT_FORUMS = new URL('/forum/94-connect-plugin-support/', FORUMS);
const CONTACT = new URL('/contact', UNRAID_NET);
const DISCORD = new URL('https://discord.gg/unraid');
const PURCHASE_CALLBACK = new URL('/c', UNRAID_NET);

const WEBGUI = new URL(import.meta.env.VITE_WEBGUI ?? window.location.origin);
const WEBGUI_GRAPHQL = new URL('/graphql', WEBGUI);
const WEBGUI_SETTINGS_MANAGMENT_ACCESS = new URL('/Settings/ManagementAccess', WEBGUI);
const WEBGUI_CONNECT_SETTINGS = new URL('#UnraidNetSettings', WEBGUI_SETTINGS_MANAGMENT_ACCESS);
const WEBGUI_TOOLS_REGISTRATION = new URL('/Tools/Registration', WEBGUI);
const WEBGUI_TOOLS_UPDATE = new URL('/Tools/Update', WEBGUI);

const OS_RELEASES = new URL(import.meta.env.VITE_OS_RELEASES ?? 'https://next.dl.unraid.net/releases-combined.json');
const OS_RELEASES_NEXT = new URL(import.meta.env.VITE_OS_RELEASES_NEXT ?? 'https://next.dl.unraid.net/releases-combined.json');
const OS_RELEASES_PREVIEW = new URL(import.meta.env.VITE_OS_RELEASES_PREVIEW ?? 'https://preview.dl.unraid.net/releases-combined.json');

const DOCS_REGISTRATION_LICENSING = new URL('/unraid-os/faq/licensing-faq', DOCS);
const DOCS_REGISTRATION_REPLACE_KEY = new URL('/unraid-os/manual/changing-the-flash-device', DOCS);

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
  PURCHASE_CALLBACK,
  OS_RELEASES,
  OS_RELEASES_NEXT,
  OS_RELEASES_PREVIEW,
  DOCS_REGISTRATION_LICENSING,
  DOCS_REGISTRATION_REPLACE_KEY,
  WEBGUI,
  WEBGUI_CONNECT_SETTINGS,
  WEBGUI_GRAPHQL,
  WEBGUI_SETTINGS_MANAGMENT_ACCESS,
  WEBGUI_TOOLS_REGISTRATION,
  WEBGUI_TOOLS_UPDATE,
};
