import { defineStore, createPinia, setActivePinia } from 'pinia';
import { ArrowRightOnRectangleIcon, GlobeAltIcon, KeyIcon } from '@heroicons/vue/24/solid';

import { useAccountStore } from './account';
import { usePurchaseStore } from "./purchase";
import { useTrialStore } from './trial';
import { useThemeStore } from './theme';
import type {
  Server,
  ServerAccountCallbackSendPayload,
  ServerKeyTypeForPurchase,
  ServerPurchaseCallbackSendPayload,
  ServerState,
  ServerStateData,
  ServerStateDataAction,
} from '~/types/server';
import type { Theme } from '~/types/theme';
/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useServerStore = defineStore('server', () => {
  const accountStore = useAccountStore();
  const purchaseStore = usePurchaseStore();
  const themeStore = useThemeStore();
  const trialStore = useTrialStore();
  /**
   * State
   */
  const avatar = ref<string>(''); // @todo potentially move to a user store
  const apiKey = ref<string>(''); // @todo potentially move to a user store
  const csrf = ref<string>(''); // required to make requests to Unraid webgui
  const description = ref<string>('');
  const deviceCount = ref<number>(0);
  const email = ref<string>('');
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
  const theme = ref<Theme>();
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
      email: email.value,
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
      theme: theme.value,
      uptime: uptime.value,
      username: username.value,
      wanFQDN: wanFQDN.value,
    }
  });

  const serverPurchasePayload = computed((): ServerPurchaseCallbackSendPayload => {
    /** @todo refactor out. Just parse state on craft site to determine */
    let keyTypeForPurchase: ServerKeyTypeForPurchase = 'Trial';
    switch (state.value) {
      case 'BASIC':
        keyTypeForPurchase =  'Basic';
        break;
      case 'PLUS':
        keyTypeForPurchase =  'Plus';
        break;
      case 'PRO':
        keyTypeForPurchase =  'Pro';
        break;
    }
    const server = {
      deviceCount: deviceCount.value,
      email: email.value,
      guid: guid.value,
      keyTypeForPurchase,
      locale: locale.value,
      registered: registered.value ?? false,
      state: state.value,
      site: site.value,
    };
    console.debug('[serverPurchasePayload] server', server);
    return server;
  });

  const serverAccountPayload = computed((): ServerAccountCallbackSendPayload => {
    return {
      description: description.value,
      expireTime: expireTime.value,
      flashProduct: flashProduct.value,
      flashVendor: flashVendor.value,
      guid: guid.value,
      keyfile: keyfile.value,
      lanIp: lanIp.value,
      name: name.value,
      registered: registered.value ?? false,
      site: site.value,
      state: state.value,
      wanFQDN: wanFQDN.value,
    }
  });

  const purchaseAction: ServerStateDataAction = {
    click: () => { purchaseStore.purchase() },
    external: true,
    icon: KeyIcon,
    name: 'purchase',
    text: 'Purchase Key',
  };
  const upgradeAction: ServerStateDataAction = {
    click: () => { purchaseStore.upgrade() },
    external: true,
    icon: KeyIcon,
    name: 'upgrade',
    text: 'Upgrade Key',
  };
  const recoverAction: ServerStateDataAction = {
    click: () => { accountStore.recover() },
    external: true,
    icon: KeyIcon,
    name: 'recover',
    text: 'Recover Key',
  };
  const redeemAction: ServerStateDataAction = {
    click: () => { purchaseStore.redeem() },
    external: true,
    icon: KeyIcon,
    name: 'redeem',
    text: 'Redeem Activation Code',
  };
  const replaceAction: ServerStateDataAction = {
    click: () => { accountStore.replace() },
    external: true,
    icon: KeyIcon,
    name: 'replace',
    text: 'Replace Key',
  };
  const signInAction: ServerStateDataAction = {
    click: () => { accountStore.signIn() },
    external: true,
    icon: GlobeAltIcon,
    name: 'signIn',
    text: 'Sign In with Unraid.net Account',
  };
  const signOutAction: ServerStateDataAction = {
    click: () => { accountStore.signOut() },
    external: true,
    icon: ArrowRightOnRectangleIcon,
    name: 'signOut',
    text: 'Sign Out of Unraid.net',
  };
  const trialExtendAction: ServerStateDataAction = {
    click: () => { trialStore.extend() },
    external: true,
    icon: KeyIcon,
    name: 'trialExtend',
    text: 'Extend Trial',
  };
  const trialStartAction: ServerStateDataAction = {
    click: () => { trialStore.start() },
    external: true,
    icon: KeyIcon,
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
            ...([purchaseAction, redeemAction]),
            ...(trialExtensionEligible.value ? [trialExtendAction] : []),
            ...(registered.value ? [signOutAction] : []),
          ],
          error: true,
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
          error: true,
          humanReadable: 'Flash GUID Error',
          heading: 'Registration key / USB Flash GUID mismatch',
          message: messageEGUID,
        };
      case 'EGUID1':
        return {
          actions: [
            ...(!registered.value ? [signInAction] : []),
            ...([purchaseAction, redeemAction]),
            ...(registered.value ? [signOutAction] : []),
          ],
          error: true,
          humanReadable: 'Multiple License Keys Present',
          heading: 'Multiple License Keys Present',
          message: 'There are multiple license key files present on your USB flash device and none of them correspond to the USB Flash boot device. Please remove all key files, except the one you want to replace, from the /config directory on your USB Flash boot device. Alternately you may purchase a license key for this USB flash device. If you want to replace one of your license keys with a new key bound to this USB Flash device, please first remove all other key files first.',
          // signInToFix: true, // @todo is this needed?
        };
      case 'ENOKEYFILE2':
        return {
          actions: [
            ...(!registered.value ? [signInAction] : []),
            ...([purchaseAction, redeemAction]),
            ...(registered.value ? [recoverAction, signOutAction] : []),
          ],
          error: true,
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
          error: true,
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
          error: true,
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
          error: true,
          humanReadable: 'No Flash',
          heading: 'Cannot access your USB Flash boot device',
          message: 'There is a physical problem accessing your USB Flash boot device',
        };
      case 'EBLACKLISTED':
        return {
          error: true,
          humanReadable: 'BLACKLISTED',
          heading: 'Blacklisted USB Flash GUID',
          message: 'This USB Flash boot device has been blacklisted. This can occur as a result of transferring your license key to a replacement USB Flash device, and you are currently booted from your old USB Flash device. A USB Flash device may also be blacklisted if we discover the serial number is not unique – this is common with USB card readers.',
        };
      case 'EBLACKLISTED1':
        return {
          error: true,
          humanReadable: 'BLACKLISTED',
          heading: 'USB Flash device error',
          message: 'This USB Flash device has an invalid GUID. Please try a different USB Flash device',
        };
      case 'EBLACKLISTED2':
        return {
          error: true,
          humanReadable: 'BLACKLISTED',
          heading: 'USB Flash has no serial number',
          message: 'This USB Flash boot device has been blacklisted. This can occur as a result of transferring your license key to a replacement USB Flash device, and you are currently booted from your old USB Flash device. A USB Flash device may also be blacklisted if we discover the serial number is not unique – this is common with USB card readers.',
        };
      case 'ENOCONN':
        return {
          error: true,
          humanReadable: 'Trial Requires Internet Connection',
          heading: 'Cannot validate Unraid Trial key',
          message: 'Your Trial key requires an internet connection. Please check Settings > Network',
        };
      default:
        return {
          error: true,
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
    console.debug('[setServer] data', data);
    if (typeof data?.apiKey !== 'undefined') apiKey.value = data.apiKey;
    if (typeof data?.avatar !== 'undefined') avatar.value = data.avatar;
    if (typeof data?.csrf !== 'undefined') csrf.value = data.csrf;
    if (typeof data?.description !== 'undefined') description.value = data.description;
    if (typeof data?.deviceCount !== 'undefined') deviceCount.value = data.deviceCount;
    if (typeof data?.email !== 'undefined') email.value = data.email;
    if (typeof data?.expireTime !== 'undefined') expireTime.value = data.expireTime;
    if (typeof data?.flashProduct !== 'undefined') flashProduct.value = data.flashProduct;
    if (typeof data?.flashVendor !== 'undefined') flashVendor.value = data.flashVendor;
    if (typeof data?.guid !== 'undefined') guid.value = data.guid;
    if (typeof data?.keyfile !== 'undefined') keyfile.value = data.keyfile;
    if (typeof data?.lanIp !== 'undefined') lanIp.value = data.lanIp;
    if (typeof data?.license !== 'undefined') license.value = data.license;
    if (typeof data?.locale !== 'undefined') locale.value = data.locale;
    if (typeof data?.name !== 'undefined') name.value = data.name;
    if (typeof data?.pluginInstalled !== 'undefined') pluginInstalled.value = data.pluginInstalled;
    if (typeof data?.registered !== 'undefined') registered.value = data.registered;
    if (typeof data?.regGen !== 'undefined') regGen.value = data.regGen;
    if (typeof data?.regGuid !== 'undefined') regGuid.value = data.regGuid;
    if (typeof data?.site !== 'undefined') site.value = data.site;
    if (typeof data?.state !== 'undefined') state.value = data.state;
    if (typeof data?.theme !== 'undefined') theme.value = data.theme;
    if (typeof data?.uptime !== 'undefined') uptime.value = data.uptime;
    if (typeof data?.username !== 'undefined') username.value = data.username;
    if (typeof data?.wanFQDN !== 'undefined') wanFQDN.value = data.wanFQDN;
    console.debug('[setServer] server.value', server.value);
  };

  watch(theme, () => {
    if (theme.value) themeStore.setTheme(theme.value);
  });

  return {
    // state
    apiKey,
    avatar,
    csrf,
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
    theme,
    uptime,
    username,
    // getters
    authAction,
    isRemoteAccess,
    keyActions,
    pluginOutdated,
    server,
    serverAccountPayload,
    serverPurchasePayload,
    stateData,
    // actions
    setServer,
  };
});
