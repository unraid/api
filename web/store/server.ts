/**
 * @todo Check OS and Connect Plugin versions against latest via API every session
*/
import dayjs from 'dayjs';
import { defineStore, createPinia, setActivePinia } from 'pinia';
import prerelease from 'semver/functions/prerelease';
import {
  ArrowRightOnRectangleIcon,
  CogIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  KeyIcon,
  QuestionMarkCircleIcon
} from '@heroicons/vue/24/solid';
import { useQuery } from '@vue/apollo-composable';

import { SERVER_CLOUD_FRAGMENT, SERVER_STATE_QUERY } from './server.fragment';
import { useFragment } from '~/composables/gql/fragment-masking';
import { WebguiState, WebguiUpdateIgnore } from '~/composables/services/webgui';
import { WEBGUI_SETTINGS_MANAGMENT_ACCESS } from '~/helpers/urls';
import { useAccountStore } from '~/store/account';
import { useErrorsStore, type Error } from '~/store/errors';
import { usePurchaseStore } from '~/store/purchase';
import { useThemeStore, type Theme } from '~/store/theme';
import { useUnraidApiStore } from '~/store/unraidApi';

import type { Config, PartialCloudFragment, serverStateQuery } from '~/composables/gql/graphql';
import type {
  Server,
  ServerAccountCallbackSendPayload,
  ServerKeyTypeForPurchase,
  ServerPurchaseCallbackSendPayload,
  ServerState,
  ServerStateData,
  ServerStateDataAction,
  ServerconnectPluginInstalled,
  ServerDateTimeFormat,
  ServerStateDataKeyActions,
  ServerOsVersionBranch,
  ServerUpdateOsResponse,
} from '~/types/server';

/**
 * @see https://stackoverflow.com/questions/73476371/using-pinia-with-vue-js-web-components
 * @see https://github.com/vuejs/pinia/discussions/1085
 */
setActivePinia(createPinia());

