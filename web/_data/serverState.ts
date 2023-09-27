import type { Server, ServerState } from '~/types/server';

function makeid (length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
  const charactersLength = characters.length;
  let result = '';
  for (let i = 0; i < length; i++) { result += characters.charAt(Math.floor(Math.random() * charactersLength)); }
  return result;
}

const randomGuid = `1111-1111-${makeid(4)}-123412341234`; // this guid is registered in key server
// const newGuid = `1234-1234-${makeid(4)}-123412341234`; // this is a new USB, not registered
// const regWizTime = `1616711990500_${randomGuid}`;
// const blacklistedGuid = '154B-00EE-0700-9B50CF819816';

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
const state: ServerState = 'BASIC';
let regTy = '';
switch (state) {
  // @ts-ignore
  case 'EEXPIRED':
  // @ts-ignore
  case 'ENOCONN':
  // @ts-ignore
  case 'TRIAL':
    regTy = 'Trial';
    break;
  // @ts-ignore
  case 'BASIC':
  // @ts-ignore
  case 'PLUS':
  // @ts-ignore
  case 'PRO':
  // @ts-ignore
  case 'STARTER':
  // @ts-ignore
  case 'UNLEASHED':
  // @ts-ignore
  case 'LIFETIME':
    regTy = state.charAt(0).toUpperCase() + state.substring(1).toLowerCase(); // title case
    break;
}

const uptime = Date.now() - 60 * 60 * 1000; // 1 hour ago
const oneHourFromNow = Date.now() + 60 * 60 * 1000; // 1 hour from now
let expireTime = 0;
if (state === 'TRIAL') { expireTime = oneHourFromNow; } // in 1 hour
else if (state === 'EEXPIRED') { expireTime = uptime; } // 1 hour ago

export const serverState: Server = {
  apiKey: 'unupc_fab6ff6ffe51040595c6d9ffb63a353ba16cc2ad7d93f813a2e80a5810',
  avatar: 'https://source.unsplash.com/300x300/?portrait',
  config: {
    // error: 'INVALID',
    valid: true,
  },
  connectPluginInstalled: 'dynamix.unraid.net.staging.plg',
  // connectPluginInstalled: '',
  description: 'DevServer9000',
  deviceCount: 12,
  expireTime,
  flashProduct: 'SanDisk_3.2Gen1',
  flashVendor: 'USB',
  guid: randomGuid,
  // "guid": "0781-5583-8355-81071A2B0211",
  inIframe: false,
  // keyfile: 'DUMMY_KEYFILE',
  lanIp: '192.168.254.36',
  license: '',
  locale: 'en_US', // en_US, ja
  name: 'fuji',
  osVersion: '6.12.3',
  registered: true,
  regGen: 0,
  regTm: uptime,
  regTo: 'Zack Spear',
  regTy,
  // regUpdExpAt: oneHourFromNow,
  regUpdExpAt: uptime,
  // "regGuid": "0781-5583-8355-81071A2B0211",
  site: 'http://localhost:4321',
  state,
  theme: {
    banner: false,
    bannerGradient: false,
    bgColor: '',
    descriptionShow: true,
    metaColor: '',
    name: 'black',
    textColor: ''
  },
  uptime,
  username: 'zspearmint',
  wanFQDN: ''
};
