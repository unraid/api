import type { Server, ServerState } from '~/types/server';

function makeid(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
  const charactersLength = characters.length;
  let result = '';
  for (let i = 0; i < length; i++) result += characters.charAt(Math.floor(Math.random() * charactersLength));
  return result;
}

const registeredGuid = `1111-1111-${makeid(4)}-123412341234`; // this guid is registered in key server
const newGuid = `1234-1234-${makeid(4)}-123412341234`; // this is a new USB, not registered
const regWizTime = `1616711990500_${registeredGuid}`;
const blacklistedGuid = '154B-00EE-0700-9B50CF819816';

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
const state: string = 'ENOKEYFILE2';

const uptime = Date.now() - 60 * 60 * 1000; // 1 hour ago
let expireTime = 0;
if (state === 'TRIAL') expireTime = Date.now() + 60 * 60 * 1000; // in 1 hour
if (state === 'EEXPIRED') expireTime = uptime; // 1 hour ago

const serverState = {
  // avatar: '',
  avatar: 'https://source.unsplash.com/300x300/?portrait',
  name: 'DevServer9000',
  description: 'Fully automated media server',
  guid: '9292-1111-BITE-444444444444',
  deviceCount: 8,
  expireTime,
  lanIp: '192.168.0.1',
  locale: 'en',
  pluginInstalled: true,
  registered: false,
  site: 'http://localhost:4321',
  state,
  uptime,
  username: 'zspearmint'
};

export default serverState;