/**
 * @todo Check OS and Connect Plugin versions against latest via API every session
 */
import { computed, ref, toRefs, watch, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';
import { defineStore, storeToRefs } from 'pinia';
import { useLazyQuery } from '@vue/apollo-composable';

import {
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  KeyIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/vue/24/solid';
import {
  WEBGUI_SETTINGS_MANAGMENT_ACCESS,
  WEBGUI_TOOLS_REGISTRATION,
  WEBGUI_TOOLS_UPDATE,
} from '~/helpers/urls';
import dayjs from 'dayjs';
import prerelease from 'semver/functions/prerelease';

import type { ApolloQueryResult } from '@apollo/client/core/index.js';
import type { ServerActionTypes, ServerData } from '@unraid/shared-callbacks';
import type { Config, PartialCloudFragment, ServerStateQuery } from '~/composables/gql/graphql';
import type { Error } from '~/store/errors';
import type { Theme } from '~/themes/types';
import type {
  Server,
  ServerconnectPluginInstalled,
  ServerDateTimeFormat,
  ServerOsVersionBranch,
  ServerState,
  ServerStateArray,
  ServerStateData,
  ServerStateDataAction,
  ServerUpdateOsResponse,
} from '~/types/server';

import { useActivationCodeDataStore } from '~/components/Onboarding/store/activationCodeData';
import { useFragment } from '~/composables/gql/fragment-masking';
import { WebguiState, WebguiUpdateIgnore } from '~/composables/services/webgui';
import { useAccountStore } from '~/store/account';
import { useErrorsStore } from '~/store/errors';
import { usePurchaseStore } from '~/store/purchase';
import { CLOUD_STATE_QUERY, SERVER_CLOUD_FRAGMENT, SERVER_STATE_QUERY } from '~/store/server.fragment';
import { useThemeStore } from '~/store/theme';
import { useUnraidApiStore } from '~/store/unraidApi';

export const useServerStore = defineStore('server', () => {
  const { t } = useI18n();
  const accountStore = useAccountStore();
  const errorsStore = useErrorsStore();
  const purchaseStore = usePurchaseStore();
  const themeStore = useThemeStore();
  const unraidApiStore = useUnraidApiStore();
  const { activationCode } = storeToRefs(useActivationCodeDataStore());
  /**
   * State
   */
  const apiVersion = ref<string>('');
  const array = ref<ServerStateArray | undefined>();
  // helps to display warning next to array status
  const arrayWarning = computed(() => !!(stateDataError.value || serverConfigError.value));
  const computedArray = computed(() => {
    if (arrayWarning.value) {
      if (array.value?.state === 'Stopped') {
        return t('server.array.warning.stopped');
      }
      return t('server.array.warning.started');
    }
    return array.value?.state;
  });
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
  const regDevs = ref<number>(0); // use computedRegDevs to ensure it includes Basic, Plus, and Pro
  const computedRegDevs = computed(() => {
    if (regDevs.value > 0) {
      return regDevs.value;
    }

    switch (regTy.value) {
      case 'Starter':
      case 'Basic':
        return 6;
      case 'Plus':
        return 12;
      case 'Unleashed':
      case 'Lifetime':
      case 'Pro':
      case 'Trial':
        return -1; // unlimited
      default:
        return 0;
    }
  });
  const regGen = ref<number>(0);
  const regGuid = ref<string>('');
  const regTm = ref<number>(0);
  const regTo = ref<string>('');
  const regTy = ref<string>('');
  const regExp = ref<number>(0);
  const parsedRegExp = computed(() => (regExp.value ? dayjs(regExp.value).format('YYYY-MM-DD') : null));
  const regUpdatesExpired = computed(() => {
    if (!regExp.value) {
      return false;
    }
    const today = dayjs();
    const parsedUpdateExpirationDate = dayjs(regExp.value);

    return today.isAfter(parsedUpdateExpirationDate, 'day');
  });
  const site = ref<string>('');
  const ssoEnabled = ref<boolean>(false);
  const state = ref<ServerState>();
  const theme = ref<Theme>();
  watch(theme, (newVal) => {
    if (newVal) {
      themeStore.setTheme(newVal);
    }
  });
  const updateOsResponse = ref<ServerUpdateOsResponse>();
  const updateOsIgnoredReleases = ref<string[]>([]);
  const updateOsNotificationsEnabled = ref<boolean>(false);
  const uptime = ref<number>(0);
  const username = ref<string>(''); // @todo potentially move to a user store
  const wanFQDN = ref<string>('');
  const combinedKnownOrigins = ref<string[]>([]);
  const apiServerStateRefresh =
    ref<
      (
        variables?: Record<string, never> | undefined
      ) => Promise<ApolloQueryResult<ServerStateQuery> | undefined> | undefined
    >();

  /**
   * Getters
   */
  const isRemoteAccess = computed(
    () =>
      wanFQDN.value || (site.value && site.value.includes('www.') && site.value.includes('unraid.net'))
  );
  /**
   * @todo configure
   */
  const pluginOutdated = computed((): boolean => {
    return false;
  });

  const isOsVersionStable = computed(() => {
    const hasPrerelease = prerelease(osVersion.value);
    return !hasPrerelease;
  }); // used to determine if we should look for stable or next releases

  const server = computed((): Server => {
    return {
      apiVersion: apiVersion.value,
      array: array.value,
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
      rebootType: rebootType.value,
      rebootVersion: rebootVersion.value,
      registered: registered.value,
      regDevs: computedRegDevs.value,
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

  const serverPurchasePayload = computed((): ServerData => {
    const server: ServerData = {
      description: description.value,
      deviceCount: deviceCount.value,
      expireTime: expireTime.value,
      flashProduct: flashProduct.value,
      flashVendor: flashVendor.value,
      guid: guid.value,
      locale: locale.value,
      name: name.value,
      osVersion: osVersion.value,
      osVersionBranch: osVersionBranch.value,
      registered: registered.value ?? false,
      regExp: regExp.value,
      regGen: regGen.value,
      regGuid: regGuid.value,
      regTy: regTy.value,
      regUpdatesExpired: regUpdatesExpired.value,
      state: state.value,
      wanFQDN: wanFQDN.value,
    };
    return server;
  });

  const serverAccountPayload = computed((): ServerData => {
    return {
      deviceCount: deviceCount.value,
      description: description.value,
      expireTime: expireTime.value,
      flashProduct: flashProduct.value,
      flashVendor: flashVendor.value,
      guid: guid.value,
      keyfile: keyfile.value,
      locale: locale.value,
      name: name.value,
      osVersion: osVersion.value,
      osVersionBranch: osVersionBranch.value,
      registered: registered.value ?? false,
      regGen: regGen.value,
      regGuid: regGuid.value,
      regExp: regExp.value,
      regTy: regTy.value,
      regUpdatesExpired: regUpdatesExpired.value,
      state: state.value,
      wanFQDN: wanFQDN.value,
    };
  });

  const serverDebugPayload = computed((): Server => {
    const payload = {
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
      rebootType: rebootType.value,
      rebootVersion: rebootVersion.value,
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
    return Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== null && v !== undefined && v !== '')
    );
  });

  const serverActionsDisable = computed(() => {
    const disable = !!(
      connectPluginInstalled.value &&
      (unraidApiStore.unraidApiStatus !== 'online' || unraidApiStore.prioritizeCorsError)
    );
    return {
      disable,
      title: disable ? t('server.actions.disabledTitle') : '',
    };
  });

  const purchaseAction = computed((): ServerStateDataAction => {
    return {
      click: () => {
        purchaseStore.purchase();
      },
      disabled: serverActionsDisable.value.disable,
      external: true,
      icon: KeyIcon,
      name: 'purchase',
      text: t('server.actions.purchaseKey'),
      title: serverActionsDisable.value.title,
    };
  });
  const upgradeAction = computed((): ServerStateDataAction => {
    return {
      click: () => {
        purchaseStore.upgrade();
      },
      disabled: serverActionsDisable.value.disable,
      external: true,
      icon: KeyIcon,
      name: 'upgrade',
      text: t('server.actions.upgradeKey'),
      title: serverActionsDisable.value.title,
    };
  });
  const recoverAction = computed((): ServerStateDataAction => {
    return {
      click: () => {
        accountStore.recover();
      },
      disabled: serverActionsDisable.value.disable,
      external: true,
      icon: KeyIcon,
      name: 'recover',
      text: t('server.actions.recoverKey'),
      title: serverActionsDisable.value.title,
    };
  });
  const redeemAction = computed((): ServerStateDataAction => {
    const isPartnerActivationState =
      state.value === 'ENOKEYFILE' || state.value === 'TRIAL' || state.value === 'EEXPIRED';
    const shouldUsePartnerActivate = Boolean(activationCode.value?.code) && isPartnerActivationState;

    return {
      click: () => {
        if (shouldUsePartnerActivate) {
          purchaseStore.activate();
        } else {
          purchaseStore.redeem();
        }
      },
      disabled: serverActionsDisable.value.disable,
      external: true,
      icon: KeyIcon,
      name: shouldUsePartnerActivate ? 'activate' : 'redeem',
      text: shouldUsePartnerActivate
        ? t('registration.actions.activateLicense')
        : t('server.actions.redeemActivationCode'),
      title: serverActionsDisable.value.title,
    };
  });
  const renewAction = computed((): ServerStateDataAction => {
    return {
      click: () => {
        purchaseStore.renew();
      },
      disabled: serverActionsDisable.value.disable,
      external: true,
      icon: KeyIcon,
      name: 'renew',
      text: t('server.actions.extendLicenseForUpdates'),
      title: serverActionsDisable.value.title,
    };
  });
  const replaceAction = computed((): ServerStateDataAction => {
    return {
      click: () => {
        accountStore.replace();
      },
      external: true,
      icon: KeyIcon,
      name: 'replace',
      text: t('server.actions.replaceKey'),
    };
  });
  const signInAction = computed((): ServerStateDataAction => {
    return {
      click: () => {
        accountStore.signIn();
      },
      disabled: serverActionsDisable.value.disable,
      external: true,
      icon: GlobeAltIcon,
      name: 'signIn',
      text: t('server.actions.signIn'),
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
      title = t('server.actions.signOutRequiresKeyfile');
    }
    if (serverActionsDisable.value.disable) {
      title = serverActionsDisable.value.title;
    }
    return {
      click: () => {
        accountStore.signOut();
      },
      disabled,
      external: true,
      icon: ArrowRightOnRectangleIcon,
      name: 'signOut',
      text: t('server.actions.signOut'),
      title,
    };
  });
  const trialExtendAction = computed((): ServerStateDataAction => {
    return {
      click: () => {
        accountStore.trialExtend();
      },
      disabled: serverActionsDisable.value.disable,
      external: true,
      icon: KeyIcon,
      name: 'trialExtend',
      text: t('server.actions.extendTrial'),
      title: serverActionsDisable.value.title,
    };
  });
  const trialStartAction = computed((): ServerStateDataAction => {
    return {
      click: () => {
        accountStore.trialStart();
      },
      disabled: serverActionsDisable.value.disable,
      external: true,
      icon: KeyIcon,
      name: 'trialStart',
      text: t('server.actions.startTrial'),
      title: serverActionsDisable.value.title,
    };
  });

  let messageEGUID = '';
  let trialMessage = '';
  const shouldUsePartnerActivationOnly = computed(() => {
    const isPartnerActivationState =
      state.value === 'ENOKEYFILE' || state.value === 'TRIAL' || state.value === 'EEXPIRED';
    return Boolean(activationCode.value?.code) && isPartnerActivationState;
  });
  const stateData = computed((): ServerStateData => {
    switch (state.value) {
      case 'ENOKEYFILE':
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...(shouldUsePartnerActivationOnly.value
              ? [redeemAction.value, recoverAction.value, trialStartAction.value]
              : [redeemAction.value, trialStartAction.value, purchaseAction.value, recoverAction.value]),
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          humanReadable: t('server.state.enokeyfile.humanReadable'),
          heading: t('server.state.enokeyfile.heading'),
          message: t('server.state.enokeyfile.message'),
        };
      case 'TRIAL':
        if (trialExtensionEligibleInsideRenewalWindow.value) {
          trialMessage = t('server.state.trial.messageEligibleInsideRenewal');
        } else if (trialExtensionIneligibleInsideRenewalWindow.value) {
          trialMessage = t('server.state.trial.messageIneligibleInsideRenewal');
        } else if (trialExtensionEligibleOutsideRenewalWindow.value) {
          trialMessage = t('server.state.trial.messageEligibleOutsideRenewal');
        } else {
          // would be trialExtensionIneligibleOutsideRenewalWindow if it wasn't an else conditionally
          trialMessage = t('server.state.trial.messageIneligibleOutsideRenewal');
        }

        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...(shouldUsePartnerActivationOnly.value
              ? [redeemAction.value]
              : [redeemAction.value, purchaseAction.value]),
            ...(!shouldUsePartnerActivationOnly.value && trialExtensionEligibleInsideRenewalWindow.value
              ? [trialExtendAction.value]
              : []),
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          humanReadable: t('server.state.trial.humanReadable'),
          heading: t('server.headings.thankYou'),
          message: trialMessage,
        };
      case 'EEXPIRED':
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...(shouldUsePartnerActivationOnly.value
              ? [redeemAction.value]
              : [redeemAction.value, purchaseAction.value]),
            ...(trialExtensionEligible.value ? [trialExtendAction.value] : []),
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          error: true,
          humanReadable: t('server.state.trialExpired.humanReadable'),
          heading: t('server.state.trialExpired.heading'),
          message: trialExtensionEligible.value
            ? t('server.state.trialExpired.messageEligible')
            : t('server.state.trialExpired.messageIneligible'),
        };
      case 'BASIC':
      case 'STARTER':
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...(regUpdatesExpired.value ? [renewAction.value] : []),
            ...[upgradeAction.value],
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          humanReadable:
            state.value === 'BASIC'
              ? t('server.state.basic.humanReadable')
              : t('server.state.starter.humanReadable'),
          heading: t('server.headings.thankYou'),
          message:
            !registered.value && connectPluginInstalled.value
              ? t('server.state.shared.connectRegistrationPrompt')
              : guidRegistered.value
                ? t('server.state.shared.upgradeKeyPrompt')
                : '',
        };
      case 'PLUS':
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...[upgradeAction.value],
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          humanReadable: t('server.state.plus.humanReadable'),
          heading: t('server.headings.thankYou'),
          message:
            !registered.value && connectPluginInstalled.value
              ? t('server.state.shared.connectRegistrationPrompt')
              : guidRegistered.value
                ? t('server.state.shared.upgradeKeyPrompt')
                : '',
        };
      case 'PRO':
      case 'LIFETIME':
      case 'UNLEASHED':
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...(regUpdatesExpired.value ? [renewAction.value] : []),
            ...(state.value === 'UNLEASHED' ? [upgradeAction.value] : []),
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          humanReadable:
            state.value === 'PRO'
              ? t('server.state.pro.humanReadable')
              : state.value === 'LIFETIME'
                ? t('server.state.lifetime.humanReadable')
                : t('server.state.unleashed.humanReadable'),
          heading: t('server.headings.thankYou'),
          message:
            !registered.value && connectPluginInstalled.value
              ? t('server.state.shared.connectRegistrationPrompt')
              : '',
        };
      case 'EGUID':
        if (guidReplaceable.value) {
          messageEGUID = t('server.state.eguid.messageAlreadyReplaced');
        } else if (guidReplaceable.value === false && guidBlacklisted.value) {
          messageEGUID = t('server.state.eguid.messageBlacklisted');
        } else if (guidReplaceable.value === false && !guidBlacklisted.value) {
          messageEGUID = t('server.state.eguid.messageRecentReplacement');
        } else {
          // basically guidReplaceable.value === null
          messageEGUID = t('server.state.eguid.messageMismatch');
        }
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...[replaceAction.value, purchaseAction.value, redeemAction.value],
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          error: true,
          humanReadable: t('server.state.eguid.humanReadable'),
          heading: t('server.state.eguid.heading'),
          message: messageEGUID,
        };
      case 'EGUID1':
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...[purchaseAction.value, redeemAction.value],
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          error: true,
          humanReadable: t('server.state.eguid1.humanReadable'),
          heading: t('server.state.eguid1.heading'),
          message: t('server.state.eguid1.message'),
          // signInToFix: true, // @todo is this needed?
        };
      case 'ENOKEYFILE2':
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...[recoverAction.value, purchaseAction.value, redeemAction.value],
            ...(registered.value ? [signOutAction.value] : []),
          ],
          error: true,
          humanReadable: t('server.state.enokeyfile2.humanReadable'),
          heading: t('server.state.enokeyfile2.heading'),
          message: connectPluginInstalled.value
            ? t('server.state.enokeyfile2.messageWithConnect')
            : t('server.state.enokeyfile2.messageWithoutConnect'),
        };
      case 'ETRIAL':
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...[purchaseAction.value, redeemAction.value],
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          error: true,
          humanReadable: t('server.state.etrial.humanReadable'),
          heading: t('server.state.etrial.heading'),
          message: t('server.state.etrial.message'),
        };
      case 'ENOKEYFILE1':
        return {
          actions: [
            ...(!registered.value && connectPluginInstalled.value ? [signInAction.value] : []),
            ...[purchaseAction.value, redeemAction.value],
            ...(registered.value && connectPluginInstalled.value ? [signOutAction.value] : []),
          ],
          error: true,
          humanReadable: t('server.state.enokeyfile.humanReadable'),
          heading: t('server.state.enokeyfile1.heading'),
          message: t('server.state.enokeyfile1.message'),
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
          humanReadable: t('server.state.enoflash.humanReadable'),
          heading: t('server.state.enoflash.heading'),
          message: t('server.state.enoflash.message'),
        };
      case 'EBLACKLISTED':
        return {
          error: true,
          humanReadable: t('server.state.eblacklisted.humanReadable'),
          heading: t('server.state.eblacklisted.heading'),
          message: t('server.state.eblacklisted.message'),
        };
      case 'EBLACKLISTED1':
        return {
          error: true,
          humanReadable: t('server.state.eblacklisted.humanReadable'),
          heading: t('server.state.eblacklisted1.heading'),
          message: t('server.state.eblacklisted1.message'),
        };
      case 'EBLACKLISTED2':
        return {
          error: true,
          humanReadable: t('server.state.eblacklisted.humanReadable'),
          heading: t('server.state.eblacklisted2.heading'),
          message: t('server.state.eblacklisted.message'),
        };
      case 'ENOCONN':
        return {
          error: true,
          humanReadable: t('server.state.enoconn.humanReadable'),
          heading: t('server.state.enoconn.heading'),
          message: t('server.state.enoconn.message'),
        };
      default:
        return {
          error: true,
          humanReadable: t('server.state.default.humanReadable'),
          heading: t('server.state.default.heading'),
          message: t('server.state.default.message'),
        };
    }
  });

  const stateDataError = computed((): Error | undefined => {
    if (!stateData.value?.error) {
      return undefined;
    }
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
          text: t('server.actions.contactSupport'),
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
    if (oldVal && oldVal.ref) {
      errorsStore.removeErrorByRef(oldVal.ref);
    }
    if (newVal) {
      errorsStore.setError(newVal);
    }
  });

  const authActionsNames = ['signIn', 'signOut'];
  // Extract sign in / out from actions so we can display seperately as needed
  const authAction = computed((): ServerStateDataAction | undefined => {
    if (!stateData.value.actions) {
      return;
    }
    return stateData.value.actions.find((action) => authActionsNames.includes(action.name));
  });
  // Remove sign in / out from actions so we can display them separately
  const keyActions = computed((): ServerStateDataAction[] | undefined => {
    if (!stateData.value.actions) {
      return;
    }
    return stateData.value.actions.filter((action) => !authActionsNames.includes(action.name));
  });
  const trialExtensionEligible = computed(() => !regGen.value || regGen.value < 2);
  const trialWithin5DaysOfExpiration = computed(() => {
    if (!expireTime.value || state.value !== 'TRIAL') {
      return false;
    }
    const today = dayjs();
    const expirationDate = dayjs(expireTime.value);
    const daysUntilExpiration = expirationDate.diff(today, 'day');
    return daysUntilExpiration <= 5 && daysUntilExpiration >= 0;
  });
  const trialExtensionEligibleInsideRenewalWindow = computed(
    () => trialExtensionEligible.value && trialWithin5DaysOfExpiration.value
  );
  const trialExtensionEligibleOutsideRenewalWindow = computed(
    () => trialExtensionEligible.value && !trialWithin5DaysOfExpiration.value
  );
  const trialExtensionIneligibleInsideRenewalWindow = computed(
    () => !trialExtensionEligible.value && trialWithin5DaysOfExpiration.value
  );

  const serverConfigError = computed((): Error | undefined => {
    if (!config.value?.valid && config.value?.error) {
      switch (config.value?.error) {
        // case 'UNKNOWN_ERROR':
        //   return {
        //     heading: 'Unknown Error',
        //     level: 'error',
        //     message: 'An unknown internal error occurred.',
        //     ref: 'configError',
        //     type: 'server',
        //   };
        case 'INELIGIBLE':
          return {
            heading: t('server.configError.ineligible.heading'),
            level: 'error',
            message: t('server.configError.ineligible.message'),
            actions: [
              {
                href: WEBGUI_TOOLS_REGISTRATION,
                icon: CogIcon,
                text: t('server.configError.ineligible.action'),
              },
            ],
            ref: 'configError',
            type: 'server',
          };
        case 'INVALID':
          return {
            heading: t('server.configError.invalid.heading'),
            level: 'error',
            message: t('server.configError.invalid.message'),
            ref: 'configError',
            type: 'server',
          };
        case 'NO_KEY_SERVER':
          return {
            heading: t('server.configError.noKeyServer.heading'),
            level: 'error',
            message: t('server.configError.noKeyServer.message'),
            ref: 'configError',
            type: 'server',
          };
        case 'WITHDRAWN':
          return {
            heading: t('server.configError.withdrawn.heading'),
            level: 'error',
            message: t('server.configError.withdrawn.message'),
            actions: [
              {
                href: WEBGUI_TOOLS_UPDATE,
                icon: ArrowPathIcon,
                text: t('server.configError.withdrawn.action'),
              },
            ],
            ref: 'configError',
            type: 'server',
          };
      }
      return undefined;
    }
  });
  watch(serverConfigError, (newVal, oldVal) => {
    if (oldVal && oldVal.ref) {
      errorsStore.removeErrorByRef(oldVal.ref);
    }
    if (newVal) {
      errorsStore.setError(newVal);
    }
  });

  const tooManyDevices = computed((): boolean => {
    return (
      (deviceCount.value !== 0 &&
        computedRegDevs.value > 0 &&
        deviceCount.value > computedRegDevs.value) ||
      (!config.value?.valid && config.value?.error === 'INVALID')
    );
  });

  const pluginInstallFailed = computed((): Error | undefined => {
    if (connectPluginInstalled.value && connectPluginInstalled.value.includes('_installFailed')) {
      return {
        actions: [
          {
            external: true,
            href: 'https://forums.unraid.net/topic/112073-my-servers-releases/#comment-1154449',
            icon: InformationCircleIcon,
            text: t('common.learnMore'),
          },
        ],
        heading: t('server.pluginInstallFailed.heading'),
        level: 'error',
        message: t('server.pluginInstallFailed.message'),
        ref: 'pluginInstallFailed',
        type: 'server',
      };
    }
    return undefined;
  });
  watch(pluginInstallFailed, (newVal, oldVal) => {
    if (oldVal && oldVal.ref) {
      errorsStore.removeErrorByRef(oldVal.ref);
    }
    if (newVal) {
      errorsStore.setError(newVal);
    }
  });

  /**
   * Deprecation warning for [hash].unraid.net SSL certs. Deprecation started 2023-01-01
   */
  const deprecatedUnraidSSL = ref<Error | undefined>(
    window.location.hostname.includes('localhost') && window.location.port !== '4321'
      ? {
          actions: [
            {
              href: WEBGUI_SETTINGS_MANAGMENT_ACCESS,
              icon: CogIcon,
              text: t('server.deprecatedSsl.managementAccess'),
            },
            {
              external: true,
              href: 'https://unraid.net/blog/ssl-certificate-update',
              icon: InformationCircleIcon,
              text: t('common.learnMore'),
            },
          ],
          forumLink: true,
          heading: t('server.deprecatedSsl.heading'),
          level: 'error',
          message: t('server.deprecatedSsl.message'),
          ref: 'deprecatedUnraidSSL',
          type: 'server',
        }
      : undefined
  );
  watch(deprecatedUnraidSSL, (newVal, oldVal) => {
    if (oldVal && oldVal.ref) {
      errorsStore.removeErrorByRef(oldVal.ref);
    }
    if (newVal) {
      errorsStore.setError(newVal);
    }
  });

  const cloudError = computed((): Error | undefined => {
    // if we're not registered or we're in the process of signing out then the cloud error should be ignored
    if (
      !registered.value ||
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
          text: t('server.actions.contactSupport'),
        },
      ],
      debugServer: serverDebugPayload.value,
      heading: t('server.cloudError.heading'),
      level: 'error',
      message: cloud.value?.error ?? '',
      ref: 'cloudError',
      type: 'unraidApiState',
    };
  });
  watch(cloudError, (newVal, oldVal) => {
    if (oldVal && oldVal.ref) {
      errorsStore.removeErrorByRef(oldVal.ref);
    }
    if (newVal) {
      errorsStore.setError(newVal);
    }
  });

  const serverErrors = computed(() => {
    return [
      stateDataError.value,
      serverConfigError.value,
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
    if (typeof data?.array !== 'undefined') {
      array.value = data.array;
    }
    if (typeof data?.apiVersion !== 'undefined') {
      apiVersion.value = data.apiVersion;
    }
    if (typeof data?.avatar !== 'undefined') {
      avatar.value = data.avatar;
    }
    if (typeof data?.caseModel !== 'undefined') {
      caseModel.value = data.caseModel;
    }
    if (typeof data?.cloud !== 'undefined') {
      cloud.value = data.cloud;
    }
    if (typeof data?.combinedKnownOrigins !== 'undefined') {
      combinedKnownOrigins.value = data.combinedKnownOrigins;
    }
    if (typeof data?.config !== 'undefined') {
      config.value = data.config;
    }
    if (typeof data?.connectPluginInstalled !== 'undefined') {
      connectPluginInstalled.value = data.connectPluginInstalled;
    }
    if (typeof data?.connectPluginVersion !== 'undefined') {
      connectPluginVersion.value = data.connectPluginVersion;
    }
    if (typeof data?.csrf !== 'undefined') {
      csrf.value = data.csrf;
    }
    if (typeof data?.dateTimeFormat !== 'undefined') {
      dateTimeFormat.value = data.dateTimeFormat;
    }
    if (typeof data?.description !== 'undefined') {
      description.value = data.description;
    }
    if (typeof data?.deviceCount !== 'undefined') {
      deviceCount.value = data.deviceCount;
    }
    if (typeof data?.email !== 'undefined') {
      email.value = data.email;
    }
    if (typeof data?.expireTime !== 'undefined') {
      expireTime.value = data.expireTime;
    }
    if (typeof data?.flashBackupActivated !== 'undefined') {
      flashBackupActivated.value = data.flashBackupActivated;
    }
    if (typeof data?.flashProduct !== 'undefined') {
      flashProduct.value = data.flashProduct;
    }
    if (typeof data?.flashVendor !== 'undefined') {
      flashVendor.value = data.flashVendor;
    }
    if (typeof data?.guid !== 'undefined') {
      guid.value = data.guid;
    }
    if (typeof data?.keyfile !== 'undefined') {
      keyfile.value = data.keyfile;
    }
    if (typeof data?.lanIp !== 'undefined') {
      lanIp.value = data.lanIp;
    }
    if (typeof data?.license !== 'undefined') {
      license.value = data.license;
    }
    if (typeof data?.locale !== 'undefined') {
      locale.value = data.locale;
    }
    if (typeof data?.name !== 'undefined') {
      name.value = data.name;
    }
    if (typeof data?.osVersion !== 'undefined') {
      osVersion.value = data.osVersion;
    }
    if (typeof data?.osVersionBranch !== 'undefined') {
      osVersionBranch.value = data.osVersionBranch;
    }
    if (typeof data?.rebootType !== 'undefined') {
      rebootType.value = data.rebootType;
    }
    if (typeof data?.rebootVersion !== 'undefined') {
      rebootVersion.value = data.rebootVersion;
    }
    if (typeof data?.registered !== 'undefined') {
      registered.value = data.registered;
    }
    if (typeof data?.regGen !== 'undefined') {
      regGen.value = data.regGen;
    }
    if (typeof data?.regGuid !== 'undefined') {
      regGuid.value = data.regGuid;
    }
    if (typeof data?.regTy !== 'undefined') {
      regTy.value = data.regTy;
    }
    if (typeof data?.regExp !== 'undefined') {
      regExp.value = data.regExp;
    }
    if (typeof data?.site !== 'undefined') {
      site.value = data.site;
    }
    if (typeof data?.state !== 'undefined') {
      state.value = data.state;
    }
    if (typeof data?.theme !== 'undefined') {
      theme.value = data.theme;
    }
    if (typeof data?.updateOsIgnoredReleases !== 'undefined') {
      updateOsIgnoredReleases.value = data.updateOsIgnoredReleases;
    }
    if (typeof data?.updateOsNotificationsEnabled !== 'undefined') {
      updateOsNotificationsEnabled.value = data.updateOsNotificationsEnabled;
    }
    if (typeof data?.updateOsResponse !== 'undefined') {
      updateOsResponse.value = data.updateOsResponse;
    }
    if (typeof data?.uptime !== 'undefined') {
      uptime.value = data.uptime;
    }
    if (typeof data?.username !== 'undefined') {
      username.value = data.username;
    }
    if (typeof data?.wanFQDN !== 'undefined') {
      wanFQDN.value = data.wanFQDN;
    }
    if (typeof data?.regTm !== 'undefined') {
      regTm.value = data.regTm;
    }
    if (typeof data?.regTo !== 'undefined') {
      regTo.value = data.regTo;
    }
    if (typeof data?.ssoEnabled !== 'undefined') {
      ssoEnabled.value = Boolean(data.ssoEnabled);
    }
  };

  const setUpdateOsResponse = (response: ServerUpdateOsResponse) => {
    updateOsResponse.value = response;
  };

  const mutateServerStateFromApi = (data: ServerStateQuery): Server => {
    console.debug('mutateServerStateFromApi', data);
    const mutatedData: Server = {
      // if we get an owners obj back and the username is root we don't want to overwrite the values
      ...(data.owner && data.owner.username !== 'root'
        ? {
            // avatar: data.owner.avatar,
            username: data.owner.username ?? '',
            registered: true,
          }
        : {
            // handles sign outs
            // avatar: data.owner.avatar,
            username: '',
            registered: false,
          }),
      name: data.info && data.info.os && data.info.os.hostname ? data.info.os.hostname : undefined,
      keyfile:
        data.registration && data.registration.keyFile && data.registration.keyFile.contents
          ? data.registration.keyFile.contents
          : undefined,
      regGen: data.vars && data.vars.regGen ? parseInt(data.vars.regGen) : undefined,
      state: data.vars && data.vars.regState ? data.vars.regState : undefined,
      config: data.config
        ? { id: 'config', ...data.config }
        : {
            id: 'config',
            error: data.vars && data.vars.configError ? data.vars.configError : undefined,
            valid: data.vars && data.vars.configValid ? data.vars.configValid : true,
          },
      expireTime:
        data.registration && data.registration.expiration ? parseInt(data.registration.expiration) : 0,
      regExp:
        data.registration && data.registration.updateExpiration
          ? Number(data.registration.updateExpiration)
          : undefined,
    };
    console.debug('mutatedData', mutatedData);
    return mutatedData;
  };

  const { load, refetch: _refetchServerState, onResult, onError } = useLazyQuery(SERVER_STATE_QUERY);
  const {
    load: loadCloudState,
    refetch: refetchCloudState,
    onResult: onResultCloudState,
  } = useLazyQuery(CLOUD_STATE_QUERY);

  const refetchServerState = async (variables?: Record<string, never>) => {
    const serverResponse = await _refetchServerState(variables);
    await refetchCloudState()?.catch(() => {});
    return serverResponse;
  };

  setTimeout(() => {
    load();
    if (connectPluginInstalled.value) {
      loadCloudState();
    }
  }, 500);

  onResult((result) => {
    if (result.data) {
      const { unraidApiStatus } = toRefs(useUnraidApiStore());
      unraidApiStatus.value = 'online';
      apiServerStateRefresh.value = refetchServerState;
      const mutatedServerStateResult = mutateServerStateFromApi(result.data);
      setServer(mutatedServerStateResult);
    }
  });

  onResultCloudState((result) => {
    if (result.data) {
      const { cloud } = result.data;
      const serverData = {
        cloud: cloud ? useFragment(SERVER_CLOUD_FRAGMENT, cloud) : undefined,
      };
      setServer(serverData);
    }
  });

  onError((error) => {
    console.error('[serverStateQuery] error', error);
    const { unraidApiStatus } = toRefs(useUnraidApiStore());
    unraidApiStatus.value = 'offline';
  });

  const phpServerStateRefresh = async () => {
    try {
      const stateResponse: Server = await WebguiState.get().json();
      setServer(stateResponse);
      return stateResponse;
    } catch (error) {
      console.error('[phpServerStateRefresh] error', error);
    }
  };

  const refreshLimit = 120;
  const refreshTimeout = 500;
  const refreshServerStateStatus = ref<'done' | 'ready' | 'refreshing' | 'timeout'>('ready');
  const refreshServerState = async (options?: {
    poll?: boolean;
    attempt?: number;
    maxAttempts?: number;
    intervalMs?: number;
  }): Promise<boolean> => {
    const poll = options?.poll ?? true;
    const attempt = options?.attempt ?? 0;
    const maxAttempts = options?.maxAttempts ?? refreshLimit;
    const intervalMs = options?.intervalMs ?? refreshTimeout;

    // If we've reached the refresh limit, stop refreshing
    if (attempt >= maxAttempts) {
      refreshServerStateStatus.value = 'timeout';
      return false;
    }

    refreshServerStateStatus.value = 'refreshing';

    // Values to compare to response values should be set before the response is set
    const oldRegistered = registered.value;
    const oldState = state.value;
    const oldRegExp = regExp.value;

    const fromApi = Boolean(apiServerStateRefresh.value);
    // Fetch the server state from the API or PHP
    const response = fromApi ? await refetchServerState() : await phpServerStateRefresh();
    if (!response) {
      if (poll) {
        setTimeout(() => {
          void refreshServerState({ poll, attempt: attempt + 1, maxAttempts, intervalMs });
        }, intervalMs);
        return false;
      }
      return false;
    }

    // Extract the new values from the response
    const output: {
      newRegistered: boolean;
      newState: ServerState | ServerState | null;
      newRegExp: number | null;
    } = {
      newRegistered: false,
      newState: null,
      newRegExp: null,
    };
    if ('data' in response) {
      output.newRegistered = Boolean(response.data.owner && response.data.owner.username !== 'root');
      output.newState = response.data.vars?.regState ?? null;
      output.newRegExp = Number(response.data.registration?.updateExpiration ?? 0);
    } else {
      output.newRegistered = Boolean(response.registered);
      output.newState = response.state;
      output.newRegExp = Number(response.regExp ?? 0);
    }
    // Compare the new values to the old values
    const registrationStatusChanged = output.newRegistered !== oldRegistered;
    const stateChanged = output.newState !== oldState;
    const regExpChanged = output.newRegExp ?? 0 > oldRegExp;

    // If the registration status or state changed, stop refreshing
    if (registrationStatusChanged || stateChanged || regExpChanged) {
      refreshServerStateStatus.value = 'done';
      return true;
    }

    // If we're not polling, we're done
    if (!poll) {
      refreshServerStateStatus.value = 'done';
      return true;
    }

    // If we haven't reached the refresh limit, try again
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    return refreshServerState({ poll, attempt: attempt + 1, maxAttempts, intervalMs });
  };

  const filteredKeyActions = (
    filterType: 'by' | 'out',
    filters: ServerActionTypes[]
  ): ServerStateDataAction[] | undefined => {
    if (!stateData.value.actions) {
      return;
    }

    return stateData.value.actions.filter((action) => {
      return filterType === 'out' ? !filters.includes(action.name) : filters.includes(action.name);
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
    updateOsIgnoredReleases.value = updateOsIgnoredReleases.value.filter((r) => r !== release);
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
    array,
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
    computedRegDevs,
    regGen,
    regGuid,
    regTm,
    regTo,
    regTy,
    regExp,
    parsedRegExp,
    regUpdatesExpired,
    site,
    ssoEnabled,
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
    serverConfigError,
    arrayWarning,
    computedArray,
    // actions
    setServer,
    setUpdateOsResponse,
    refreshServerState,
    filteredKeyActions,
    setRebootVersion,
    updateOsIgnoreRelease,
    updateOsRemoveIgnoredRelease,
    updateOsRemoveAllIgnoredReleases,
  };
});
