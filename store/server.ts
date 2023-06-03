import { defineStore, createPinia, setActivePinia } from "pinia";
import { ArrowRightOnRectangleIcon, GlobeAltIcon, KeyIcon } from '@heroicons/vue/24/solid';
import type {
  Server,
  ServerState,
  ServerStateData,
  ServerStateDataAction,
} from '~/types/server';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useServerStore = defineStore('server', () => {
  /**
   * State
   */
  const avatar = ref<string>(''); // @todo potentially move to a user store
  const apiKey = ref<string>(''); // @todo potentially move to a user store
  const description = ref<string>('');
  const deviceCount = ref<number>(0);
  const expireTime = ref<number>(0);
  const flashProduct = ref<string>('');
  const flashVendor = ref<string>('');
  const guid = ref<string>('');
  const guidBlacklisted = ref<boolean>();
  const guidRegistered = ref<boolean>();
  const guidReplaceable = ref<boolean | undefined>();
  const keyfile = ref<string>('');
  const lanIp = ref<string>('');
  const license = ref<string>('');
  const locale = ref<string>('');
  const name = ref<string>('');
  const pluginInstalled = ref<boolean>(false);
  const registered = ref<boolean>();
  const regGen = ref<number>(0);
  const regGuid = ref<string>('');
  const site = ref<string>('');
  const state = ref<string>(''); // @todo implement ServerState ENUM
  const uptime = ref<number>(0);
  const username = ref<string>(''); // @todo potentially move to a user store
  const wanFQDN = ref<string>('');

  /**
   * Getters
   */
  const isRemoteAccess = computed(() => wanFQDN.value || (site.value && site.value.includes('www.') && site.value.includes('unraid.net')));
  /**
   * @todo configure
   */
  const pluginOutdated = computed(():boolean => {
    return false;
  });

  const server = computed<Server>(():Server => {
    return {
      apiKey: apiKey.value,
      avatar: avatar.value,
      description: description.value,
      deviceCount: deviceCount.value,
      expireTime: expireTime.value,
      flashProduct: flashProduct.value,
      flashVendor: flashVendor.value,
      guid: guid.value,
      keyfile: keyfile.value,
      lanIp: lanIp.value,
      license: license.value,
      locale: locale.value,
      name: name.value,
      pluginInstalled: pluginInstalled.value,
      registered: registered.value,
      regGen: regGen.value,
      regGuid: regGuid.value,
      site: site.value,
      state: state.value,
      uptime: uptime.value,
      username: username.value,
      wanFQDN: wanFQDN.value,
    }
  });

  const purchaseAction: ServerStateDataAction = {
    click: () => { console.debug('purchase') },
    external: true,
    icon: KeyIcon,
    name: 'purchase',
    text: 'Purchase Key',
  };
  const upgradeAction: ServerStateDataAction = {
    click: () => { console.debug('upgrade') },
    external: true,
    icon: KeyIcon,
    name: 'upgrade',
    text: 'Upgrade Key',
  };
  const recoverAction: ServerStateDataAction = {
    click: () => { console.debug('recover') },
    external: true,
    icon: KeyIcon,
    name: 'recover',
    text: 'Recover Key',
  };
  const redeemAction: ServerStateDataAction = {
    click: () => { console.debug('redeem') },
    external: true,
    icon: KeyIcon,
    name: 'redeem',
    text: 'Redeem Activation Code',
  };
  const replaceAction: ServerStateDataAction = {
    click: () => { console.debug('replace') },
    external: true,
    icon: KeyIcon,
    name: 'replace',
    text: 'Replace Key',
  };
  const signInAction: ServerStateDataAction = {
    click: () => { console.debug('signIn') },
    external: true,
    icon: GlobeAltIcon,
    name: 'signIn',
    text: 'Sign In with Unraid.net Account',
  };
  const signOutAction: ServerStateDataAction = {
    click: () => { console.debug('signOut') },
    external: true,
    icon: ArrowRightOnRectangleIcon,
    name: 'signOut',
    text: 'Sign Out of Unraid.net',
  };
  const trialExtendAction: ServerStateDataAction = {
    click: () => { console.debug('trialExtend') },
    external: true,
    icon: ArrowRightOnRectangleIcon,
    name: 'trialExtend',
    text: 'Extend Trial',
  };
  const trialStartAction: ServerStateDataAction = {
    click: () => { console.debug('trialStart') },
    external: true,
    icon: ArrowRightOnRectangleIcon,
    name: 'trialStart',
    text: 'Start Free 30 Day Trial',
  };

  let messageEGUID = '';
  const stateData = computed(():ServerStateData => {
    switch (state.value) {
      case 'ENOKEYFILE':
        return {
          actions: [
            ...(!registered.value ? [signInAction] : []),
            ...([purchaseAction, redeemAction]),
            ...(registered.value ? [signOutAction] : []),
          ],
          humanReadable: 'No Keyfile',
          heading: `Let's Unleash your Hardware!`,
          message: `<p>Your server will not be usable until you purchase a Registration key or install a free 30-day <em>Trial</em> key. A <em>Trial</em> key provides all the functionality of a Pro Registration key.</p><p>Registration keys are bound to your USB Flash boot device serial number (GUID). Please use a high quality name brand device at least 1GB in size.</p><p>Note: USB memory card readers are generally not supported because most do not present unique serial numbers.</p><p><strong>Important:</strong></p><ul class='list-disc pl-16px'><li>Please make sure your server time is accurate to within 5 minutes</li><li>Please make sure there is a DNS server specified</li></ul>`,
        };
      case 'TRIAL':
        return {
          actions: [
            ...(!registered.value ? [signInAction] : []),
            ...([purchaseAction, redeemAction]),
            ...(registered.value ? [signOutAction] : []),
          ],
          humanReadable: 'Trial',
          heading: 'Thank you for choosing Unraid OS!',
          message: `<p>Your <em>Trial</em> key includes all the functionality and device support of a <em>Pro</em> key.</p><p>After your <em>Trial</em> has reached expiration, your server <strong>still functions normally</strong> until the next time you Stop the array or reboot your server.</p><p>At that point you may either purchase a license key or request a <em>Trial</em> extension.</p>`,
        };
      case 'EEXPIRED':
        return {
          actions: [
            ...(!registered.value ? [signInAction] : []),
            ...(trialExtensionEligible.value ? [trialExtendAction] : []),
            ...(registered.value ? [signOutAction] : []),
          ],
          humanReadable: 'Trial Expired',
          heading: 'Your Trial has expired',
          message: trialExtensionEligible.value
            ? 'To continue using Unraid OS you may purchase a license key. Alternately, you may request a Trial extension.'
            : 'You have used all your Trial extensions. To continue using Unraid OS you may purchase a license key.',
        };
      case 'BASIC':
        return {
          actions: [
            ...(!registered.value ? [signInAction] : []),
            ...([upgradeAction]),
            ...(registered.value ? [signOutAction] : []),
          ],
          humanReadable: 'Basic',
          heading: 'Thank you for choosing Unraid OS!',
          message: registered.value
            ? 'Register for Connect by signing in to your Unraid.net account'
            : guidRegistered.value
              ? 'To support more storage devices as your server grows, click Upgrade Key.'
              : '',
        };
      case 'PLUS':
        return {
          actions: [
            ...(!registered.value ? [signInAction] : []),
            ...([upgradeAction]),
            ...(registered.value ? [signOutAction] : []),
          ],
          humanReadable: 'Plus',
          heading: 'Thank you for choosing Unraid OS!',
          message: registered.value
            ? 'Register for Connect by signing in to your Unraid.net account'
            : guidRegistered.value
              ? 'To support more storage devices as your server grows, click Upgrade Key.'
              : '',
        };
      case 'PRO':
        return {
          actions: [
            ...(!registered.value ? [signInAction] : []),
            ...([upgradeAction]),
            ...(registered.value ? [signOutAction] : []),
          ],
          humanReadable: 'Pro',
          heading: 'Thank you for choosing Unraid OS!',
          message: registered.value
          ? 'Register for Connect by signing in to your Unraid.net account'
          : '',
        };
      case 'EGUID':
        if (guidReplaceable.value) messageEGUID = 'Your Unraid registration key is ineligible for replacement as it has been replaced within the last 12 months.';
        else if (guidReplaceable.value === false && guidBlacklisted.value) messageEGUID = `The license key file does not correspond to the USB Flash boot device. Please copy the correct key file to the /config directory on your USB Flash boot device or choose Purchase Key. <br class="mb-2">Your Unraid registration key is ineligible for replacement as it is blacklisted.`;
        else if (guidReplaceable.value === false && !guidBlacklisted.value) messageEGUID = `The license key file does not correspond to the USB Flash boot device. Please copy the correct key file to the /config directory on your USB Flash boot device or choose Purchase Key. <br class="mb-2">Your Unraid registration key is ineligible for replacement as it has been replaced within the last 12 months.`;
        else messageEGUID = 'The license key file does not correspond to the USB Flash boot device. Please copy the correct key file to the /config directory on your USB Flash boot device or choose Purchase Key or Replace Key.'; // basically guidReplaceable.value === null
        return {
          actions: [
            ...(!registered.value ? [signInAction] : []),
            ...([purchaseAction, redeemAction, replaceAction]),
            ...(registered.value ? [signOutAction] : []),
          ],
          humanReadable: 'Flash GUID Error',
          heading: 'Registration key / USB Flash GUID mismatch',
          message: messageEGUID,
        };
      case 'EGUID1':
        return {
          actions: [
            ...(!registered.value ? [signInAction] : []),
            ...(registered.value ? [purchaseAction, redeemAction] : []),
            ...(registered.value ? [signOutAction] : []),
          ],
          humanReadable: 'Multiple License Keys Present',
          heading: 'Multiple License Keys Present',
          message: 'There are multiple license key files present on your USB flash device and none of them correspond to the USB Flash boot device. Please remove all key files, except the one you want to replace, from the /config directory on your USB Flash boot device. Alternately you may purchase a license key for this USB flash device. If you want to replace one of your license keys with a new key bound to this USB Flash device, please first remove all other key files first.',
          // signInToFix: true, // @todo
        };
      case 'ENOKEYFILE2':
        return {
          actions: [
            ...(!registered.value ? [signInAction] : []),
            ...([purchaseAction, redeemAction]),
            ...(registered.value ? [recoverAction, signOutAction] : []),
          ],
          humanReadable: 'Missing key file',
          heading: 'Missing key file',
          message: 'It appears that your license key file is corrupted or missing. The key file should be located in the /config directory on your USB Flash boot device. If you do not have a backup copy of your license key file you may install the Connect (beta) plugin to attempt to recover your key. If this was an expired Trial installation, you may purchase a license key.',
        };
      case 'ETRIAL':
        return {
          actions: [
            ...(!registered.value ? [signInAction] : []),
            ...([purchaseAction, redeemAction]),
            ...(registered.value ? [signOutAction] : []),
          ],
          humanReadable: 'Invalid installation',
          heading: 'Invalid installation',
          message: 'It is not possible to use a Trial key with an existing Unraid OS installation. You may purchase a license key corresponding to this USB Flash device to continue using this installation.',
        };
      case 'ENOKEYFILE1':
        return {
          actions: [
            ...(!registered.value ? [signInAction] : []),
            ...([purchaseAction, redeemAction]),
            ...(registered.value ? [signOutAction] : []),
          ],
          humanReadable: 'No Keyfile',
          heading: 'No USB flash configuration data',
          message: 'There is a problem with your USB Flash device',
        };
      case 'ENOFLASH':
      case 'ENOFLASH1':
      case 'ENOFLASH2':
      case 'ENOFLASH3':
      case 'ENOFLASH4':
      case 'ENOFLASH5':
      case 'ENOFLASH6':
      case 'ENOFLASH7':
        return {
          humanReadable: 'No Flash',
          heading: 'Cannot access your USB Flash boot device',
          message: 'There is a physical problem accessing your USB Flash boot device',
        };
      case 'EBLACKLISTED':
        return {
          humanReadable: 'BLACKLISTED',
          heading: 'Blacklisted USB Flash GUID',
          message: 'This USB Flash boot device has been blacklisted. This can occur as a result of transferring your license key to a replacement USB Flash device, and you are currently booted from your old USB Flash device. A USB Flash device may also be blacklisted if we discover the serial number is not unique – this is common with USB card readers.',
        };
      case 'EBLACKLISTED1':
        return {
          humanReadable: 'BLACKLISTED',
          heading: 'USB Flash device error',
          message: 'This USB Flash device has an invalid GUID. Please try a different USB Flash device',
        };
      case 'EBLACKLISTED2':
        return {
          humanReadable: 'BLACKLISTED',
          heading: 'USB Flash has no serial number',
          message: 'This USB Flash boot device has been blacklisted. This can occur as a result of transferring your license key to a replacement USB Flash device, and you are currently booted from your old USB Flash device. A USB Flash device may also be blacklisted if we discover the serial number is not unique – this is common with USB card readers.',
        };
      case 'ENOCONN':
        return {
          humanReadable: 'Trial Requires Internet Connection',
          heading: 'Cannot validate Unraid Trial key',
          message: 'Your Trial key requires an internet connection. Please check Settings > Network',
        };
      default:
        return {
          humanReadable: 'Stale',
          heading: 'Stale Server',
          message: 'Please refresh the page to ensure you load your latest configuration',
        };
    }
  });
  const authActionsNames = ['signIn', 'signOut'];
  // Extract sign in / out from actions so we can display seperately as needed
  const authAction = computed((): ServerStateDataAction | undefined => {
    if (!stateData.value.actions) return;
    return stateData.value.actions.find(action => authActionsNames.includes(action.name));
  });
  // Remove sign in / out from actions so we can display them separately
  const keyActions = computed((): ServerStateDataAction[] | undefined => {
    if (!stateData.value.actions) return;
    return stateData.value.actions.filter(action => !authActionsNames.includes(action.name));
  });
  const trialExtensionEligible = computed(() => !regGen.value || regGen.value < 2);

  /**
   * Actions
   */
  const setServer = (data: Server) => {
    console.debug('[setServer]', data);
    if (data?.apiKey) apiKey.value = data.apiKey;
    if (data?.avatar) avatar.value = data.avatar;
    if (data?.description) description.value = data.description;
    if (data?.deviceCount) deviceCount.value = data.deviceCount;
    if (data?.expireTime) expireTime.value = data.expireTime;
    if (data?.flashProduct) flashProduct.value = data.flashProduct;
    if (data?.flashVendor) flashVendor.value = data.flashVendor;
    if (data?.guid) guid.value = data.guid;
    if (data?.keyfile) keyfile.value = data.keyfile;
    if (data?.lanIp) lanIp.value = data.lanIp;
    if (data?.license) license.value = data.license;
    if (data?.locale) locale.value = data.locale;
    if (data?.name) name.value = data.name;
    if (data?.pluginInstalled) pluginInstalled.value = data.pluginInstalled;
    if (data?.registered) registered.value = data.registered;
    if (data?.regGen) regGen.value = data.regGen;
    if (data?.regGuid) regGuid.value = data.regGuid;
    if (data?.site) site.value = data.site;
    if (data?.state) state.value = data.state;
    if (data?.uptime) uptime.value = data.uptime;
    if (data?.username) username.value = data.username;
    if (data?.wanFQDN) wanFQDN.value = data.wanFQDN;
  };

  return {
    // state
    apiKey,
    avatar,
    description,
    deviceCount,
    expireTime,
    guid,
    locale,
    lanIp,
    name,
    pluginInstalled,
    registered,
    regGen,
    regGuid,
    site,
    state,
    uptime,
    username,
    // getters
    authAction,
    isRemoteAccess,
    keyActions,
    pluginOutdated,
    server,
    stateData,
    // actions
    setServer,
  };
});
