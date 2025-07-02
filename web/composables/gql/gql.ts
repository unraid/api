/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query PartnerInfo {\n    publicPartnerInfo {\n      hasPartnerLogo\n      partnerName\n      partnerUrl\n      partnerLogoUrl\n    }\n  }\n": typeof types.PartnerInfoDocument,
    "\n  query ActivationCode {\n    vars {\n      regState\n    }\n    customization {\n      activationCode {\n        code\n        partnerName\n        serverName\n        sysModel\n        comment\n        header\n        headermetacolor\n        background\n        showBannerGradient\n        theme\n      }\n      partnerInfo {\n        hasPartnerLogo\n        partnerName\n        partnerUrl\n        partnerLogoUrl\n      }\n    }\n  }\n": typeof types.ActivationCodeDocument,
    "\n  fragment ApiKey on ApiKey {\n    id\n    name\n    description\n    createdAt\n    roles\n    permissions {\n      resource\n      actions\n    }\n  }\n": typeof types.ApiKeyFragmentDoc,
    "\n  fragment ApiKeyWithKey on ApiKeyWithSecret {\n    id\n    key\n    name\n    description\n    createdAt\n    roles\n    permissions {\n      resource\n      actions\n    }\n  }\n": typeof types.ApiKeyWithKeyFragmentDoc,
    "\n  query ApiKeys {\n    apiKeys {\n      ...ApiKey\n    }\n  }\n": typeof types.ApiKeysDocument,
    "\n  mutation CreateApiKey($input: CreateApiKeyInput!) {\n    apiKey {\n      create(input: $input) {\n        ...ApiKeyWithKey\n      }\n    } \n  }\n": typeof types.CreateApiKeyDocument,
    "\n  mutation UpdateApiKey($input: UpdateApiKeyInput!) {\n    apiKey {\n      update(input: $input) {\n        ...ApiKeyWithKey\n      }\n    }\n  }\n": typeof types.UpdateApiKeyDocument,
    "\n  mutation DeleteApiKey($input: DeleteApiKeyInput!) {\n    apiKey {\n      delete(input: $input)\n    }\n  }\n": typeof types.DeleteApiKeyDocument,
    "\n  query ApiKeyMeta {\n    apiKeyPossibleRoles\n    apiKeyPossiblePermissions {\n      resource\n      actions\n    }\n  }\n": typeof types.ApiKeyMetaDocument,
    "\n  query Unified {\n    settings {\n      unified {\n        id\n        dataSchema\n        uiSchema\n        values\n      }\n    }\n  }\n": typeof types.UnifiedDocument,
    "\n  mutation UpdateConnectSettings($input: JSON!) {\n    updateSettings(input: $input) {\n      restartRequired\n      values\n    }\n  }\n": typeof types.UpdateConnectSettingsDocument,
    "\n  query LogFiles {\n    logFiles {\n      name\n      path\n      size\n      modifiedAt\n    }\n  }\n": typeof types.LogFilesDocument,
    "\n  query LogFileContent($path: String!, $lines: Int, $startLine: Int) {\n    logFile(path: $path, lines: $lines, startLine: $startLine) {\n      path\n      content\n      totalLines\n      startLine\n    }\n  }\n": typeof types.LogFileContentDocument,
    "\n  subscription LogFileSubscription($path: String!) {\n    logFile(path: $path) {\n      path\n      content\n      totalLines\n    }\n  }\n": typeof types.LogFileSubscriptionDocument,
    "\n  fragment NotificationFragment on Notification {\n    id\n    title\n    subject\n    description\n    importance\n    link\n    type\n    timestamp\n    formattedTimestamp\n  }\n": typeof types.NotificationFragmentFragmentDoc,
    "\n  fragment NotificationCountFragment on NotificationCounts {\n    total\n    info\n    warning\n    alert\n  }\n": typeof types.NotificationCountFragmentFragmentDoc,
    "\n  query Notifications($filter: NotificationFilter!) {\n    notifications {\n      id\n      list(filter: $filter) {\n        ...NotificationFragment\n      }\n    }\n  }\n": typeof types.NotificationsDocument,
    "\n  mutation ArchiveNotification($id: PrefixedID!) {\n    archiveNotification(id: $id) {\n      ...NotificationFragment\n    }\n  }\n": typeof types.ArchiveNotificationDocument,
    "\n  mutation ArchiveAllNotifications {\n    archiveAll {\n      unread {\n        total\n      }\n      archive {\n        info\n        warning\n        alert\n        total\n      }\n    }\n  }\n": typeof types.ArchiveAllNotificationsDocument,
    "\n  mutation DeleteNotification($id: PrefixedID!, $type: NotificationType!) {\n    deleteNotification(id: $id, type: $type) {\n      archive {\n        total\n      }\n    }\n  }\n": typeof types.DeleteNotificationDocument,
    "\n  mutation DeleteAllNotifications {\n    deleteArchivedNotifications {\n      archive {\n        total\n      }\n      unread {\n        total\n      }\n    }\n  }\n": typeof types.DeleteAllNotificationsDocument,
    "\n  query Overview {\n    notifications {\n      id\n      overview {\n        unread {\n          info\n          warning\n          alert\n          total\n        }\n        archive {\n          total\n        }\n      }\n    }\n  }\n": typeof types.OverviewDocument,
    "\n  mutation RecomputeOverview {\n    recalculateOverview {\n      archive {\n        ...NotificationCountFragment\n      }\n      unread {\n        ...NotificationCountFragment\n      }\n    }\n  }\n": typeof types.RecomputeOverviewDocument,
    "\n  subscription NotificationAddedSub {\n    notificationAdded {\n      ...NotificationFragment\n    }\n  }\n": typeof types.NotificationAddedSubDocument,
    "\n  subscription NotificationOverviewSub {\n    notificationsOverview {\n      archive {\n        ...NotificationCountFragment\n      }\n      unread {\n        ...NotificationCountFragment\n      }\n    }\n  }\n": typeof types.NotificationOverviewSubDocument,
    "\n  mutation CreateRCloneRemote($input: CreateRCloneRemoteInput!) {\n    rclone {\n      createRCloneRemote(input: $input) {\n        name\n        type\n        parameters\n      }\n    }\n  }\n": typeof types.CreateRCloneRemoteDocument,
    "\n  mutation DeleteRCloneRemote($input: DeleteRCloneRemoteInput!) {\n    rclone {\n      deleteRCloneRemote(input: $input)\n    }\n  }\n": typeof types.DeleteRCloneRemoteDocument,
    "\n  query GetRCloneConfigForm($formOptions: RCloneConfigFormInput) {\n    rclone {\n      configForm(formOptions: $formOptions) {\n        id\n        dataSchema\n        uiSchema\n      }\n    }\n  }\n": typeof types.GetRCloneConfigFormDocument,
    "\n  query ListRCloneRemotes {\n    rclone {\n      remotes {\n        name\n        type\n        parameters\n        config\n      }\n    }\n  }\n": typeof types.ListRCloneRemotesDocument,
    "\n  mutation ConnectSignIn($input: ConnectSignInInput!) {\n    connectSignIn(input: $input)\n  }\n": typeof types.ConnectSignInDocument,
    "\n  mutation SignOut {\n    connectSignOut\n  }\n": typeof types.SignOutDocument,
    "\n  query IsSSOEnabled {\n    isSSOEnabled\n  }\n": typeof types.IsSsoEnabledDocument,
    "\n  fragment PartialCloud on Cloud {\n    error\n    apiKey {\n      valid\n      error\n    }\n    cloud {\n      status\n      error\n    }\n    minigraphql {\n      status\n      error\n    }\n    relay {\n      status\n      error\n    }\n  }\n": typeof types.PartialCloudFragmentDoc,
    "\n  query cloudState {\n    cloud {\n      ...PartialCloud\n    }\n  }\n": typeof types.CloudStateDocument,
    "\n  query serverState {\n    config {\n      error\n      valid\n    }\n    info {\n      os {\n        hostname\n      }\n    }\n    owner {\n      avatar\n      username\n    }\n    registration {\n      state\n      expiration\n      keyFile {\n        contents\n      }\n      updateExpiration\n    }\n    vars {\n      regGen\n      regState\n      configError\n      configValid\n    }\n  }\n": typeof types.ServerStateDocument,
    "\n  query getTheme {\n    publicTheme {\n      name\n      showBannerImage\n      showBannerGradient\n      headerBackgroundColor\n      showHeaderDescription\n      headerPrimaryTextColor\n      headerSecondaryTextColor\n    }\n  }\n": typeof types.GetThemeDocument,
};
const documents: Documents = {
    "\n  query PartnerInfo {\n    publicPartnerInfo {\n      hasPartnerLogo\n      partnerName\n      partnerUrl\n      partnerLogoUrl\n    }\n  }\n": types.PartnerInfoDocument,
    "\n  query ActivationCode {\n    vars {\n      regState\n    }\n    customization {\n      activationCode {\n        code\n        partnerName\n        serverName\n        sysModel\n        comment\n        header\n        headermetacolor\n        background\n        showBannerGradient\n        theme\n      }\n      partnerInfo {\n        hasPartnerLogo\n        partnerName\n        partnerUrl\n        partnerLogoUrl\n      }\n    }\n  }\n": types.ActivationCodeDocument,
    "\n  fragment ApiKey on ApiKey {\n    id\n    name\n    description\n    createdAt\n    roles\n    permissions {\n      resource\n      actions\n    }\n  }\n": types.ApiKeyFragmentDoc,
    "\n  fragment ApiKeyWithKey on ApiKeyWithSecret {\n    id\n    key\n    name\n    description\n    createdAt\n    roles\n    permissions {\n      resource\n      actions\n    }\n  }\n": types.ApiKeyWithKeyFragmentDoc,
    "\n  query ApiKeys {\n    apiKeys {\n      ...ApiKey\n    }\n  }\n": types.ApiKeysDocument,
    "\n  mutation CreateApiKey($input: CreateApiKeyInput!) {\n    apiKey {\n      create(input: $input) {\n        ...ApiKeyWithKey\n      }\n    } \n  }\n": types.CreateApiKeyDocument,
    "\n  mutation UpdateApiKey($input: UpdateApiKeyInput!) {\n    apiKey {\n      update(input: $input) {\n        ...ApiKeyWithKey\n      }\n    }\n  }\n": types.UpdateApiKeyDocument,
    "\n  mutation DeleteApiKey($input: DeleteApiKeyInput!) {\n    apiKey {\n      delete(input: $input)\n    }\n  }\n": types.DeleteApiKeyDocument,
    "\n  query ApiKeyMeta {\n    apiKeyPossibleRoles\n    apiKeyPossiblePermissions {\n      resource\n      actions\n    }\n  }\n": types.ApiKeyMetaDocument,
    "\n  query Unified {\n    settings {\n      unified {\n        id\n        dataSchema\n        uiSchema\n        values\n      }\n    }\n  }\n": types.UnifiedDocument,
    "\n  mutation UpdateConnectSettings($input: JSON!) {\n    updateSettings(input: $input) {\n      restartRequired\n      values\n    }\n  }\n": types.UpdateConnectSettingsDocument,
    "\n  query LogFiles {\n    logFiles {\n      name\n      path\n      size\n      modifiedAt\n    }\n  }\n": types.LogFilesDocument,
    "\n  query LogFileContent($path: String!, $lines: Int, $startLine: Int) {\n    logFile(path: $path, lines: $lines, startLine: $startLine) {\n      path\n      content\n      totalLines\n      startLine\n    }\n  }\n": types.LogFileContentDocument,
    "\n  subscription LogFileSubscription($path: String!) {\n    logFile(path: $path) {\n      path\n      content\n      totalLines\n    }\n  }\n": types.LogFileSubscriptionDocument,
    "\n  fragment NotificationFragment on Notification {\n    id\n    title\n    subject\n    description\n    importance\n    link\n    type\n    timestamp\n    formattedTimestamp\n  }\n": types.NotificationFragmentFragmentDoc,
    "\n  fragment NotificationCountFragment on NotificationCounts {\n    total\n    info\n    warning\n    alert\n  }\n": types.NotificationCountFragmentFragmentDoc,
    "\n  query Notifications($filter: NotificationFilter!) {\n    notifications {\n      id\n      list(filter: $filter) {\n        ...NotificationFragment\n      }\n    }\n  }\n": types.NotificationsDocument,
    "\n  mutation ArchiveNotification($id: PrefixedID!) {\n    archiveNotification(id: $id) {\n      ...NotificationFragment\n    }\n  }\n": types.ArchiveNotificationDocument,
    "\n  mutation ArchiveAllNotifications {\n    archiveAll {\n      unread {\n        total\n      }\n      archive {\n        info\n        warning\n        alert\n        total\n      }\n    }\n  }\n": types.ArchiveAllNotificationsDocument,
    "\n  mutation DeleteNotification($id: PrefixedID!, $type: NotificationType!) {\n    deleteNotification(id: $id, type: $type) {\n      archive {\n        total\n      }\n    }\n  }\n": types.DeleteNotificationDocument,
    "\n  mutation DeleteAllNotifications {\n    deleteArchivedNotifications {\n      archive {\n        total\n      }\n      unread {\n        total\n      }\n    }\n  }\n": types.DeleteAllNotificationsDocument,
    "\n  query Overview {\n    notifications {\n      id\n      overview {\n        unread {\n          info\n          warning\n          alert\n          total\n        }\n        archive {\n          total\n        }\n      }\n    }\n  }\n": types.OverviewDocument,
    "\n  mutation RecomputeOverview {\n    recalculateOverview {\n      archive {\n        ...NotificationCountFragment\n      }\n      unread {\n        ...NotificationCountFragment\n      }\n    }\n  }\n": types.RecomputeOverviewDocument,
    "\n  subscription NotificationAddedSub {\n    notificationAdded {\n      ...NotificationFragment\n    }\n  }\n": types.NotificationAddedSubDocument,
    "\n  subscription NotificationOverviewSub {\n    notificationsOverview {\n      archive {\n        ...NotificationCountFragment\n      }\n      unread {\n        ...NotificationCountFragment\n      }\n    }\n  }\n": types.NotificationOverviewSubDocument,
    "\n  mutation CreateRCloneRemote($input: CreateRCloneRemoteInput!) {\n    rclone {\n      createRCloneRemote(input: $input) {\n        name\n        type\n        parameters\n      }\n    }\n  }\n": types.CreateRCloneRemoteDocument,
    "\n  mutation DeleteRCloneRemote($input: DeleteRCloneRemoteInput!) {\n    rclone {\n      deleteRCloneRemote(input: $input)\n    }\n  }\n": types.DeleteRCloneRemoteDocument,
    "\n  query GetRCloneConfigForm($formOptions: RCloneConfigFormInput) {\n    rclone {\n      configForm(formOptions: $formOptions) {\n        id\n        dataSchema\n        uiSchema\n      }\n    }\n  }\n": types.GetRCloneConfigFormDocument,
    "\n  query ListRCloneRemotes {\n    rclone {\n      remotes {\n        name\n        type\n        parameters\n        config\n      }\n    }\n  }\n": types.ListRCloneRemotesDocument,
    "\n  mutation ConnectSignIn($input: ConnectSignInInput!) {\n    connectSignIn(input: $input)\n  }\n": types.ConnectSignInDocument,
    "\n  mutation SignOut {\n    connectSignOut\n  }\n": types.SignOutDocument,
    "\n  query IsSSOEnabled {\n    isSSOEnabled\n  }\n": types.IsSsoEnabledDocument,
    "\n  fragment PartialCloud on Cloud {\n    error\n    apiKey {\n      valid\n      error\n    }\n    cloud {\n      status\n      error\n    }\n    minigraphql {\n      status\n      error\n    }\n    relay {\n      status\n      error\n    }\n  }\n": types.PartialCloudFragmentDoc,
    "\n  query cloudState {\n    cloud {\n      ...PartialCloud\n    }\n  }\n": types.CloudStateDocument,
    "\n  query serverState {\n    config {\n      error\n      valid\n    }\n    info {\n      os {\n        hostname\n      }\n    }\n    owner {\n      avatar\n      username\n    }\n    registration {\n      state\n      expiration\n      keyFile {\n        contents\n      }\n      updateExpiration\n    }\n    vars {\n      regGen\n      regState\n      configError\n      configValid\n    }\n  }\n": types.ServerStateDocument,
    "\n  query getTheme {\n    publicTheme {\n      name\n      showBannerImage\n      showBannerGradient\n      headerBackgroundColor\n      showHeaderDescription\n      headerPrimaryTextColor\n      headerSecondaryTextColor\n    }\n  }\n": types.GetThemeDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PartnerInfo {\n    publicPartnerInfo {\n      hasPartnerLogo\n      partnerName\n      partnerUrl\n      partnerLogoUrl\n    }\n  }\n"): (typeof documents)["\n  query PartnerInfo {\n    publicPartnerInfo {\n      hasPartnerLogo\n      partnerName\n      partnerUrl\n      partnerLogoUrl\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ActivationCode {\n    vars {\n      regState\n    }\n    customization {\n      activationCode {\n        code\n        partnerName\n        serverName\n        sysModel\n        comment\n        header\n        headermetacolor\n        background\n        showBannerGradient\n        theme\n      }\n      partnerInfo {\n        hasPartnerLogo\n        partnerName\n        partnerUrl\n        partnerLogoUrl\n      }\n    }\n  }\n"): (typeof documents)["\n  query ActivationCode {\n    vars {\n      regState\n    }\n    customization {\n      activationCode {\n        code\n        partnerName\n        serverName\n        sysModel\n        comment\n        header\n        headermetacolor\n        background\n        showBannerGradient\n        theme\n      }\n      partnerInfo {\n        hasPartnerLogo\n        partnerName\n        partnerUrl\n        partnerLogoUrl\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ApiKey on ApiKey {\n    id\n    name\n    description\n    createdAt\n    roles\n    permissions {\n      resource\n      actions\n    }\n  }\n"): (typeof documents)["\n  fragment ApiKey on ApiKey {\n    id\n    name\n    description\n    createdAt\n    roles\n    permissions {\n      resource\n      actions\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ApiKeyWithKey on ApiKeyWithSecret {\n    id\n    key\n    name\n    description\n    createdAt\n    roles\n    permissions {\n      resource\n      actions\n    }\n  }\n"): (typeof documents)["\n  fragment ApiKeyWithKey on ApiKeyWithSecret {\n    id\n    key\n    name\n    description\n    createdAt\n    roles\n    permissions {\n      resource\n      actions\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ApiKeys {\n    apiKeys {\n      ...ApiKey\n    }\n  }\n"): (typeof documents)["\n  query ApiKeys {\n    apiKeys {\n      ...ApiKey\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateApiKey($input: CreateApiKeyInput!) {\n    apiKey {\n      create(input: $input) {\n        ...ApiKeyWithKey\n      }\n    } \n  }\n"): (typeof documents)["\n  mutation CreateApiKey($input: CreateApiKeyInput!) {\n    apiKey {\n      create(input: $input) {\n        ...ApiKeyWithKey\n      }\n    } \n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateApiKey($input: UpdateApiKeyInput!) {\n    apiKey {\n      update(input: $input) {\n        ...ApiKeyWithKey\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateApiKey($input: UpdateApiKeyInput!) {\n    apiKey {\n      update(input: $input) {\n        ...ApiKeyWithKey\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteApiKey($input: DeleteApiKeyInput!) {\n    apiKey {\n      delete(input: $input)\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteApiKey($input: DeleteApiKeyInput!) {\n    apiKey {\n      delete(input: $input)\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ApiKeyMeta {\n    apiKeyPossibleRoles\n    apiKeyPossiblePermissions {\n      resource\n      actions\n    }\n  }\n"): (typeof documents)["\n  query ApiKeyMeta {\n    apiKeyPossibleRoles\n    apiKeyPossiblePermissions {\n      resource\n      actions\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Unified {\n    settings {\n      unified {\n        id\n        dataSchema\n        uiSchema\n        values\n      }\n    }\n  }\n"): (typeof documents)["\n  query Unified {\n    settings {\n      unified {\n        id\n        dataSchema\n        uiSchema\n        values\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateConnectSettings($input: JSON!) {\n    updateSettings(input: $input) {\n      restartRequired\n      values\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateConnectSettings($input: JSON!) {\n    updateSettings(input: $input) {\n      restartRequired\n      values\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LogFiles {\n    logFiles {\n      name\n      path\n      size\n      modifiedAt\n    }\n  }\n"): (typeof documents)["\n  query LogFiles {\n    logFiles {\n      name\n      path\n      size\n      modifiedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LogFileContent($path: String!, $lines: Int, $startLine: Int) {\n    logFile(path: $path, lines: $lines, startLine: $startLine) {\n      path\n      content\n      totalLines\n      startLine\n    }\n  }\n"): (typeof documents)["\n  query LogFileContent($path: String!, $lines: Int, $startLine: Int) {\n    logFile(path: $path, lines: $lines, startLine: $startLine) {\n      path\n      content\n      totalLines\n      startLine\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription LogFileSubscription($path: String!) {\n    logFile(path: $path) {\n      path\n      content\n      totalLines\n    }\n  }\n"): (typeof documents)["\n  subscription LogFileSubscription($path: String!) {\n    logFile(path: $path) {\n      path\n      content\n      totalLines\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment NotificationFragment on Notification {\n    id\n    title\n    subject\n    description\n    importance\n    link\n    type\n    timestamp\n    formattedTimestamp\n  }\n"): (typeof documents)["\n  fragment NotificationFragment on Notification {\n    id\n    title\n    subject\n    description\n    importance\n    link\n    type\n    timestamp\n    formattedTimestamp\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment NotificationCountFragment on NotificationCounts {\n    total\n    info\n    warning\n    alert\n  }\n"): (typeof documents)["\n  fragment NotificationCountFragment on NotificationCounts {\n    total\n    info\n    warning\n    alert\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Notifications($filter: NotificationFilter!) {\n    notifications {\n      id\n      list(filter: $filter) {\n        ...NotificationFragment\n      }\n    }\n  }\n"): (typeof documents)["\n  query Notifications($filter: NotificationFilter!) {\n    notifications {\n      id\n      list(filter: $filter) {\n        ...NotificationFragment\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ArchiveNotification($id: PrefixedID!) {\n    archiveNotification(id: $id) {\n      ...NotificationFragment\n    }\n  }\n"): (typeof documents)["\n  mutation ArchiveNotification($id: PrefixedID!) {\n    archiveNotification(id: $id) {\n      ...NotificationFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ArchiveAllNotifications {\n    archiveAll {\n      unread {\n        total\n      }\n      archive {\n        info\n        warning\n        alert\n        total\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ArchiveAllNotifications {\n    archiveAll {\n      unread {\n        total\n      }\n      archive {\n        info\n        warning\n        alert\n        total\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteNotification($id: PrefixedID!, $type: NotificationType!) {\n    deleteNotification(id: $id, type: $type) {\n      archive {\n        total\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteNotification($id: PrefixedID!, $type: NotificationType!) {\n    deleteNotification(id: $id, type: $type) {\n      archive {\n        total\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAllNotifications {\n    deleteArchivedNotifications {\n      archive {\n        total\n      }\n      unread {\n        total\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteAllNotifications {\n    deleteArchivedNotifications {\n      archive {\n        total\n      }\n      unread {\n        total\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Overview {\n    notifications {\n      id\n      overview {\n        unread {\n          info\n          warning\n          alert\n          total\n        }\n        archive {\n          total\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query Overview {\n    notifications {\n      id\n      overview {\n        unread {\n          info\n          warning\n          alert\n          total\n        }\n        archive {\n          total\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RecomputeOverview {\n    recalculateOverview {\n      archive {\n        ...NotificationCountFragment\n      }\n      unread {\n        ...NotificationCountFragment\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation RecomputeOverview {\n    recalculateOverview {\n      archive {\n        ...NotificationCountFragment\n      }\n      unread {\n        ...NotificationCountFragment\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription NotificationAddedSub {\n    notificationAdded {\n      ...NotificationFragment\n    }\n  }\n"): (typeof documents)["\n  subscription NotificationAddedSub {\n    notificationAdded {\n      ...NotificationFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription NotificationOverviewSub {\n    notificationsOverview {\n      archive {\n        ...NotificationCountFragment\n      }\n      unread {\n        ...NotificationCountFragment\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription NotificationOverviewSub {\n    notificationsOverview {\n      archive {\n        ...NotificationCountFragment\n      }\n      unread {\n        ...NotificationCountFragment\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateRCloneRemote($input: CreateRCloneRemoteInput!) {\n    rclone {\n      createRCloneRemote(input: $input) {\n        name\n        type\n        parameters\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateRCloneRemote($input: CreateRCloneRemoteInput!) {\n    rclone {\n      createRCloneRemote(input: $input) {\n        name\n        type\n        parameters\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteRCloneRemote($input: DeleteRCloneRemoteInput!) {\n    rclone {\n      deleteRCloneRemote(input: $input)\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteRCloneRemote($input: DeleteRCloneRemoteInput!) {\n    rclone {\n      deleteRCloneRemote(input: $input)\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetRCloneConfigForm($formOptions: RCloneConfigFormInput) {\n    rclone {\n      configForm(formOptions: $formOptions) {\n        id\n        dataSchema\n        uiSchema\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetRCloneConfigForm($formOptions: RCloneConfigFormInput) {\n    rclone {\n      configForm(formOptions: $formOptions) {\n        id\n        dataSchema\n        uiSchema\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ListRCloneRemotes {\n    rclone {\n      remotes {\n        name\n        type\n        parameters\n        config\n      }\n    }\n  }\n"): (typeof documents)["\n  query ListRCloneRemotes {\n    rclone {\n      remotes {\n        name\n        type\n        parameters\n        config\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ConnectSignIn($input: ConnectSignInInput!) {\n    connectSignIn(input: $input)\n  }\n"): (typeof documents)["\n  mutation ConnectSignIn($input: ConnectSignInInput!) {\n    connectSignIn(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SignOut {\n    connectSignOut\n  }\n"): (typeof documents)["\n  mutation SignOut {\n    connectSignOut\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query IsSSOEnabled {\n    isSSOEnabled\n  }\n"): (typeof documents)["\n  query IsSSOEnabled {\n    isSSOEnabled\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment PartialCloud on Cloud {\n    error\n    apiKey {\n      valid\n      error\n    }\n    cloud {\n      status\n      error\n    }\n    minigraphql {\n      status\n      error\n    }\n    relay {\n      status\n      error\n    }\n  }\n"): (typeof documents)["\n  fragment PartialCloud on Cloud {\n    error\n    apiKey {\n      valid\n      error\n    }\n    cloud {\n      status\n      error\n    }\n    minigraphql {\n      status\n      error\n    }\n    relay {\n      status\n      error\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query cloudState {\n    cloud {\n      ...PartialCloud\n    }\n  }\n"): (typeof documents)["\n  query cloudState {\n    cloud {\n      ...PartialCloud\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query serverState {\n    config {\n      error\n      valid\n    }\n    info {\n      os {\n        hostname\n      }\n    }\n    owner {\n      avatar\n      username\n    }\n    registration {\n      state\n      expiration\n      keyFile {\n        contents\n      }\n      updateExpiration\n    }\n    vars {\n      regGen\n      regState\n      configError\n      configValid\n    }\n  }\n"): (typeof documents)["\n  query serverState {\n    config {\n      error\n      valid\n    }\n    info {\n      os {\n        hostname\n      }\n    }\n    owner {\n      avatar\n      username\n    }\n    registration {\n      state\n      expiration\n      keyFile {\n        contents\n      }\n      updateExpiration\n    }\n    vars {\n      regGen\n      regState\n      configError\n      configValid\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query getTheme {\n    publicTheme {\n      name\n      showBannerImage\n      showBannerGradient\n      headerBackgroundColor\n      showHeaderDescription\n      headerPrimaryTextColor\n      headerSecondaryTextColor\n    }\n  }\n"): (typeof documents)["\n  query getTheme {\n    publicTheme {\n      name\n      showBannerImage\n      showBannerGradient\n      headerBackgroundColor\n      showHeaderDescription\n      headerPrimaryTextColor\n      headerSecondaryTextColor\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;