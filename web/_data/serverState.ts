import type { Server, ServerState } from '~/types/server';

// function makeid(length: number) {
//   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
//   const charactersLength = characters.length;
//   let result = '';
//   for (let i = 0; i < length; i++) { result += characters.charAt(Math.floor(Math.random() * charactersLength)); }
//   return result;
// }

// '1111-1111-5GDB-123412341234' Starter.key = TkJCrVyXMLWWGKZF6TCEvf0C86UYI9KfUDSOm7JoFP19tOMTMgLKcJ6QIOt9_9Psg_t0yF-ANmzSgZzCo94ljXoPm4BESFByR0K7nyY9KVvU8szLEUcBUT3xC2adxLrAXFNxiPeK-mZqt34n16uETKYvLKL_Sr5_JziG5L5lJFBqYZCPmfLMiguFo1vp0xL8pnBH7q8bYoBnePrAcAVb9mAGxFVPEInSPkMBfC67JLHz7XY1Y_K5bYIq3go9XPtLltJ53_U4BQiMHooXUBJCKXodpqoGxq0eV0IhNEYdauAhnTsG90qmGZig0hZalQ0soouc4JZEMiYEcZbn9mBxPg
const staticGuid = '1111-1111-5GDB-123412341234';

// const randomGuid = `1111-1111-${makeid(4)}-123412341234`; // this guid is registered in key server
// const newGuid = `1234-1234-${makeid(4)}-123412341234`; // this is a new USB, not registered
// const regWizTime = `1616711990500_${randomGuid}`;
// const blacklistedGuid = '154B-00EE-0700-9B50CF819816';

const uptime = Date.now() - 60 * 60 * 1000; // 1 hour ago
const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000; // 2 days ago
// const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000; // 1 day ago
const oneHourFromNow = Date.now() + 60 * 60 * 1000; // 1 hour from now
// const oneDayFromNow = Date.now() + 24 * 60 * 60 * 1000; // 1 day from now
let expireTime = 0;
let regExp: number | undefined;

// ENOKEYFILE
// TRIAL
// BASIC
// PLUS
// PRO
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
const state: ServerState = 'STARTER';
let regDev = 0;
let regTy = '';
switch (state) {
  // @ts-ignore
  case 'EEXPIRED':
    expireTime = uptime; // 1 hour ago
  // @ts-ignore
  case 'ENOCONN':
  // @ts-ignore
  case 'TRIAL':
    expireTime = oneHourFromNow; // in 1 hour
    regTy = 'Trial';
  // @ts-ignore
  case 'BASIC':
    regDev = 6;
  // @ts-ignore
  case 'PLUS':
    regDev = 12;
  // @ts-ignore
  case 'PRO':
  // @ts-ignore
  case 'STARTER':
    regDev = 4;
    // regExp = oneHourFromNow;
    // regExp = oneDayFromNow;
    regExp = twoDaysAgo;
    // regExp = uptime;
    // regExp = 1696363920000; // nori.local's expiration
  // @ts-ignore
  case 'UNLEASHED':
    // regExp = oneHourFromNow;
    // regExp = oneDayFromNow;
    // regExp = oneDayAgo;
    // regExp = uptime;
    // regExp = 1696363920000; // nori.local's expiration
  // @ts-ignore
  case 'LIFETIME':
    if (regDev === 0) { regDev = 99999; }
    if (regTy === '') { regTy = state.charAt(0).toUpperCase() + state.substring(1).toLowerCase(); } // title case
    break;
}

const connectPluginInstalled = 'dynamix.unraid.net.staging.plg';
// const connectPluginInstalled = '';

export const serverState: Server = {
  apiKey: 'unupc_fab6ff6ffe51040595c6d9ffb63a353ba16cc2ad7d93f813a2e80a5810',
  avatar: 'https://source.unsplash.com/300x300/?portrait',
  config: {
    // error: 'INVALID',
    valid: true,
  },
  connectPluginInstalled,
  description: 'DevServer9000',
  deviceCount: 3,
  expireTime,
  flashBackupActivated: !!connectPluginInstalled,
  flashProduct: 'SanDisk_3.2Gen1',
  flashVendor: 'USB',
  guid: staticGuid,
  // "guid": "0781-5583-8355-81071A2B0211",
  inIframe: false,
  // keyfile: 'DUMMY_KEYFILE',
  keyfile: 'TkJCrVyXMLWWGKZF6TCEvf0C86UYI9KfUDSOm7JoFP19tOMTMgLKcJ6QIOt9_9Psg_t0yF-ANmzSgZzCo94ljXoPm4BESFByR0K7nyY9KVvU8szLEUcBUT3xC2adxLrAXFNxiPeK-mZqt34n16uETKYvLKL_Sr5_JziG5L5lJFBqYZCPmfLMiguFo1vp0xL8pnBH7q8bYoBnePrAcAVb9mAGxFVPEInSPkMBfC67JLHz7XY1Y_K5bYIq3go9XPtLltJ53_U4BQiMHooXUBJCKXodpqoGxq0eV0IhNEYdauAhnTsG90qmGZig0hZalQ0soouc4JZEMiYEcZbn9mBxPg',
  lanIp: '192.168.254.36',
  license: '',
  locale: 'en_US', // en_US, ja
  name: 'dev-static',
  osVersion: '6.12.4',
  // registered: connectPluginInstalled ? true : false,
  registered: false,
  regGen: 0,
  regTm: twoDaysAgo,
  regTo: 'Zack Spear',
  regTy,
  regExp,
  // "regGuid": "0781-5583-8355-81071A2B0211",
  site: 'http://localhost:4321',
  state,
  theme: {
    banner: false,
    bannerGradient: false,
    bgColor: '',
    descriptionShow: true,
    metaColor: '',
    name: 'white',
    textColor: ''
  },
  uptime,
  username: 'zspearmint',
  wanFQDN: ''
};
