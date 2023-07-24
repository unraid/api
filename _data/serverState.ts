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

const uptime = Date.now() - 60 * 60 * 1000; // 1 hour ago
let expireTime = 0;
if (state === 'TRIAL') { expireTime = Date.now() + 60 * 60 * 1000; } // in 1 hour
if (state === 'EEXPIRED') { expireTime = uptime; } // 1 hour ago

export const serverState: Server = {
  apiKey: 'unupc_fab6ff6ffe51040595c6d9ffb63a353ba16cc2ad7d93f813a2e80a5810',
  avatar: 'https://source.unsplash.com/300x300/?portrait',
  config: {
    // error: 'INVALID',
    valid: true,
  },
  description: 'DevServer9000',
  deviceCount: 3,
  expireTime,
  flashProduct: 'SanDisk_3.2Gen1',
  flashVendor: 'USB',
  guid: randomGuid,
  // "guid": "0781-5583-8355-81071A2B0211",
  inIframe: false,
  // keyfile: 'DUMMY_KEYFILE',
  lanIp: '192.168.254.36',
  license: '',
  locale: 'en_US',
  name: 'fuji',
  connectPluginInstalled: 'dynamix.unraid.net.staging.plg',
  // connectPluginInstalled: '',
  registered: false,
  regGen: 0,
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
