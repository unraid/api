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
    "\n  query ApiKeys {\n    apiKeys {\n      id\n      name\n      description\n      createdAt\n      roles\n      permissions {\n        resource\n        actions\n      }\n    }\n  }\n": typeof types.ApiKeysDocument,
    "\n  mutation CreateApiKey($input: CreateApiKeyInput!) {\n    apiKey {\n      create(input: $input) {\n        id\n        key\n        name\n        description\n        createdAt\n        roles\n        permissions {\n          resource\n          actions\n        }\n      }\n    }\n  }\n": typeof types.CreateApiKeyDocument,
    "\n  mutation DeleteApiKey($input: DeleteApiKeyInput!) {\n    apiKey {\n      delete(input: $input)\n    }\n  }\n": typeof types.DeleteApiKeyDocument,
    "\n  query ApiKeyMeta {\n    apiKeyPossibleRoles\n    apiKeyPossiblePermissions {\n      resource\n      actions\n    }\n  }\n": typeof types.ApiKeyMetaDocument,
    "\n  fragment BackupStats on RCloneJobStats {\n    bytes\n    speed\n    eta\n    elapsedTime\n    percentage\n    checks\n    deletes\n    errors\n    fatalError\n    lastError\n    renames\n    retryError\n    serverSideCopies\n    serverSideCopyBytes\n    serverSideMoves\n    serverSideMoveBytes\n    totalBytes\n    totalChecks\n    totalTransfers\n    transferTime\n    transfers\n    transferring\n    checking\n    formattedBytes\n    formattedSpeed\n    formattedElapsedTime\n    formattedEta\n    calculatedPercentage\n    isActivelyRunning\n    isCompleted\n  }\n": typeof types.BackupStatsFragmentDoc,
    "\n  fragment RCloneJob on RCloneJob {\n    id\n    group\n    configId\n    finished\n    success\n    error\n    status\n    stats {\n      ...BackupStats\n    }\n  }\n": typeof types.RCloneJobFragmentDoc,
    "\n  fragment BackupConfig on BackupConfig {\n    timeout\n    cleanupOnFailure\n    zfsConfig {\n      poolName\n      datasetName\n      snapshotPrefix\n      cleanupSnapshots\n      retainSnapshots\n    }\n    flashConfig {\n      flashPath\n      includeGitHistory\n      additionalPaths\n    }\n    scriptConfig {\n      scriptPath\n      scriptArgs\n      workingDirectory\n      environment\n      outputPath\n    }\n    rawConfig {\n      sourcePath\n      excludePatterns\n      includePatterns\n    }\n  }\n": typeof types.BackupConfigFragmentDoc,
    "\n  fragment BackupJobConfig on BackupJobConfig {\n    id\n    name\n    backupType\n    remoteName\n    destinationPath\n    schedule\n    enabled\n    rcloneOptions\n    backupConfig {\n      ...BackupConfig\n    }\n    createdAt\n    updatedAt\n    lastRunAt\n    lastRunStatus\n    currentJobId\n  }\n": typeof types.BackupJobConfigFragmentDoc,
    "\n  fragment BackupJobConfigWithCurrentJob on BackupJobConfig {\n    ...BackupJobConfig\n    currentJob {\n      ...RCloneJob\n    }\n  }\n": typeof types.BackupJobConfigWithCurrentJobFragmentDoc,
    "\n  query BackupJobs {\n    backup {\n      id\n      jobs {\n        ...RCloneJob\n      }\n    }\n  }\n": typeof types.BackupJobsDocument,
    "\n  query BackupJob($id: PrefixedID!) {\n    backupJob(id: $id) {\n      ...RCloneJob\n    }\n  }\n": typeof types.BackupJobDocument,
    "\n  query BackupJobConfig($id: PrefixedID!) {\n    backupJobConfig(id: $id) {\n      ...BackupJobConfigWithCurrentJob\n    }\n  }\n": typeof types.BackupJobConfigDocument,
    "\n  query BackupJobConfigs {\n    backup {\n      id\n      configs {\n        ...BackupJobConfigWithCurrentJob\n      }\n    }\n  }\n": typeof types.BackupJobConfigsDocument,
    "\n  query BackupJobConfigsList {\n    backup {\n      id\n      configs {\n        id\n        name\n      }\n    }\n  }\n": typeof types.BackupJobConfigsListDocument,
    "\n  query BackupJobConfigForm($input: BackupJobConfigFormInput) {\n    backupJobConfigForm(input: $input) {\n      id\n      dataSchema\n      uiSchema\n    }\n  }\n": typeof types.BackupJobConfigFormDocument,
    "\n  mutation CreateBackupJobConfig($input: CreateBackupJobConfigInput!) {\n    backup {\n      createBackupJobConfig(input: $input) {\n        ...BackupJobConfig\n      }\n    }\n  }\n": typeof types.CreateBackupJobConfigDocument,
    "\n  mutation UpdateBackupJobConfig($id: PrefixedID!, $input: UpdateBackupJobConfigInput!) {\n    backup {\n      updateBackupJobConfig(id: $id, input: $input) {\n        ...BackupJobConfig\n      }\n    }\n  }\n": typeof types.UpdateBackupJobConfigDocument,
    "\n  mutation DeleteBackupJobConfig($id: PrefixedID!) {\n    backup {\n      deleteBackupJobConfig(id: $id)\n    }\n  }\n": typeof types.DeleteBackupJobConfigDocument,
    "\n  mutation ToggleBackupJobConfig($id: PrefixedID!) {\n    backup {\n      toggleJobConfig(id: $id) {\n        ...BackupJobConfig\n      }\n    }\n  }\n": typeof types.ToggleBackupJobConfigDocument,
    "\n  mutation TriggerBackupJob($id: PrefixedID!) {\n    backup {\n      triggerJob(id: $id) {\n        jobId\n      }\n    }\n  }\n": typeof types.TriggerBackupJobDocument,
    "\n  mutation StopBackupJob($id: PrefixedID!) {\n    backup {\n      stopBackupJob(id: $id) {\n        status\n        jobId\n      }\n    }\n  }\n": typeof types.StopBackupJobDocument,
    "\n  mutation InitiateBackup($input: InitiateBackupInput!) {\n    backup {\n      initiateBackup(input: $input) {\n        status\n        jobId\n      }\n    }\n  }\n": typeof types.InitiateBackupDocument,
    "\n  subscription BackupJobProgress($id: PrefixedID!) {\n    backupJobProgress(id: $id) {\n      id\n      stats {\n        ...BackupStats\n      }\n    }\n  }\n": typeof types.BackupJobProgressDocument,
    "\n  query GetConnectSettingsForm {\n    connect {\n      id\n      settings {\n        id\n        dataSchema\n        uiSchema\n        values {\n          sandbox\n          extraOrigins\n          accessType\n          forwardType\n          port\n          ssoUserIds\n        }\n      }\n    }\n  }\n": typeof types.GetConnectSettingsFormDocument,
    "\n  mutation UpdateConnectSettings($input: ApiSettingsInput!) {\n    updateApiSettings(input: $input) {\n      sandbox\n      extraOrigins\n      accessType\n      forwardType\n      port\n      ssoUserIds\n    }\n  }\n": typeof types.UpdateConnectSettingsDocument,
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
    "\n  fragment PartialCloud on Cloud {\n    error\n    apiKey {\n      valid\n      error\n    }\n    cloud {\n      status\n      error\n    }\n    minigraphql {\n      status\n      error\n    }\n    relay {\n      status\n      error\n    }\n  }\n": typeof types.PartialCloudFragmentDoc,
    "\n  query serverState {\n    cloud {\n      ...PartialCloud\n    }\n    config {\n      error\n      valid\n    }\n    info {\n      os {\n        hostname\n      }\n    }\n    owner {\n      avatar\n      username\n    }\n    registration {\n      state\n      expiration\n      keyFile {\n        contents\n      }\n      updateExpiration\n    }\n    vars {\n      regGen\n      regState\n      configError\n      configValid\n    }\n  }\n": typeof types.ServerStateDocument,
    "\n  query getTheme {\n    publicTheme {\n      name\n      showBannerImage\n      showBannerGradient\n      headerBackgroundColor\n      showHeaderDescription\n      headerPrimaryTextColor\n      headerSecondaryTextColor\n    }\n  }\n": typeof types.GetThemeDocument,
    "\n  query getExtraAllowedOrigins {\n    extraAllowedOrigins\n  }\n": typeof types.GetExtraAllowedOriginsDocument,
    "\n  query getRemoteAccess {\n    remoteAccess {\n      accessType\n      forwardType\n      port\n    }\n  }\n": typeof types.GetRemoteAccessDocument,
    "\n  mutation setAdditionalAllowedOrigins($input: AllowedOriginInput!) {\n    setAdditionalAllowedOrigins(input: $input)\n  }\n": typeof types.SetAdditionalAllowedOriginsDocument,
    "\n    mutation setupRemoteAccess($input: SetupRemoteAccessInput!) {\n        setupRemoteAccess(input: $input)\n    }\n": typeof types.SetupRemoteAccessDocument,
};
const documents: Documents = {
    "\n  query PartnerInfo {\n    publicPartnerInfo {\n      hasPartnerLogo\n      partnerName\n      partnerUrl\n      partnerLogoUrl\n    }\n  }\n": types.PartnerInfoDocument,
    "\n  query ActivationCode {\n    vars {\n      regState\n    }\n    customization {\n      activationCode {\n        code\n        partnerName\n        serverName\n        sysModel\n        comment\n        header\n        headermetacolor\n        background\n        showBannerGradient\n        theme\n      }\n      partnerInfo {\n        hasPartnerLogo\n        partnerName\n        partnerUrl\n        partnerLogoUrl\n      }\n    }\n  }\n": types.ActivationCodeDocument,
    "\n  query ApiKeys {\n    apiKeys {\n      id\n      name\n      description\n      createdAt\n      roles\n      permissions {\n        resource\n        actions\n      }\n    }\n  }\n": types.ApiKeysDocument,
    "\n  mutation CreateApiKey($input: CreateApiKeyInput!) {\n    apiKey {\n      create(input: $input) {\n        id\n        key\n        name\n        description\n        createdAt\n        roles\n        permissions {\n          resource\n          actions\n        }\n      }\n    }\n  }\n": types.CreateApiKeyDocument,
    "\n  mutation DeleteApiKey($input: DeleteApiKeyInput!) {\n    apiKey {\n      delete(input: $input)\n    }\n  }\n": types.DeleteApiKeyDocument,
    "\n  query ApiKeyMeta {\n    apiKeyPossibleRoles\n    apiKeyPossiblePermissions {\n      resource\n      actions\n    }\n  }\n": types.ApiKeyMetaDocument,
    "\n  fragment BackupStats on RCloneJobStats {\n    bytes\n    speed\n    eta\n    elapsedTime\n    percentage\n    checks\n    deletes\n    errors\n    fatalError\n    lastError\n    renames\n    retryError\n    serverSideCopies\n    serverSideCopyBytes\n    serverSideMoves\n    serverSideMoveBytes\n    totalBytes\n    totalChecks\n    totalTransfers\n    transferTime\n    transfers\n    transferring\n    checking\n    formattedBytes\n    formattedSpeed\n    formattedElapsedTime\n    formattedEta\n    calculatedPercentage\n    isActivelyRunning\n    isCompleted\n  }\n": types.BackupStatsFragmentDoc,
    "\n  fragment RCloneJob on RCloneJob {\n    id\n    group\n    configId\n    finished\n    success\n    error\n    status\n    stats {\n      ...BackupStats\n    }\n  }\n": types.RCloneJobFragmentDoc,
    "\n  fragment BackupConfig on BackupConfig {\n    timeout\n    cleanupOnFailure\n    zfsConfig {\n      poolName\n      datasetName\n      snapshotPrefix\n      cleanupSnapshots\n      retainSnapshots\n    }\n    flashConfig {\n      flashPath\n      includeGitHistory\n      additionalPaths\n    }\n    scriptConfig {\n      scriptPath\n      scriptArgs\n      workingDirectory\n      environment\n      outputPath\n    }\n    rawConfig {\n      sourcePath\n      excludePatterns\n      includePatterns\n    }\n  }\n": types.BackupConfigFragmentDoc,
    "\n  fragment BackupJobConfig on BackupJobConfig {\n    id\n    name\n    backupType\n    remoteName\n    destinationPath\n    schedule\n    enabled\n    rcloneOptions\n    backupConfig {\n      ...BackupConfig\n    }\n    createdAt\n    updatedAt\n    lastRunAt\n    lastRunStatus\n    currentJobId\n  }\n": types.BackupJobConfigFragmentDoc,
    "\n  fragment BackupJobConfigWithCurrentJob on BackupJobConfig {\n    ...BackupJobConfig\n    currentJob {\n      ...RCloneJob\n    }\n  }\n": types.BackupJobConfigWithCurrentJobFragmentDoc,
    "\n  query BackupJobs {\n    backup {\n      id\n      jobs {\n        ...RCloneJob\n      }\n    }\n  }\n": types.BackupJobsDocument,
    "\n  query BackupJob($id: PrefixedID!) {\n    backupJob(id: $id) {\n      ...RCloneJob\n    }\n  }\n": types.BackupJobDocument,
    "\n  query BackupJobConfig($id: PrefixedID!) {\n    backupJobConfig(id: $id) {\n      ...BackupJobConfigWithCurrentJob\n    }\n  }\n": types.BackupJobConfigDocument,
    "\n  query BackupJobConfigs {\n    backup {\n      id\n      configs {\n        ...BackupJobConfigWithCurrentJob\n      }\n    }\n  }\n": types.BackupJobConfigsDocument,
    "\n  query BackupJobConfigsList {\n    backup {\n      id\n      configs {\n        id\n        name\n      }\n    }\n  }\n": types.BackupJobConfigsListDocument,
    "\n  query BackupJobConfigForm($input: BackupJobConfigFormInput) {\n    backupJobConfigForm(input: $input) {\n      id\n      dataSchema\n      uiSchema\n    }\n  }\n": types.BackupJobConfigFormDocument,
    "\n  mutation CreateBackupJobConfig($input: CreateBackupJobConfigInput!) {\n    backup {\n      createBackupJobConfig(input: $input) {\n        ...BackupJobConfig\n      }\n    }\n  }\n": types.CreateBackupJobConfigDocument,
    "\n  mutation UpdateBackupJobConfig($id: PrefixedID!, $input: UpdateBackupJobConfigInput!) {\n    backup {\n      updateBackupJobConfig(id: $id, input: $input) {\n        ...BackupJobConfig\n      }\n    }\n  }\n": types.UpdateBackupJobConfigDocument,
    "\n  mutation DeleteBackupJobConfig($id: PrefixedID!) {\n    backup {\n      deleteBackupJobConfig(id: $id)\n    }\n  }\n": types.DeleteBackupJobConfigDocument,
    "\n  mutation ToggleBackupJobConfig($id: PrefixedID!) {\n    backup {\n      toggleJobConfig(id: $id) {\n        ...BackupJobConfig\n      }\n    }\n  }\n": types.ToggleBackupJobConfigDocument,
    "\n  mutation TriggerBackupJob($id: PrefixedID!) {\n    backup {\n      triggerJob(id: $id) {\n        jobId\n      }\n    }\n  }\n": types.TriggerBackupJobDocument,
    "\n  mutation StopBackupJob($id: PrefixedID!) {\n    backup {\n      stopBackupJob(id: $id) {\n        status\n        jobId\n      }\n    }\n  }\n": types.StopBackupJobDocument,
    "\n  mutation InitiateBackup($input: InitiateBackupInput!) {\n    backup {\n      initiateBackup(input: $input) {\n        status\n        jobId\n      }\n    }\n  }\n": types.InitiateBackupDocument,
    "\n  subscription BackupJobProgress($id: PrefixedID!) {\n    backupJobProgress(id: $id) {\n      id\n      stats {\n        ...BackupStats\n      }\n    }\n  }\n": types.BackupJobProgressDocument,
    "\n  query GetConnectSettingsForm {\n    connect {\n      id\n      settings {\n        id\n        dataSchema\n        uiSchema\n        values {\n          sandbox\n          extraOrigins\n          accessType\n          forwardType\n          port\n          ssoUserIds\n        }\n      }\n    }\n  }\n": types.GetConnectSettingsFormDocument,
    "\n  mutation UpdateConnectSettings($input: ApiSettingsInput!) {\n    updateApiSettings(input: $input) {\n      sandbox\n      extraOrigins\n      accessType\n      forwardType\n      port\n      ssoUserIds\n    }\n  }\n": types.UpdateConnectSettingsDocument,
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
    "\n  fragment PartialCloud on Cloud {\n    error\n    apiKey {\n      valid\n      error\n    }\n    cloud {\n      status\n      error\n    }\n    minigraphql {\n      status\n      error\n    }\n    relay {\n      status\n      error\n    }\n  }\n": types.PartialCloudFragmentDoc,
    "\n  query serverState {\n    cloud {\n      ...PartialCloud\n    }\n    config {\n      error\n      valid\n    }\n    info {\n      os {\n        hostname\n      }\n    }\n    owner {\n      avatar\n      username\n    }\n    registration {\n      state\n      expiration\n      keyFile {\n        contents\n      }\n      updateExpiration\n    }\n    vars {\n      regGen\n      regState\n      configError\n      configValid\n    }\n  }\n": types.ServerStateDocument,
    "\n  query getTheme {\n    publicTheme {\n      name\n      showBannerImage\n      showBannerGradient\n      headerBackgroundColor\n      showHeaderDescription\n      headerPrimaryTextColor\n      headerSecondaryTextColor\n    }\n  }\n": types.GetThemeDocument,
    "\n  query getExtraAllowedOrigins {\n    extraAllowedOrigins\n  }\n": types.GetExtraAllowedOriginsDocument,
    "\n  query getRemoteAccess {\n    remoteAccess {\n      accessType\n      forwardType\n      port\n    }\n  }\n": types.GetRemoteAccessDocument,
    "\n  mutation setAdditionalAllowedOrigins($input: AllowedOriginInput!) {\n    setAdditionalAllowedOrigins(input: $input)\n  }\n": types.SetAdditionalAllowedOriginsDocument,
    "\n    mutation setupRemoteAccess($input: SetupRemoteAccessInput!) {\n        setupRemoteAccess(input: $input)\n    }\n": types.SetupRemoteAccessDocument,
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
export function graphql(source: "\n  query ApiKeys {\n    apiKeys {\n      id\n      name\n      description\n      createdAt\n      roles\n      permissions {\n        resource\n        actions\n      }\n    }\n  }\n"): (typeof documents)["\n  query ApiKeys {\n    apiKeys {\n      id\n      name\n      description\n      createdAt\n      roles\n      permissions {\n        resource\n        actions\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateApiKey($input: CreateApiKeyInput!) {\n    apiKey {\n      create(input: $input) {\n        id\n        key\n        name\n        description\n        createdAt\n        roles\n        permissions {\n          resource\n          actions\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateApiKey($input: CreateApiKeyInput!) {\n    apiKey {\n      create(input: $input) {\n        id\n        key\n        name\n        description\n        createdAt\n        roles\n        permissions {\n          resource\n          actions\n        }\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  fragment BackupStats on RCloneJobStats {\n    bytes\n    speed\n    eta\n    elapsedTime\n    percentage\n    checks\n    deletes\n    errors\n    fatalError\n    lastError\n    renames\n    retryError\n    serverSideCopies\n    serverSideCopyBytes\n    serverSideMoves\n    serverSideMoveBytes\n    totalBytes\n    totalChecks\n    totalTransfers\n    transferTime\n    transfers\n    transferring\n    checking\n    formattedBytes\n    formattedSpeed\n    formattedElapsedTime\n    formattedEta\n    calculatedPercentage\n    isActivelyRunning\n    isCompleted\n  }\n"): (typeof documents)["\n  fragment BackupStats on RCloneJobStats {\n    bytes\n    speed\n    eta\n    elapsedTime\n    percentage\n    checks\n    deletes\n    errors\n    fatalError\n    lastError\n    renames\n    retryError\n    serverSideCopies\n    serverSideCopyBytes\n    serverSideMoves\n    serverSideMoveBytes\n    totalBytes\n    totalChecks\n    totalTransfers\n    transferTime\n    transfers\n    transferring\n    checking\n    formattedBytes\n    formattedSpeed\n    formattedElapsedTime\n    formattedEta\n    calculatedPercentage\n    isActivelyRunning\n    isCompleted\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment RCloneJob on RCloneJob {\n    id\n    group\n    configId\n    finished\n    success\n    error\n    status\n    stats {\n      ...BackupStats\n    }\n  }\n"): (typeof documents)["\n  fragment RCloneJob on RCloneJob {\n    id\n    group\n    configId\n    finished\n    success\n    error\n    status\n    stats {\n      ...BackupStats\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment BackupConfig on BackupConfig {\n    timeout\n    cleanupOnFailure\n    zfsConfig {\n      poolName\n      datasetName\n      snapshotPrefix\n      cleanupSnapshots\n      retainSnapshots\n    }\n    flashConfig {\n      flashPath\n      includeGitHistory\n      additionalPaths\n    }\n    scriptConfig {\n      scriptPath\n      scriptArgs\n      workingDirectory\n      environment\n      outputPath\n    }\n    rawConfig {\n      sourcePath\n      excludePatterns\n      includePatterns\n    }\n  }\n"): (typeof documents)["\n  fragment BackupConfig on BackupConfig {\n    timeout\n    cleanupOnFailure\n    zfsConfig {\n      poolName\n      datasetName\n      snapshotPrefix\n      cleanupSnapshots\n      retainSnapshots\n    }\n    flashConfig {\n      flashPath\n      includeGitHistory\n      additionalPaths\n    }\n    scriptConfig {\n      scriptPath\n      scriptArgs\n      workingDirectory\n      environment\n      outputPath\n    }\n    rawConfig {\n      sourcePath\n      excludePatterns\n      includePatterns\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment BackupJobConfig on BackupJobConfig {\n    id\n    name\n    backupType\n    remoteName\n    destinationPath\n    schedule\n    enabled\n    rcloneOptions\n    backupConfig {\n      ...BackupConfig\n    }\n    createdAt\n    updatedAt\n    lastRunAt\n    lastRunStatus\n    currentJobId\n  }\n"): (typeof documents)["\n  fragment BackupJobConfig on BackupJobConfig {\n    id\n    name\n    backupType\n    remoteName\n    destinationPath\n    schedule\n    enabled\n    rcloneOptions\n    backupConfig {\n      ...BackupConfig\n    }\n    createdAt\n    updatedAt\n    lastRunAt\n    lastRunStatus\n    currentJobId\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment BackupJobConfigWithCurrentJob on BackupJobConfig {\n    ...BackupJobConfig\n    currentJob {\n      ...RCloneJob\n    }\n  }\n"): (typeof documents)["\n  fragment BackupJobConfigWithCurrentJob on BackupJobConfig {\n    ...BackupJobConfig\n    currentJob {\n      ...RCloneJob\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query BackupJobs {\n    backup {\n      id\n      jobs {\n        ...RCloneJob\n      }\n    }\n  }\n"): (typeof documents)["\n  query BackupJobs {\n    backup {\n      id\n      jobs {\n        ...RCloneJob\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query BackupJob($id: PrefixedID!) {\n    backupJob(id: $id) {\n      ...RCloneJob\n    }\n  }\n"): (typeof documents)["\n  query BackupJob($id: PrefixedID!) {\n    backupJob(id: $id) {\n      ...RCloneJob\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query BackupJobConfig($id: PrefixedID!) {\n    backupJobConfig(id: $id) {\n      ...BackupJobConfigWithCurrentJob\n    }\n  }\n"): (typeof documents)["\n  query BackupJobConfig($id: PrefixedID!) {\n    backupJobConfig(id: $id) {\n      ...BackupJobConfigWithCurrentJob\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query BackupJobConfigs {\n    backup {\n      id\n      configs {\n        ...BackupJobConfigWithCurrentJob\n      }\n    }\n  }\n"): (typeof documents)["\n  query BackupJobConfigs {\n    backup {\n      id\n      configs {\n        ...BackupJobConfigWithCurrentJob\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query BackupJobConfigsList {\n    backup {\n      id\n      configs {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query BackupJobConfigsList {\n    backup {\n      id\n      configs {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query BackupJobConfigForm($input: BackupJobConfigFormInput) {\n    backupJobConfigForm(input: $input) {\n      id\n      dataSchema\n      uiSchema\n    }\n  }\n"): (typeof documents)["\n  query BackupJobConfigForm($input: BackupJobConfigFormInput) {\n    backupJobConfigForm(input: $input) {\n      id\n      dataSchema\n      uiSchema\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateBackupJobConfig($input: CreateBackupJobConfigInput!) {\n    backup {\n      createBackupJobConfig(input: $input) {\n        ...BackupJobConfig\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateBackupJobConfig($input: CreateBackupJobConfigInput!) {\n    backup {\n      createBackupJobConfig(input: $input) {\n        ...BackupJobConfig\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateBackupJobConfig($id: PrefixedID!, $input: UpdateBackupJobConfigInput!) {\n    backup {\n      updateBackupJobConfig(id: $id, input: $input) {\n        ...BackupJobConfig\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateBackupJobConfig($id: PrefixedID!, $input: UpdateBackupJobConfigInput!) {\n    backup {\n      updateBackupJobConfig(id: $id, input: $input) {\n        ...BackupJobConfig\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteBackupJobConfig($id: PrefixedID!) {\n    backup {\n      deleteBackupJobConfig(id: $id)\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteBackupJobConfig($id: PrefixedID!) {\n    backup {\n      deleteBackupJobConfig(id: $id)\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ToggleBackupJobConfig($id: PrefixedID!) {\n    backup {\n      toggleJobConfig(id: $id) {\n        ...BackupJobConfig\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation ToggleBackupJobConfig($id: PrefixedID!) {\n    backup {\n      toggleJobConfig(id: $id) {\n        ...BackupJobConfig\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TriggerBackupJob($id: PrefixedID!) {\n    backup {\n      triggerJob(id: $id) {\n        jobId\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation TriggerBackupJob($id: PrefixedID!) {\n    backup {\n      triggerJob(id: $id) {\n        jobId\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation StopBackupJob($id: PrefixedID!) {\n    backup {\n      stopBackupJob(id: $id) {\n        status\n        jobId\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation StopBackupJob($id: PrefixedID!) {\n    backup {\n      stopBackupJob(id: $id) {\n        status\n        jobId\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation InitiateBackup($input: InitiateBackupInput!) {\n    backup {\n      initiateBackup(input: $input) {\n        status\n        jobId\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation InitiateBackup($input: InitiateBackupInput!) {\n    backup {\n      initiateBackup(input: $input) {\n        status\n        jobId\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription BackupJobProgress($id: PrefixedID!) {\n    backupJobProgress(id: $id) {\n      id\n      stats {\n        ...BackupStats\n      }\n    }\n  }\n"): (typeof documents)["\n  subscription BackupJobProgress($id: PrefixedID!) {\n    backupJobProgress(id: $id) {\n      id\n      stats {\n        ...BackupStats\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetConnectSettingsForm {\n    connect {\n      id\n      settings {\n        id\n        dataSchema\n        uiSchema\n        values {\n          sandbox\n          extraOrigins\n          accessType\n          forwardType\n          port\n          ssoUserIds\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetConnectSettingsForm {\n    connect {\n      id\n      settings {\n        id\n        dataSchema\n        uiSchema\n        values {\n          sandbox\n          extraOrigins\n          accessType\n          forwardType\n          port\n          ssoUserIds\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateConnectSettings($input: ApiSettingsInput!) {\n    updateApiSettings(input: $input) {\n      sandbox\n      extraOrigins\n      accessType\n      forwardType\n      port\n      ssoUserIds\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateConnectSettings($input: ApiSettingsInput!) {\n    updateApiSettings(input: $input) {\n      sandbox\n      extraOrigins\n      accessType\n      forwardType\n      port\n      ssoUserIds\n    }\n  }\n"];
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
export function graphql(source: "\n  fragment PartialCloud on Cloud {\n    error\n    apiKey {\n      valid\n      error\n    }\n    cloud {\n      status\n      error\n    }\n    minigraphql {\n      status\n      error\n    }\n    relay {\n      status\n      error\n    }\n  }\n"): (typeof documents)["\n  fragment PartialCloud on Cloud {\n    error\n    apiKey {\n      valid\n      error\n    }\n    cloud {\n      status\n      error\n    }\n    minigraphql {\n      status\n      error\n    }\n    relay {\n      status\n      error\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query serverState {\n    cloud {\n      ...PartialCloud\n    }\n    config {\n      error\n      valid\n    }\n    info {\n      os {\n        hostname\n      }\n    }\n    owner {\n      avatar\n      username\n    }\n    registration {\n      state\n      expiration\n      keyFile {\n        contents\n      }\n      updateExpiration\n    }\n    vars {\n      regGen\n      regState\n      configError\n      configValid\n    }\n  }\n"): (typeof documents)["\n  query serverState {\n    cloud {\n      ...PartialCloud\n    }\n    config {\n      error\n      valid\n    }\n    info {\n      os {\n        hostname\n      }\n    }\n    owner {\n      avatar\n      username\n    }\n    registration {\n      state\n      expiration\n      keyFile {\n        contents\n      }\n      updateExpiration\n    }\n    vars {\n      regGen\n      regState\n      configError\n      configValid\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query getTheme {\n    publicTheme {\n      name\n      showBannerImage\n      showBannerGradient\n      headerBackgroundColor\n      showHeaderDescription\n      headerPrimaryTextColor\n      headerSecondaryTextColor\n    }\n  }\n"): (typeof documents)["\n  query getTheme {\n    publicTheme {\n      name\n      showBannerImage\n      showBannerGradient\n      headerBackgroundColor\n      showHeaderDescription\n      headerPrimaryTextColor\n      headerSecondaryTextColor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query getExtraAllowedOrigins {\n    extraAllowedOrigins\n  }\n"): (typeof documents)["\n  query getExtraAllowedOrigins {\n    extraAllowedOrigins\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query getRemoteAccess {\n    remoteAccess {\n      accessType\n      forwardType\n      port\n    }\n  }\n"): (typeof documents)["\n  query getRemoteAccess {\n    remoteAccess {\n      accessType\n      forwardType\n      port\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation setAdditionalAllowedOrigins($input: AllowedOriginInput!) {\n    setAdditionalAllowedOrigins(input: $input)\n  }\n"): (typeof documents)["\n  mutation setAdditionalAllowedOrigins($input: AllowedOriginInput!) {\n    setAdditionalAllowedOrigins(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation setupRemoteAccess($input: SetupRemoteAccessInput!) {\n        setupRemoteAccess(input: $input)\n    }\n"): (typeof documents)["\n    mutation setupRemoteAccess($input: SetupRemoteAccessInput!) {\n        setupRemoteAccess(input: $input)\n    }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;