export const useServerStore = defineStore('server', () => {
  const accountStore = useAccountStore();
  const errorsStore = useErrorsStore();
  const purchaseStore = usePurchaseStore();
  const themeStore = useThemeStore();
  const unraidApiStore = useUnraidApiStore();
  /**
   * State
   */
  const apiKey = ref<string>('');
  watch(apiKey, (newVal, oldVal) => {
    if (newVal) {
      return unraidApiStore.createApolloClient();
    }
    if (oldVal) {
      return unraidApiStore.closeUnraidApiClient();
    }
  });
  const apiVersion = ref<string>('');
  const avatar = ref<string>(''); // @todo potentially move to a user store
  const caseModel = ref<string>('');
  const cloud = ref<PartialCloudFragment | undefined>();
  const config = ref<Config | undefined>();
  const connectPluginInstalled = ref<ServerconnectPluginInstalled>('');
  const connectPluginVersion = ref<string>('');
  const csrf = ref<string>(''); // required to make requests to Unraid webgui
  const dateTimeFormat = ref<ServerDateTimeFormat | undefined>();
  const description = ref<string>('');
  const deviceCount = ref<number>(0);
  const email = ref<string>('');
  const expireTime = ref<number>(0);
  const flashBackupActivated = ref<boolean>(false);
  const flashProduct = ref<string>('');
  const flashVendor = ref<string>('');
  const guid = ref<string>('');
  const guidBlacklisted = ref<boolean>();
  const guidRegistered = ref<boolean>();
  const guidReplaceable = ref<boolean | undefined>();
  const inIframe = ref<boolean>(window.self !== window.top);
  const keyfile = ref<string>('');
  const lanIp = ref<string>('');
  const license = ref<string>('');
  const locale = ref<string>('');
  const name = ref<string>('');
  const osVersion = ref<string>('');
  const osVersionBranch = ref<ServerOsVersionBranch>('stable');
  const rebootType = ref<'thirdPartyDriversDownloading' | 'downgrade' | 'update' | ''>('');
  const rebootVersion = ref<string | undefined>();
  const registered = ref<boolean>();
  const regDev = ref<number>(0);
  const regGen = ref<number>(0);
  const regGuid = ref<string>('');
  const regTm = ref<number>(0);
  const regTo = ref<string>('');
  const regTy = ref<string>('');
  const regExp = ref<number>(0);
  const parsedRegExp = computed(() => regExp.value ? dayjs(regExp.value).format('YYYY-MM-DD') : null);
  const regUpdatesExpired = computed(() => {
    if (!regExp.value) { return false; }
    const today = dayjs();
    const parsedUpdateExpirationDate = dayjs(regExp.value);

    return today.isAfter(parsedUpdateExpirationDate, 'day');
  });
  const site = ref<string>('');
  const state = ref<ServerState>();
  const theme = ref<Theme>();
  watch(theme, (newVal) => {
    if (newVal) { themeStore.setTheme(newVal); }
  });
  const updateOsResponse = ref<ServerUpdateOsResponse>();
  const updateOsIgnoredReleases = ref<string[]>([]);
  const updateOsNotificationsEnabled = ref<boolean>(false);
  const uptime = ref<number>(0);
  const username = ref<string>(''); // @todo potentially move to a user store
  const wanFQDN = ref<string>('');
  const combinedKnownOrigins = ref<string[]>([]);

  const apiServerStateRefresh = ref<any>(null);
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

  const isOsVersionStable = computed(() => {
    const hasPrerelease = prerelease(osVersion.value);
    return !hasPrerelease;
  }); // used to determine if we should look for stable or next releases

  const server = computed(():Server => {
    return {
      apiKey: apiKey.value,
      apiVersion: apiVersion.value,
      avatar: avatar.value,
      connectPluginVersion: connectPluginVersion.value,
      connectPluginInstalled: connectPluginInstalled.value,
      description: description.value,
      deviceCount: deviceCount.value,
      email: email.value,
      expireTime: expireTime.value,
      flashProduct: flashProduct.value,
      flashVendor: flashVendor.value,
      guid: guid.value,
      inIframe: inIframe.value,
      keyfile: keyfile.value,
      lanIp: lanIp.value,
      license: license.value,
      locale: locale.value,
      name: name.value,
      osVersion: osVersion.value,
      osVersionBranch: osVersionBranch.value,
      registered: registered.value,
      regDev: regDev.value,
      regGen: regGen.value,
      regGuid: regGuid.value,
      regExp: regExp.value,
      regUpdatesExpired: regUpdatesExpired.value,
      site: site.value,
      state: state.value,
      theme: theme.value,
      uptime: uptime.value,
      username: username.value,
      wanFQDN: wanFQDN.value,
    };
  });

  const serverPurchasePayload = computed((): ServerPurchaseCallbackSendPayload => {
    /** @todo refactor out. Just parse state on craft site to determine */
    let keyTypeForPurchase: ServerKeyTypeForPurchase = 'Trial';
    switch (state.value) {
      case 'BASIC':
        keyTypeForPurchase = 'Basic';
        break;
      case 'PLUS':
        keyTypeForPurchase = 'Plus';
        break;
      case 'PRO':
        keyTypeForPurchase = 'Pro';
        break;
      case 'STARTER':
        keyTypeForPurchase = 'Starter';
        break;
      case 'UNLEASHED':
        keyTypeForPurchase = 'Unleashed';
        break;
    }
    const server = {
      apiVersion: apiVersion.value,
      connectPluginVersion: connectPluginVersion.value,
      deviceCount: deviceCount.value,
      email: email.value,
      guid: guid.value,
      inIframe: inIframe.value,
      keyTypeForPurchase,
      locale: locale.value,
      osVersion: osVersion.value,
      osVersionBranch: osVersionBranch.value,
      registered: registered.value ?? false,
      regExp: regExp.value,
      regTy: regTy.value,
      regUpdatesExpired: regUpdatesExpired.value,
      state: state.value,
      site: site.value,
    };
    return server;
  });

  const serverAccountPayload = computed((): ServerAccountCallbackSendPayload => {
    return {
      apiVersion: apiVersion.value,
      caseModel: caseModel.value,
      connectPluginVersion: connectPluginVersion.value,
      description: description.value,
      expireTime: expireTime.value,
      flashProduct: flashProduct.value,
      flashVendor: flashVendor.value,
      guid: guid.value,
      inIframe: inIframe.value,
      keyfile: keyfile.value,
      lanIp: lanIp.value,
      name: name.value,
      osVersion: osVersion.value,
      osVersionBranch: osVersionBranch.value,
      registered: registered.value ?? false,
      regGuid: regGuid.value,
      regExp: regExp.value,
      regTy: regTy.value,
      regUpdatesExpired: regUpdatesExpired.value,
      site: site.value,
      state: state.value,
      wanFQDN: wanFQDN.value,
    };
  });

  const serverDebugPayload = computed((): Server => {
    const payload = {
      apiKey: apiKey.value && typeof apiKey.value === 'string' ? `${apiKey.value.substring(0, 6)}__[REDACTED]` : '', // so we don't send full api key in email
      apiVersion: apiVersion.value,
      avatar: avatar.value,
      connectPluginInstalled: connectPluginInstalled.value,
      connectPluginVersion: connectPluginVersion.value,
      description: description.value,
      deviceCount: deviceCount.value,
      email: email.value,
      expireTime: expireTime.value,
      flashProduct: flashProduct.value,
      flashVendor: flashVendor.value,
      guid: guid.value,
      inIframe: inIframe.value,
      lanIp: lanIp.value,
      locale: locale.value,
      name: name.value,
      osVersion: osVersion.value,
      osVersionBranch: osVersionBranch.value,
      registered: registered.value,
      regGen: regGen.value,
      regGuid: regGuid.value,
      regTy: regTy.value,
      site: site.value,
      state: state.value,
      uptime: uptime.value,
      username: username.value,
      wanFQDN: wanFQDN.value,
    };
    // remove any empty values from object
    return Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== null && v !== undefined && v !== ''));
  });

  const serverActionsDisable = computed(() => {
    const disable = !!(connectPluginInstalled.value && (unraidApiStore.unraidApiStatus !== 'online' || unraidApiStore.prioritizeCorsError));
    return {
      disable,
      title: disable ? 'Requires the local unraid-api to be running successfully' : '',
    };
  });

  const purchaseAction = computed((): ServerStateDataAction => {
    return {
      click: () => { purchaseStore.purchase(); },
      disabled: serverActionsDisable.value.disable,
      external: true,
      icon: KeyIcon,
      name: 'purchase',
      text: 'Purchase Key',
      title: serverActionsDisable.value.title,
    };
  });
  const upgradeAction = computed((): ServerStateDataAction => {
    return {
      click: () => { purchaseStore.upgrade(); },
      disabled: serverActionsDisable.value.disable,
      external: true,
      icon: KeyIcon,
      name: 'upgrade',
      text: 'Upgrade Key',
      title: serverActionsDisable.value.title,
    };
  });
  const recoverAction = computed((): ServerStateDataAction => {
    return {
      click: () => { accountStore.recover(); },
      disabled: serverActionsDisable.value.disable,
      external: true,
      icon: KeyIcon,
      name: 'recover',
      text: 'Recover Key',
      title: serverActionsDisable.value.title,
    };
  });
  const redeemAction = computed((): ServerStateDataAction => {
    return {
      click: () => { purchaseStore.redeem(); },
      disabled: serverActionsDisable.value.disable,
      external: true,
      icon: KeyIcon,
      name: 'redeem',
      text: 'Redeem Activation Code',
      title: serverActionsDisable.value.title,
    };
  });
  const renewAction = computed((): ServerStateDataAction => {
    return {
      click: () => { purchaseStore.renew(); },
      disabled: serverActionsDisable.value.disable,
      external: true,
      icon: KeyIcon,
      name: 'renew',
      text: 'Extend License to Enable OS Updates',
      title: serverActionsDisable.value.title,
    };
  });
  const replaceAction = computed((): ServerStateDataAction => {
    return {
      click: () => { accountStore.replace(); },
      external: true,
      icon: KeyIcon,
      name: 'replace',
      text: 'Replace Key',
    };
  });
  const signInAction = computed((): ServerStateDataAction => {
    return {
      click: () => { accountStore.signIn(); },
      disabled: serverActionsDisable.value.disable,
      external: true,
      icon: GlobeAltIcon,
      name: 'signIn',
      text: 'Sign In with Unraid.net Account',
      title: serverActionsDisable.value.title,
    };
  });
  /**
   * The Sign Out action is a computed property because it depends on the state of the keyfile & unraid-api being online
   */
  const signOutAction = computed((): ServerStateDataAction => {
    const disabled: boolean = !keyfile.value || serverActionsDisable.value.disable;
    let title = '';
    if (!keyfile.value) {
      title = 'Sign Out requires a keyfile';
    }
    if (serverActionsDisable.value.disable) {
      title = serverActionsDisable.value.title;
    }
    return {
      click: () => { accountStore.signOut(); },
      disabled,
      external: true,
      icon: ArrowRightOnRectangleIcon,
      name: 'signOut',
      text: 'Sign Out of Unraid.net',
      title,
    };
  });
  const trialExtendAction = computed((): ServerStateDataAction => {
    return {
      click: () => { accountStore.trialExtend(); },
      disabled: serverActionsDisable.value.disable,
      external: true,
      icon: KeyIcon,
      name: 'trialExtend',
      text: 'Extend Trial',
      title: serverActionsDisable.value.title,
    };
  });
  const trialStartAction = computed((): ServerStateDataAction => {
    return {
      click: () => { accountStore.trialStart(); },
      disabled: serverActionsDisable.value.disable,
      external: true,
      icon: KeyIcon,
      name: 'trialStart',
      text: 'Start Free 30 Day Trial',
      title: serverActionsDisable.value.title,
    };
  });

  let messageEGUID = '';
  const stateData = computed(():ServerStateData => {
    switch (state.value) {
      case 'ENOKEYFILE':
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...([purchaseAction.value, redeemAction.value, trialStartAction.value, recoverAction.value]),
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          humanReadable: 'No Keyfile',
          heading: 'Let\'s Unleash your Hardware!',
          message: '<p>Your server will not be usable until you purchase a Registration key or install a free 30 day <em>Trial</em> key. A <em>Trial</em> key provides all the functionality of a Pro Registration key.</p><p>Registration keys are bound to your USB Flash boot device serial number (GUID). Please use a high quality name brand device at least 1GB in size.</p><p>Note: USB memory card readers are generally not supported because most do not present unique serial numbers.</p><p><strong>Important:</strong></p><ul class=\'list-disc pl-16px\'><li>Please make sure your server time is accurate to within 5 minutes</li><li>Please make sure there is a DNS server specified</li></ul>',
        };
      case 'TRIAL':
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...([purchaseAction.value, redeemAction.value]),
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          humanReadable: 'Trial',
          heading: 'Thank you for choosing Unraid OS!',
          message: '<p>Your <em>Trial</em> key includes all the functionality and device support of a <em>Pro</em> key.</p><p>After your <em>Trial</em> has reached expiration, your server <strong>still functions normally</strong> until the next time you Stop the array or reboot your server.</p><p>At that point you may either purchase a license key or request a <em>Trial</em> extension.</p>',
        };
      case 'EEXPIRED':
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...([purchaseAction.value, redeemAction.value]),
            ...(trialExtensionEligible.value ? [trialExtendAction.value] : []),
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          error: true,
          humanReadable: 'Trial Expired',
          heading: 'Your Trial has expired',
          message: trialExtensionEligible.value
            ? '<p>To continue using Unraid OS you may purchase a license key. Alternately, you may request a Trial extension.</p>'
            : '<p>You have used all your Trial extensions. To continue using Unraid OS you may purchase a license key.</p>',
        };
      case 'BASIC':
      case 'STARTER':
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...(regUpdatesExpired.value ? [renewAction.value] : []),
            ...([upgradeAction.value]),
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          humanReadable: 'Starter',
          heading: 'Thank you for choosing Unraid OS!',
          message: !registered.value && connectPluginInstalled.value
            ? '<p>Register for Connect by signing in to your Unraid.net account</p>'
            : guidRegistered.value
              ? '<p>To support more storage devices as your server grows, click Upgrade Key.</p>'
              : '',
        };
      case 'PLUS':
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...([upgradeAction.value]),
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          humanReadable: 'Plus',
          heading: 'Thank you for choosing Unraid OS!',
          message: !registered.value && connectPluginInstalled.value
            ? '<p>Register for Connect by signing in to your Unraid.net account</p>'
            : guidRegistered.value
              ? '<p>To support more storage devices as your server grows, click Upgrade Key.</p>'
              : '',
        };
      case 'PRO':
      case 'LIFETIME':
      case 'UNLEASHED':
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...(regUpdatesExpired.value ? [renewAction.value] : []),
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          humanReadable: 'Unleashed',
          heading: 'Thank you for choosing Unraid OS!',
          message: !registered.value && connectPluginInstalled.value
            ? '<p>Register for Connect by signing in to your Unraid.net account</p>'
            : '',
        };
      case 'EGUID':
        if (guidReplaceable.value) {
          messageEGUID = '<p>Your Unraid registration key is ineligible for replacement as it has been replaced within the last 12 months.</p>';
        } else if (guidReplaceable.value === false && guidBlacklisted.value) {
          messageEGUID = '<p>The license key file does not correspond to the USB Flash boot device. Please copy the correct key file to the /config directory on your USB Flash boot device or choose Purchase Key.</p><p>Your Unraid registration key is ineligible for replacement as it is blacklisted.</p>';
        } else if (guidReplaceable.value === false && !guidBlacklisted.value) {
          messageEGUID = '<p>The license key file does not correspond to the USB Flash boot device. Please copy the correct key file to the /config directory on your USB Flash boot device or choose Purchase Key.</p><p>Your Unraid registration key is ineligible for replacement as it has been replaced within the last 12 months.</p>';
        } else { // basically guidReplaceable.value === null
          messageEGUID = '<p>The license key file does not correspond to the USB Flash boot device. Please copy the correct key file to the /config directory on your USB Flash boot device.</p><p>You may also attempt to Purchase or Replace your key.</p>';
        }
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...([replaceAction.value, purchaseAction.value, redeemAction.value]),
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          error: true,
          humanReadable: 'Flash GUID Error',
          heading: 'Registration key / USB Flash GUID mismatch',
          message: messageEGUID,
        };
      case 'EGUID1':
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...([purchaseAction.value, redeemAction.value]),
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          error: true,
          humanReadable: 'Multiple License Keys Present',
          heading: 'Multiple License Keys Present',
          message: '<p>There are multiple license key files present on your USB flash device and none of them correspond to the USB Flash boot device. Please remove all key files, except the one you want to replace, from the /config directory on your USB Flash boot device.</p><p>Alternately you may purchase a license key for this USB flash device.</p><p>If you want to replace one of your license keys with a new key bound to this USB Flash device, please first remove all other key files first.</p>',
          // signInToFix: true, // @todo is this needed?
        };
      case 'ENOKEYFILE2':
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...([recoverAction.value, purchaseAction.value, redeemAction.value]),
            ...(registered.value ? [signOutAction.value] : []),
          ],
          error: true,
          humanReadable: 'Missing key file',
          heading: 'Missing key file',
          message: connectPluginInstalled.value
            ? '<p>Your license key file is corrupted or missing. The key file should be located in the /config directory on your USB Flash boot device.</p><p>You may attempt to recover your key with your Unraid.net account.</p><p>If this was an expired Trial installation, you may purchase a license key.</p>'
            : '<p>Your license key file is corrupted or missing. The key file should be located in the /config directory on your USB Flash boot device.</p><p>If you do not have a backup copy of your license key file you may attempt to recover your key.</p><p>If this was an expired Trial installation, you may purchase a license key.</p>',
        };
      case 'ETRIAL':
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...([purchaseAction.value, redeemAction.value]),
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          error: true,
          humanReadable: 'Invalid installation',
          heading: 'Invalid installation',
          message: '<p>It is not possible to use a Trial key with an existing Unraid OS installation.</p><p>You may purchase a license key corresponding to this USB Flash device to continue using this installation.</p>',
        };
      case 'ENOKEYFILE1':
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...([purchaseAction.value, redeemAction.value]),
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          error: true,
          humanReadable: 'No Keyfile',
          heading: 'No USB flash configuration data',
          message: '<p>There is a problem with your USB Flash device</p>',
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
          message: '<p>There is a physical problem accessing your USB Flash boot device</p>',
        };
      case 'EBLACKLISTED':
        return {
          error: true,
          humanReadable: 'BLACKLISTED',
          heading: 'Blacklisted USB Flash GUID',
          message: '<p>This USB Flash boot device has been blacklisted. This can occur as a result of transferring your license key to a replacement USB Flash device, and you are currently booted from your old USB Flash device.</p><p>A USB Flash device may also be blacklisted if we discover the serial number is not unique – this is common with USB card readers.</p>',
        };
      case 'EBLACKLISTED1':
        return {
          error: true,
          humanReadable: 'BLACKLISTED',
          heading: 'USB Flash device error',
          message: '<p>This USB Flash device has an invalid GUID. Please try a different USB Flash device</p>',
        };
      case 'EBLACKLISTED2':
        return {
          error: true,
          humanReadable: 'BLACKLISTED',
          heading: 'USB Flash has no serial number',
          message: '<p>This USB Flash boot device has been blacklisted. This can occur as a result of transferring your license key to a replacement USB Flash device, and you are currently booted from your old USB Flash device.</p><p>A USB Flash device may also be blacklisted if we discover the serial number is not unique – this is common with USB card readers.</p>',
        };
      case 'ENOCONN':
        return {
          error: true,
          humanReadable: 'Trial Requires Internet Connection',
          heading: 'Cannot validate Unraid Trial key',
          message: '<p>Your Trial key requires an internet connection.</p><p><a href="/Settings/NetworkSettings" class="underline">Please check Settings > Network</a></p>',
        };
      default:
        return {
          error: true,
          humanReadable: 'Stale',
          heading: 'Stale Server',
          message: '<p>Please refresh the page to ensure you load your latest configuration</p>',
        };
    }
  });

  const stateDataError = computed((): Error | undefined => {
    if (!stateData.value?.error) { return undefined; }
    return {
      actions: [
        {
          click: () => {
            errorsStore.openTroubleshoot({
              email: email.value,
              includeUnraidApiLogs: !!connectPluginInstalled.value,
            });
          },
          icon: QuestionMarkCircleIcon,
          text: 'Contact Support',
        },
      ],
      debugServer: serverDebugPayload.value,
      heading: stateData.value?.heading ?? '',
      level: 'error',
      message: stateData.value?.message ?? '',
      ref: `stateDataError__${state.value}`,
      type: 'serverState',
    };
  });
  watch(stateDataError, (newVal, oldVal) => {
    if (oldVal && oldVal.ref) { errorsStore.removeErrorByRef(oldVal.ref); }
    if (newVal) { errorsStore.setError(newVal); }
  });

  const authActionsNames = ['signIn', 'signOut'];
  // Extract sign in / out from actions so we can display seperately as needed
  const authAction = computed((): ServerStateDataAction | undefined => {
    if (!stateData.value.actions) { return; }
    return stateData.value.actions.find(action => authActionsNames.includes(action.name));
  });
  // Remove sign in / out from actions so we can display them separately
  const keyActions = computed((): ServerStateDataAction[] | undefined => {
    if (!stateData.value.actions) { return; }
    return stateData.value.actions.filter(action => !authActionsNames.includes(action.name));
  });
  const trialExtensionEligible = computed(() => !regGen.value || regGen.value < 2);

  const tooManyDevices = computed((): Error | undefined => {
    if ((deviceCount.value !== 0 && regDev.value !== 0 && deviceCount.value > regDev.value) ||
        (!config.value?.valid && config.value?.error === 'INVALID')) {
      return {
        heading: 'Too Many Devices',
        level: 'error',
        message: 'You have exceeded the number of devices allowed for your license. Please remove a device before adding another.',
        ref: 'tooManyDevices',
        type: 'server',
      };
    }
    return undefined;
  });
  watch(tooManyDevices, (newVal, oldVal) => {
    if (oldVal && oldVal.ref) { errorsStore.removeErrorByRef(oldVal.ref); }
    if (newVal) { errorsStore.setError(newVal); }
  });

  const pluginInstallFailed = computed((): Error | undefined => {
    if (connectPluginInstalled.value && connectPluginInstalled.value.includes('_installFailed')) {
      return {
        actions: [
          {
            external: true,
            href: 'https://forums.unraid.net/topic/112073-my-servers-releases/#comment-1154449',
            icon: InformationCircleIcon,
            text: 'Learn More',
          },
        ],
        heading: 'Unraid Connect Install Failed',
        level: 'error',
        message: 'Rebooting will likely solve this.',
        ref: 'pluginInstallFailed',
        type: 'server',
      };
    }
    return undefined;
  });
  watch(pluginInstallFailed, (newVal, oldVal) => {
    if (oldVal && oldVal.ref) { errorsStore.removeErrorByRef(oldVal.ref); }
    if (newVal) { errorsStore.setError(newVal); }
  });

  /**
   * Deprecation warning for [hash].unraid.net SSL certs. Deprecation started 2023-01-01
   */
  const deprecatedUnraidSSL = ref<Error | undefined>(
    (window.location.hostname.includes('localhost')
      ? {
          actions: [
            {
              href: WEBGUI_SETTINGS_MANAGMENT_ACCESS.toString(),
              icon: CogIcon,
              text: 'Go to Management Access Now',
            },
            {
              external: true,
              href: 'https://unraid.net/blog/ssl-certificate-update',
              icon: InformationCircleIcon,
              text: 'Learn More',
            },
          ],
          forumLink: true,
          heading: 'SSL certificates for unraid.net deprecated',
          level: 'error',
          message: 'On January 1st, 2023 SSL certificates for unraid.net were deprecated. You MUST provision a new SSL certificate to use our new myunraid.net domain. You can do this on the Settings > Management Access page.',
          ref: 'deprecatedUnraidSSL',
          type: 'server',
        }
      : undefined));
  watch(deprecatedUnraidSSL, (newVal, oldVal) => {
    if (oldVal && oldVal.ref) { errorsStore.removeErrorByRef(oldVal.ref); }
    if (newVal) { errorsStore.setError(newVal); }
  });

  const cloudError = computed((): Error | undefined => {
    // if we're not registered or we're in the process of signing out then the cloud error should be ignored
    if (!registered.value ||
      !cloud.value?.error ||
      accountStore.accountActionType === 'signOut' ||
      accountStore.accountActionType === 'oemSignOut'
    ) {
      return;
    }
    // otherwise if we are we should display any cloud errors
    return {
      actions: [
        {
          click: () => {
            errorsStore.openTroubleshoot({
              email: email.value,
              includeUnraidApiLogs: !!connectPluginInstalled.value,
            });
          },
          icon: QuestionMarkCircleIcon,
          text: 'Contact Support',
        },
      ],
      debugServer: serverDebugPayload.value,
      heading: 'Unraid Connect Error',
      level: 'error',
      message: cloud.value?.error ?? '',
      ref: 'cloudError',
      type: 'unraidApiState',
    };
  });
  watch(cloudError, (newVal, oldVal) => {
    if (oldVal && oldVal.ref) { errorsStore.removeErrorByRef(oldVal.ref); }
    if (newVal) { errorsStore.setError(newVal); }
  });

  const serverErrors = computed(() => {
    return [
      stateDataError.value,
      tooManyDevices.value,
      pluginInstallFailed.value,
      deprecatedUnraidSSL.value,
      cloudError.value,
    ].filter(Boolean);
  });
  /**
   * Actions
   */
  const setServer = (data: Server) => {
    console.debug('[setServer]', data);
    if (typeof data?.apiKey !== 'undefined') { apiKey.value = data.apiKey; }
    if (typeof data?.apiVersion !== 'undefined') { apiVersion.value = data.apiVersion; }
    if (typeof data?.avatar !== 'undefined') { avatar.value = data.avatar; }
    if (typeof data?.caseModel !== 'undefined') { caseModel.value = data.caseModel; }
    if (typeof data?.cloud !== 'undefined') { cloud.value = data.cloud; }
    if (typeof data?.combinedKnownOrigins !== 'undefined') { combinedKnownOrigins.value = data.combinedKnownOrigins; }
    if (typeof data?.config !== 'undefined') { config.value = data.config; }
    if (typeof data?.connectPluginInstalled !== 'undefined') { connectPluginInstalled.value = data.connectPluginInstalled; }
    if (typeof data?.connectPluginVersion !== 'undefined') { connectPluginVersion.value = data.connectPluginVersion; }
    if (typeof data?.csrf !== 'undefined') { csrf.value = data.csrf; }
    if (typeof data?.dateTimeFormat !== 'undefined') { dateTimeFormat.value = data.dateTimeFormat; }
    if (typeof data?.description !== 'undefined') { description.value = data.description; }
    if (typeof data?.deviceCount !== 'undefined') { deviceCount.value = data.deviceCount; }
    if (typeof data?.email !== 'undefined') { email.value = data.email; }
    if (typeof data?.expireTime !== 'undefined') { expireTime.value = data.expireTime; }
    if (typeof data?.flashBackupActivated !== 'undefined') { flashBackupActivated.value = data.flashBackupActivated; }
    if (typeof data?.flashProduct !== 'undefined') { flashProduct.value = data.flashProduct; }
    if (typeof data?.flashVendor !== 'undefined') { flashVendor.value = data.flashVendor; }
    if (typeof data?.guid !== 'undefined') { guid.value = data.guid; }
    if (typeof data?.keyfile !== 'undefined') { keyfile.value = data.keyfile; }
    if (typeof data?.lanIp !== 'undefined') { lanIp.value = data.lanIp; }
    if (typeof data?.license !== 'undefined') { license.value = data.license; }
    if (typeof data?.locale !== 'undefined') { locale.value = data.locale; }
    if (typeof data?.name !== 'undefined') { name.value = data.name; }
    if (typeof data?.osVersion !== 'undefined') { osVersion.value = data.osVersion; }
    if (typeof data?.osVersionBranch !== 'undefined') { osVersionBranch.value = data.osVersionBranch; }
    if (typeof data?.rebootType !== 'undefined') { rebootType.value = data.rebootType; }
    if (typeof data?.rebootVersion !== 'undefined') { rebootVersion.value = data.rebootVersion; }
    if (typeof data?.registered !== 'undefined') { registered.value = data.registered; }
    if (typeof data?.regGen !== 'undefined') { regGen.value = data.regGen; }
    if (typeof data?.regGuid !== 'undefined') { regGuid.value = data.regGuid; }
    if (typeof data?.regTy !== 'undefined') { regTy.value = data.regTy; }
    if (typeof data?.regExp !== 'undefined') { regExp.value = data.regExp; }
    if (typeof data?.site !== 'undefined') { site.value = data.site; }
    if (typeof data?.state !== 'undefined') { state.value = data.state; }
    if (typeof data?.theme !== 'undefined') { theme.value = data.theme; }
    if (typeof data?.updateOsIgnoredReleases !== 'undefined') { updateOsIgnoredReleases.value = data.updateOsIgnoredReleases; }
    if (typeof data?.updateOsNotificationsEnabled !== 'undefined') { updateOsNotificationsEnabled.value = data.updateOsNotificationsEnabled; }
    if (typeof data?.updateOsResponse !== 'undefined') { updateOsResponse.value = data.updateOsResponse; }
    if (typeof data?.uptime !== 'undefined') { uptime.value = data.uptime; }
    if (typeof data?.username !== 'undefined') { username.value = data.username; }
    if (typeof data?.wanFQDN !== 'undefined') { wanFQDN.value = data.wanFQDN; }
    if (typeof data?.regTm !== 'undefined') { regTm.value = data.regTm; }
    if (typeof data?.regTo !== 'undefined') { regTo.value = data.regTo; }
  };

  const setUpdateOsResponse = (response: ServerUpdateOsResponse) => {
    updateOsResponse.value = response;
  };

  const mutateServerStateFromApi = (data: serverStateQuery): Server => {
    console.debug('mutateServerStateFromApi', data);
    const mutatedData: Server = {
      // if we get an owners obj back and the username is root we don't want to overwrite the values
      ...(data.owner && data.owner.username !== 'root'
        ? {
          // avatar: data.owner.avatar,
            username: data.owner.username ?? '',
            registered: true,
          }
        : { // handles sign outs
          // avatar: data.owner.avatar,
            username: '',
            registered: false,
          }
      ),
      name: (data.info && data.info.os && data.info.os.hostname) ? data.info.os.hostname : undefined,
      keyfile: (data.registration && data.registration.keyFile && data.registration.keyFile.contents) ? data.registration.keyFile.contents : undefined,
      regGen: data.vars && data.vars.regGen ? parseInt(data.vars.regGen) : undefined,
      state: data.vars && data.vars.regState ? data.vars.regState : undefined,
      config: data.config
        ? data.config
        : {
            error: data.vars && data.vars.configError ? data.vars.configError : undefined,
            valid: data.vars && data.vars.configValid ? data.vars.configValid : true,
          },
      expireTime: (data.registration && data.registration.expiration) ? parseInt(data.registration.expiration) : 0,
      cloud: data.cloud ? useFragment(SERVER_CLOUD_FRAGMENT, data.cloud) : undefined,
      regExp: (data.registration && data.registration.updateExpiration) ? Number(data.registration.updateExpiration) : undefined,
    };
    console.debug('mutatedData', mutatedData);
    return mutatedData;
  };

  const fetchServerFromApi = () => {
    const { result: resultServerState, refetch: refetchServerState } = useQuery(SERVER_STATE_QUERY, null, {
      // pollInterval: 2500,
      fetchPolicy: 'no-cache',
    });
    const serverState = computed(() => resultServerState.value ?? null);
    apiServerStateRefresh.value = refetchServerState;
    watch(serverState, (value) => {
      if (value) {
        const mutatedServerStateResult = mutateServerStateFromApi(value);
        setServer(mutatedServerStateResult);
      }
    });
    return resultServerState;
  };

  const phpServerStateRefresh = async () => {
    try {
      const stateResponse: Server = await WebguiState
        .get()
        .json();
      setServer(stateResponse);
      return stateResponse;
    } catch (error) {
      console.error('[phpServerStateRefresh] error', error);
    }
  };

  let refreshCount = 0;
  const refreshLimit = 20;
  const refreshTimeout = 250;
  const refreshServerStateStatus = ref<'done' | 'ready' | 'refreshing' | 'timeout'>('ready');
  const refreshServerState = async () => {
    // If we've reached the refresh limit, stop refreshing
    if (refreshCount >= refreshLimit) {
      refreshServerStateStatus.value = 'timeout';
      return false;
    }

    refreshCount++;
    refreshServerStateStatus.value = 'refreshing';

    // Values to compare to response values should be set before the response is set
    const oldRegistered = registered.value;
    const oldState = state.value;
    const oldRegExp = regExp.value;

    const fromApi = !!apiServerStateRefresh.value;
    // Fetch the server state from the API or PHP
    const response = fromApi
      ? await apiServerStateRefresh.value()
      : await phpServerStateRefresh();
    if (!response) {
      return setTimeout(() => {
        refreshServerState();
      }, refreshTimeout);
    }

    // Extract the new values from the response
    const newRegistered = fromApi && response?.data ? response.data.owner.username !== 'root' : response.registered;
    const newState = fromApi && response?.data ? response.data.vars.regState : response.state;
    const newRegExp = fromApi && response?.data ? Number(response.data.registration.updateExpiration ?? 0) : response.regExp;
    // Compare the new values to the old values
    const registrationStatusChanged = oldRegistered !== newRegistered;
    const stateChanged = oldState !== newState;
    const regExpChanged = newRegExp > oldRegExp;

    // If the registration status or state changed, stop refreshing
    if (registrationStatusChanged || stateChanged || regExpChanged) {
      refreshServerStateStatus.value = 'done';
      return true;
    }
    // If we haven't reached the refresh limit, try again
    setTimeout(() => {
      return refreshServerState();
    }, refreshTimeout);
  };

  const filteredKeyActions = (filterType: 'by' | 'out', filters: string|ServerStateDataKeyActions[]): ServerStateDataAction[] | undefined => {
    if (!stateData.value.actions) { return; }

    return stateData.value.actions.filter((action) => {
      return filterType === 'out'
        ? !filters.includes(action.name as ServerStateDataKeyActions)
        : filters.includes(action.name as ServerStateDataKeyActions);
    });
  };

  const setRebootVersion = (version: string) => {
    rebootVersion.value = version;
  };

  watchEffect(() => {
    if (rebootVersion.value) {
      console.debug('[server.rebootVersion]', rebootVersion.value);
    }
  });

  const updateOsIgnoreRelease = (release: string) => {
    updateOsIgnoredReleases.value.push(release);
    const response = WebguiUpdateIgnore({
      action: 'ignoreVersion',
      version: release,
    });
    console.debug('[updateOsIgnoreRelease] response', response);
    /** @todo when update check modal is displayed and there's no available updates, allow users to remove ignored releases from the list */
  };

  const updateOsRemoveIgnoredRelease = (release: string) => {
    updateOsIgnoredReleases.value = updateOsIgnoredReleases.value.filter(r => r !== release);
    const response = WebguiUpdateIgnore({
      action: 'removeIgnoredVersion',
      version: release,
    });
    console.debug('[updateOsRemoveIgnoredRelease] response', response);
  };

  const updateOsRemoveAllIgnoredReleases = () => {
    updateOsIgnoredReleases.value = [];
    const response = WebguiUpdateIgnore({
      action: 'removeAllIgnored',
    });
    console.debug('[updateOsRemoveAllIgnoredReleases] response', response);
  };

  return {
    // state
    apiKey,
    avatar,
    cloud,
    config,
    connectPluginInstalled,
    csrf,
    dateTimeFormat,
    description,
    deviceCount,
    expireTime,
    flashBackupActivated,
    flashProduct,
    flashVendor,
    guid,
    keyfile,
    inIframe,
    locale,
    lanIp,
    name,
    osVersion,
    osVersionBranch,
    rebootType,
    rebootVersion,
    registered,
    regDev,
    regGen,
    regGuid,
    regTm,
    regTo,
    regTy,
    regExp,
    parsedRegExp,
    regUpdatesExpired,
    site,
    state,
    theme,
    updateOsIgnoredReleases,
    updateOsNotificationsEnabled,
    updateOsResponse,
    uptime,
    username,
    refreshServerStateStatus,
    isOsVersionStable,
    renewAction,
    // getters
    authAction,
    deprecatedUnraidSSL,
    isRemoteAccess,
    keyActions,
    pluginInstallFailed,
    pluginOutdated,
    server,
    serverAccountPayload,
    serverPurchasePayload,
    stateData,
    stateDataError,
    serverErrors,
    tooManyDevices,
    // actions
    setServer,
    setUpdateOsResponse,
    fetchServerFromApi,
    refreshServerState,
    filteredKeyActions,
    setRebootVersion,
    updateOsIgnoreRelease,
    updateOsRemoveIgnoredRelease,
    updateOsRemoveAllIgnoredReleases,
  };
});
