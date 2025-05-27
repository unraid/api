import { graphql } from '~/composables/gql/gql';

export const BACKUP_STATS_FRAGMENT = graphql(/* GraphQL */ `
  fragment BackupStats on RCloneJobStats {
    bytes
    speed
    eta
    elapsedTime
    percentage
    checks
    deletes
    errors
    fatalError
    lastError
    renames
    retryError
    serverSideCopies
    serverSideCopyBytes
    serverSideMoves
    serverSideMoveBytes
    totalBytes
    totalChecks
    totalTransfers
    transferTime
    transfers
    transferring
    checking
    formattedBytes
    formattedSpeed
    formattedElapsedTime
    formattedEta
    calculatedPercentage
    isActivelyRunning
    isCompleted
  }
`);

export const RCLONE_JOB_FRAGMENT = graphql(/* GraphQL */ `
  fragment RCloneJob on RCloneJob {
    id
    group
    configId
    finished
    success
    error
    status
    stats {
      ...BackupStats
    }
  }
`);

export const SOURCE_CONFIG_FRAGMENT = graphql(/* GraphQL */ `
  fragment SourceConfig on SourceConfig {
    timeout
    cleanupOnFailure
    zfsConfig {
      poolName
      datasetName
      snapshotPrefix
      cleanupSnapshots
      retainSnapshots
    }
    flashConfig {
      flashPath
      includeGitHistory
      additionalPaths
    }
    scriptConfig {
      scriptPath
      scriptArgs
      workingDirectory
      environment
      outputPath
    }
    rawConfig {
      sourcePath
      excludePatterns
      includePatterns
    }
  }
`);

export const BACKUP_JOB_CONFIG_FRAGMENT = graphql(/* GraphQL */ `
  fragment BackupJobConfig on BackupJobConfig {
    id
    name
    backupType
    remoteName
    destinationPath
    schedule
    enabled
    rcloneOptions
    sourceConfig {
      ...SourceConfig
    }
    createdAt
    updatedAt
    lastRunAt
    lastRunStatus
    currentJobId
  }
`);

export const BACKUP_JOB_CONFIG_WITH_CURRENT_JOB_FRAGMENT = graphql(/* GraphQL */ `
  fragment BackupJobConfigWithCurrentJob on BackupJobConfig {
    ...BackupJobConfig
    currentJob {
      ...RCloneJob
    }
  }
`);

export const BACKUP_JOBS_QUERY = graphql(/* GraphQL */ `
  query BackupJobs {
    backup {
      id
      jobs {
        ...RCloneJob
      }
    }
  }
`);

export const BACKUP_JOB_QUERY = graphql(/* GraphQL */ `
  query BackupJob($id: PrefixedID!) {
    backupJob(id: $id) {
      ...RCloneJob
    }
  }
`);

export const BACKUP_JOB_CONFIG_QUERY = graphql(/* GraphQL */ `
  query BackupJobConfig($id: PrefixedID!) {
    backupJobConfig(id: $id) {
      ...BackupJobConfigWithCurrentJob
    }
  }
`);

export const BACKUP_JOB_CONFIGS_QUERY = graphql(/* GraphQL */ `
  query BackupJobConfigs {
    backup {
      id
      configs {
        ...BackupJobConfigWithCurrentJob
      }
    }
  }
`);

export const BACKUP_JOB_CONFIGS_LIST_QUERY = graphql(/* GraphQL */ `
  query BackupJobConfigsList {
    backup {
      id
      configs {
        id
        name
      }
    }
  }
`);

export const BACKUP_JOB_CONFIG_FORM_QUERY = graphql(/* GraphQL */ `
  query BackupJobConfigForm($input: BackupJobConfigFormInput) {
    backupJobConfigForm(input: $input) {
      id
      dataSchema
      uiSchema
    }
  }
`);

export const CREATE_BACKUP_JOB_CONFIG_MUTATION = graphql(/* GraphQL */ `
  mutation CreateBackupJobConfig($input: CreateBackupJobConfigInput!) {
    backup {
      createBackupJobConfig(input: $input) {
        ...BackupJobConfig
      }
    }
  }
`);

export const UPDATE_BACKUP_JOB_CONFIG_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateBackupJobConfig($id: PrefixedID!, $input: UpdateBackupJobConfigInput!) {
    backup {
      updateBackupJobConfig(id: $id, input: $input) {
        ...BackupJobConfig
      }
    }
  }
`);

export const DELETE_BACKUP_JOB_CONFIG_MUTATION = graphql(/* GraphQL */ `
  mutation DeleteBackupJobConfig($id: PrefixedID!) {
    backup {
      deleteBackupJobConfig(id: $id)
    }
  }
`);

export const TOGGLE_BACKUP_JOB_CONFIG_MUTATION = graphql(/* GraphQL */ `
  mutation ToggleBackupJobConfig($id: PrefixedID!) {
    backup {
      toggleJobConfig(id: $id) {
        ...BackupJobConfig
      }
    }
  }
`);

export const TRIGGER_BACKUP_JOB_MUTATION = graphql(/* GraphQL */ `
  mutation TriggerBackupJob($id: PrefixedID!) {
    backup {
      triggerJob(id: $id) {
        jobId
      }
    }
  }
`);

export const STOP_BACKUP_JOB_MUTATION = graphql(/* GraphQL */ `
  mutation StopBackupJob($id: PrefixedID!) {
    backup {
      stopBackupJob(id: $id) {
        status
        jobId
      }
    }
  }
`);

export const INITIATE_BACKUP_MUTATION = graphql(/* GraphQL */ `
  mutation InitiateBackup($input: InitiateBackupInput!) {
    backup {
      initiateBackup(input: $input) {
        status
        jobId
      }
    }
  }
`);

export const BACKUP_JOB_PROGRESS_SUBSCRIPTION = graphql(/* GraphQL */ `
  subscription BackupJobProgress($id: PrefixedID!) {
    backupJobProgress(id: $id) {
      id
      stats {
        ...BackupStats
      }
    }
  }
`); 