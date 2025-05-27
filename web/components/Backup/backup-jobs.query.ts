import { graphql } from '~/composables/gql/gql';

export const JOB_STATUS_FRAGMENT = graphql(/* GraphQL */ `
  fragment JobStatus on JobStatus {
    id
    externalJobId
    name
    status
    progress
    message
    error
    startTime
    endTime
    bytesTransferred
    totalBytes
    speed
    elapsedTime
    eta
    formattedBytesTransferred
    formattedSpeed
    formattedElapsedTime
    formattedEta
  }
`);

export const SOURCE_CONFIG_FRAGMENT = graphql(/* GraphQL */ `
  fragment SourceConfig on SourceConfigUnion {
    ... on ZfsPreprocessConfig {
      label
      poolName
      datasetName
      snapshotPrefix
      cleanupSnapshots
      retainSnapshots
    }
    ... on FlashPreprocessConfig {
      label
      flashPath
      includeGitHistory
      additionalPaths
    }
    ... on ScriptPreprocessConfig {
      label
      scriptPath
      scriptArgs
      workingDirectory
      environment
      outputPath
    }
    ... on RawBackupConfig {
      label
      sourcePath
      excludePatterns
      includePatterns
    }
  }
`);

export const DESTINATION_CONFIG_FRAGMENT = graphql(/* GraphQL */ `
  fragment DestinationConfig on DestinationConfigUnion {
    ... on RcloneDestinationConfig {
      type
      remoteName
      destinationPath
      rcloneOptions
    }
  }
`);

export const BACKUP_JOB_CONFIG_FRAGMENT = graphql(/* GraphQL */ `
  fragment BackupJobConfig on BackupJobConfig {
    id
    name
    sourceType
    destinationType
    schedule
    enabled
    sourceConfig {
      ...SourceConfig
    }
    destinationConfig {
      ...DestinationConfig
    }
    createdAt
    updatedAt
    lastRunAt
    lastRunStatus
  }
`);

export const BACKUP_JOB_CONFIG_WITH_CURRENT_JOB_FRAGMENT = graphql(/* GraphQL */ `
  fragment BackupJobConfigWithCurrentJob on BackupJobConfig {
    ...BackupJobConfig
    currentJob {
      ...JobStatus
    }
  }
`);

export const BACKUP_JOBS_QUERY = graphql(/* GraphQL */ `
  query BackupJobs {
    backup {
      id
      jobs {
        ...JobStatus
      }
    }
  }
`);

export const BACKUP_JOB_QUERY = graphql(/* GraphQL */ `
  query BackupJob($id: PrefixedID!) {
    backupJob(id: $id) {
      ...JobStatus
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
