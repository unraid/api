// import dayjs, { extend } from 'dayjs';
// import customParseFormat from 'dayjs/plugin/customParseFormat';
// import relativeTime from 'dayjs/plugin/relativeTime';
// import wretch from 'wretch';
// // eslint-disable-next-line import/no-named-as-default
// import QueryStringAddon from 'wretch/addons/queryString';

// import { OS_RELEASES } from '~/helpers/urls';
import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import type {
  Server,
  ServerState,
  // ServerUpdateOsResponse,
} from '~/types/server';

// dayjs plugins
// extend(customParseFormat);
// extend(relativeTime);

// function makeid(length: number) {
//   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
//   const charactersLength = characters.length;
//   let result = '';
//   for (let i = 0; i < length; i++) { result += characters.charAt(Math.floor(Math.random() * charactersLength)); }
//   return result;
// }

// ENOKEYFILE
// TRIAL
// BASIC
// PLUS
// PRO
// STARTER
// UNLEASHED
// LIFETIME
// EEXPIRED
// EGUID
// EGUID1
// ETRIAL
// ENOKEYFILE2
// ENOKEYFILE1
// ENOFLASH
// EBLACKLISTED
// EBLACKLISTED1
// EBLACKLISTED2
// ENOCONN

const state: ServerState = 'BASIC' as ServerState;
const currentFlashGuid = '1111-1111-YIJD-ZACK1234TEST'; // this is the flash drive that's been booted from
const regGuid = '1111-1111-YIJD-ZACK1234TEST'; // this guid is registered in key server
const keyfileBase64 = '';

// const randomGuid = `1111-1111-${makeid(4)}-123412341234`; // this guid is registered in key server
// const newGuid = `1234-1234-${makeid(4)}-123412341234`; // this is a new USB, not registered
// const regWizTime = `1616711990500_${randomGuid}`;
// const blacklistedGuid = '154B-00EE-0700-9B50CF819816';

const uptime = Date.now() - 60 * 60 * 1000; // 1 hour ago
// const twentyDaysAgo = Date.now() - 20 * 24 * 60 * 60 * 1000; // 20 days ago
const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000; // 90 days ago
const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000; // 2 days ago
// const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000; // 1 day ago
const oneHourFromNow = Date.now() + 60 * 60 * 1000; // 1 hour from now
// const oneDayFromNow = Date.now() + 24 * 60 * 60 * 1000; // 1 day from now
let expireTime = 0;
let regExp: number | undefined;

let regDevs = 0;
let regTy = '';
switch (state) {
  case 'EEXPIRED':
    expireTime = uptime; // 1 hour ago
    break;
  case 'ENOCONN':
    break;
  case 'TRIAL':
    expireTime = oneHourFromNow; // in 1 hour
    regTy = 'Trial';
    break;
  case 'BASIC':
    regDevs = 6;
    regTy = 'Basic';
    break;
  case 'PLUS':
    regDevs = 12;
    regTy = 'Plus';
    break;
  case 'PRO':
    regDevs = -1;
    regTy = 'Pro';
    break;
  case 'STARTER':
    regDevs = 6;
    regExp = ninetyDaysAgo;
    regTy = 'Starter';
    break;
  case 'UNLEASHED':
    regDevs = -1;
    regExp = ninetyDaysAgo;
    regTy = 'Unleashed';
    break;
  case 'LIFETIME':
    regDevs = -1;
    regTy = 'Lifetime';
    break;
}

// const connectPluginInstalled = 'dynamix.unraid.net.staging.plg';
const connectPluginInstalled = 'dynamix.unraid.net.staging.plg';

const osVersion = '7.0.0';
const osVersionBranch = 'stable';
// const parsedRegExp = regExp ? dayjs(regExp).format('YYYY-MM-DD') : undefined;

// const mimicWebguiUnraidCheck = async (): Promise<ServerUpdateOsResponse | undefined> => {
//   try {
//     const response = await wretch()
//       .addon(QueryStringAddon)
//       .url(OS_RELEASES.toString())
//       .query({
//         ...(parsedRegExp ? { update_exp: parsedRegExp } : undefined),
//         ...(osVersion ? { current_version: osVersion } : undefined),
//         ...(osVersionBranch ? { branch: osVersionBranch } : undefined),
//       })
//       .get()
//       .json<ServerUpdateOsResponse>()
//       .catch((caughtError) => {
//         throw new Error(caughtError);
//       });
//     return response;
//   } catch {
//     return undefined;
//   }
// };

const baseServerState: Server = {
  avatar: 'https://source.unsplash.com/300x300/?portrait',
  config: {
    id: 'config-id',
    error: null,
    valid: false,
  },
  connectPluginInstalled,
  description: 'DevServer9000',
  deviceCount: 3,
  expireTime,
  flashBackupActivated: !!connectPluginInstalled,
  flashProduct: 'SanDisk_3.2Gen1',
  flashVendor: 'USB',
  guid: currentFlashGuid,
  // "guid": "0781-5583-8355-81071A2B0211",
  inIframe: false,
  // keyfile: 'DUMMY_KEYFILE',
  keyfile: keyfileBase64,
  lanIp: '192.168.254.36',
  license: '',
  locale: 'en_US', // en_US, ja
  name: 'dev-static',
  osVersion,
  osVersionBranch,
  registered: connectPluginInstalled ? true : false,
  // registered: false,
  regGen: 0,
  regTm: twoDaysAgo,
  regTo: 'Zack Spear',
  regTy,
  regDevs,
  regExp,
  regGuid,
  site: 'http://localhost:4321',
  ssoEnabled: true,
  state,
  theme: {
    banner: false,
    bannerGradient: false,
    bgColor: '',
    descriptionShow: true,
    metaColor: '',
    name: 'white',
    textColor: '',
  },
  // updateOsResponse: {
  //   version: '6.12.6',
  //   name: 'Unraid 6.12.6',
  //   date: '2023-12-13',
  //   isNewer: true,
  //   isEligible: false,
  //   changelog: 'https://docs.unraid.net/unraid-os/release-notes/6.12.6/',
  //   sha256: '2f5debaf80549029cf6dfab0db59180e7e3391c059e6521aace7971419c9c4bf',
  // },
  uptime,
  username: 'zspearmint',
  wanFQDN: '',
};

export type ServerSelector = 'default' | 'oemActivation';
export const defaultServer: ServerSelector = 'default';

const servers: Record<ServerSelector, Server> = {
  default: baseServerState,
  /** shows oem activation flow */
  oemActivation: {
    ...baseServerState,
  },
};

export const useDummyServerStore = defineStore('_dummyServer', () => {
  const selector = ref<ServerSelector>(defaultServer);
  const serverState = computed(() => servers[selector.value] ?? servers.default);
  return { selector, serverState };
});
